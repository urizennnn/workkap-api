import { Gig } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
    if (data.slug) {
      const existing = await this.prisma.gig.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        this.logger.info(`Updating gig with slug "${data.slug}"`);
        return this.prisma.gig.update({
          where: { slug: data.slug },
          data,
        });
      }
    }

    const gig = await this.prisma.$transaction(async (tx) => {
      await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const slug = this.slugify.slugify(data.title ?? 'gig');
      this.logger.info(`Creating new gig with slug "${slug}"`);
      return tx.gig.create({
        data: {
          ...data,
          slug,
          user: { connect: { id: userId } },
        },
      });
    });

    this.logger.info(`Gig created with ID "${gig.id}"`);
    return gig;
  }

  async fetchGigs(userId: string): Promise<Gig[]> {
    return this.prisma.gig.findMany({ where: { userId } });
  }

  async getGig(identifier: string): Promise<Gig> {
    let gig = await this.prisma.gig.findUnique({ where: { slug: identifier } });
    if (!gig)
      gig = await this.prisma.gig.findUnique({ where: { id: identifier } });
    if (!gig) throw new NotFoundException(`Gig "${identifier}" not found`);
    return gig;
  }

  async deleteGig(identifier: string, userId: string): Promise<void> {
    const gig = await this.getGig(identifier);
    if (gig.userId !== userId)
      throw new ForbiddenException(`Cannot delete gig "${identifier}"`);
    await this.prisma.gig.delete({ where: { id: gig.id } });
  }
}
