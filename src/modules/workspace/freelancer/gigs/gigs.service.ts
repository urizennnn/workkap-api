import { Gig, MediaType } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService, SlugService, WorkkapLogger } from 'libs';
import { GigSchemaType } from './dto';

@Injectable()
export class GigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly slugify: SlugService,
  ) {}

  async createGig(data: GigSchemaType, userId: string): Promise<Gig> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const freelancer = await tx.freelancer.findUnique({
          where: { uid: userId },
        });
        if (!freelancer) throw new NotFoundException('Freelancer not found');

        const media = this.buildMedia(data);
        const packages = data.package?.map((p) => ({
          ...p,
          totalPrice: p.totalPrice ?? p.price,
        }));
        const extras = data.extraServices
          ? [
              {
                name: 'Additional service',
                deliveryTime: data.extraServices.deliveryTime ?? '',
                price: data.extraServices.extraPrice ?? 0,
              },
            ]
          : undefined;

        const questions = data.questions ?? [];

        if (data.slug) {
          const existing = await tx.gig.findUnique({
            where: { slug: data.slug },
          });
          if (existing) {
            if (existing.userId !== freelancer.id) {
              throw new ForbiddenException('Cannot update this gig');
            }
            this.logger.info(`Updating gig with slug "${data.slug}"`);
            return tx.gig.update({
              where: { slug: data.slug },
              data: {
                title: data.title,
                mainCategory: data.mainCategory,
                subCategory: data.subCategory,
                tools: data.tools ?? [],
                tags: data.tags ?? [],
                description: data.description,
                thirdPartyAgreement: data.thirdPartyAgreement ?? false,
                packages: packages
                  ? { deleteMany: {}, create: packages }
                  : undefined,
                extras: extras
                  ? { deleteMany: {}, create: extras }
                  : { deleteMany: {} },
                questions: questions.length
                  ? { deleteMany: {}, create: questions }
                  : { deleteMany: {} },
                media: media.length
                  ? { deleteMany: {}, create: media }
                  : { deleteMany: {} },
              },
              include: {
                packages: true,
                extras: true,
                questions: true,
                media: true,
              },
            });
          }
        }

        const slug = this.slugify.slugify(data.title ?? 'gig');
        this.logger.info(`Creating new gig with slug "${slug}"`);
        return tx.gig.create({
          data: {
            title: data.title,
            mainCategory: data.mainCategory,
            subCategory: data.subCategory,
            tools: data.tools ?? [],
            tags: data.tags ?? [],
            description: data.description,
            thirdPartyAgreement: data.thirdPartyAgreement ?? false,
            slug,
            user: { connect: { id: freelancer.id } },
            packages: packages ? { create: packages } : undefined,
            extras: extras ? { create: extras } : undefined,
            questions: questions.length ? { create: questions } : undefined,
            media: media.length ? { create: media } : undefined,
          },
          include: {
            packages: true,
            extras: true,
            questions: true,
            media: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to create gig for user "${userId}"`, error);
      console.error(error);
      throw new InternalServerErrorException('Unable to create or update gig');
    }
  }

  private buildMedia(data: GigSchemaType) {
    const media = [] as Array<{ type: MediaType; url: string }>;
    if (data.images) {
      media.push(
        ...data.images.map((m) => ({ type: MediaType.IMAGE, url: m.url })),
      );
    }
    if (data.video) {
      media.push({ type: MediaType.VIDEO, url: data.video.url });
    }
    if (data.documents) {
      media.push(
        ...data.documents.map((d) => ({
          type: MediaType.DOCUMENT,
          url: d.url,
        })),
      );
    }
    return media;
  }

  async fetchGigs(userId: string): Promise<Gig[]> {
    try {
      const freelancer = await this.prisma.freelancer.findUnique({
        where: { uid: userId },
      });
      if (!freelancer) return [];
      return await this.prisma.gig.findMany({
        where: { userId: freelancer.id },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch gigs for user "${userId}"`, error);
      throw new InternalServerErrorException('Unable to fetch gigs');
    }
  }

  async getGig(identifier: string): Promise<Gig> {
    try {
      let gig = await this.prisma.gig.findUnique({
        where: { slug: identifier },
      });
      if (!gig) {
        gig = await this.prisma.gig.findUnique({ where: { id: identifier } });
      }
      if (!gig) {
        throw new NotFoundException(`Gig "${identifier}" not found`);
      }
      return gig;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to retrieve gig "${identifier}"`, error);
      throw new InternalServerErrorException('Unable to retrieve gig');
    }
  }

  async deleteGig(identifier: string, userId: string): Promise<void> {
    try {
      const gig = await this.getGig(identifier);
      const freelancer = await this.prisma.freelancer.findUnique({
        where: { uid: userId },
      });
      if (!freelancer || gig.userId !== freelancer.id) {
        throw new ForbiddenException(`Cannot delete gig "${identifier}"`);
      }
      await this.prisma.gig.delete({ where: { id: gig.id } });
      this.logger.info(`Gig "${identifier}" deleted by user "${userId}"`);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to delete gig "${identifier}"`, error);
      throw new InternalServerErrorException('Unable to delete gig');
    }
  }
}
