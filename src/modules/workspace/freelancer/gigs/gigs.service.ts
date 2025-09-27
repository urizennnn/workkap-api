import {
  Gig,
  GigStatus,
  MediaType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  PrismaService,
  SlugService,
  WorkkapLogger,
  normalizeAndThrowHttpError,
} from 'src/libs';
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

        const packageInputEntries = data.package ?? [];
        const hasPackageInput = data.package !== undefined;
        const packagePayload = hasPackageInput
          ? packageInputEntries
              .map((p) => {
                if (
                  !p?.tier ||
                  !p.name ||
                  !p.deliveryTime ||
                  p.price === undefined
                ) {
                  return null;
                }
                return {
                  tier: p.tier,
                  name: p.name,
                  description: p.description ?? '',
                  deliveryTime: p.deliveryTime,
                  customAssetDesign: p.customAssetDesign ?? false,
                  sourceFile: p.sourceFile ?? false,
                  contentUpload: p.contentUpload ?? false,
                  convertToHtmlCss: p.convertToHtmlCss ?? false,
                  revisions: p.revisions ?? 0,
                  price: p.price,
                  totalPrice: p.totalPrice ?? p.price,
                };
              })
              .filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null)
          : [];
        const shouldUpdatePackages =
          hasPackageInput &&
          (packagePayload.length > 0 || packageInputEntries.length === 0);

        const extrasHasExplicitValues =
          data.extraServices !== undefined &&
          (data.extraServices.deliveryTime !== undefined ||
            data.extraServices.extraPrice !== undefined);

        const hasQuestionsInput = data.questions !== undefined;
        const questionsPayload = hasQuestionsInput
          ? (data.questions ?? []).filter(
              (question): question is { text: string } =>
                typeof question?.text === 'string' && question.text.length > 0,
            )
          : [];

        const mediaPayload = this.buildMedia(data);
        const hasMediaInput =
          data.images !== undefined ||
          data.video !== undefined ||
          data.documents !== undefined;

        if (data.slug) {
          const existing = await tx.gig.findUnique({
            where: { slug: data.slug },
            include: {
              extras: true,
            },
          });
          if (existing) {
            if (existing.userId !== freelancer.id) {
              throw new ForbiddenException('Cannot update this gig');
            }
            this.logger.info(`Updating gig with slug "${data.slug}"`);

            const extrasPayload = extrasHasExplicitValues
              ? this.buildExtrasPayload(
                  data.extraServices,
                  existing.extras[0],
                )
              : undefined;
            const shouldUpdateExtras = extrasPayload !== undefined;

            return tx.gig.update({
              where: { slug: data.slug },
              data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.mainCategory !== undefined
                  ? { mainCategory: data.mainCategory }
                  : {}),
                ...(data.subCategory !== undefined
                  ? { subCategory: data.subCategory }
                  : {}),
                ...(data.tools !== undefined ? { tools: data.tools } : {}),
                ...(data.tags !== undefined ? { tags: data.tags } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.description !== undefined
                  ? { description: data.description }
                  : {}),
                ...(data.thirdPartyAgreement !== undefined
                  ? { thirdPartyAgreement: data.thirdPartyAgreement }
                  : {}),
                ...(shouldUpdatePackages
                  ? {
                      packages: {
                        deleteMany: {},
                        ...(packagePayload?.length
                          ? { create: packagePayload }
                          : {}),
                      },
                    }
                  : {}),
                ...(hasQuestionsInput
                  ? questionsPayload.length
                    ? {
                        questions: {
                          deleteMany: {},
                          create: questionsPayload,
                        },
                      }
                      : { questions: { deleteMany: {} } }
                  : {}),
                ...(hasMediaInput
                  ? mediaPayload.length
                    ? { media: { deleteMany: {}, create: mediaPayload } }
                    : { media: { deleteMany: {} } }
                  : {}),
                ...(shouldUpdateExtras
                  ? {
                      extras: {
                        deleteMany: {},
                        create: extrasPayload,
                      },
                    }
                  : {}),
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
        const extrasPayload = this.buildExtrasPayload(data.extraServices);
        return tx.gig.create({
          data: {
            title: data.title ?? '',
            mainCategory: data.mainCategory ?? '',
            subCategory: data.subCategory ?? '',
            tools: data.tools ?? [],
            tags: data.tags ?? [],
            status: data.status ?? GigStatus.DRAFT,
            description: data.description ?? '',
            thirdPartyAgreement: data.thirdPartyAgreement ?? false,
            slug,
            user: { connect: { id: freelancer.id } },
            ...(packagePayload?.length
              ? { packages: { create: packagePayload } }
              : {}),
            ...(extrasPayload?.length
              ? { extras: { create: extrasPayload } }
              : {}),
            ...(questionsPayload.length
              ? { questions: { create: questionsPayload } }
              : {}),
            ...(hasMediaInput && mediaPayload.length
              ? { media: { create: mediaPayload } }
              : {}),
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
      ) {
        throw error;
      }
      this.logger.error(`Failed to create gig for user "${userId}"`, error);
      normalizeAndThrowHttpError(
        error,
        (message, cause) =>
          new InternalServerErrorException(
            message,
            cause ? { cause } : undefined,
          ),
        'Unable to create or update gig',
      );
    }
  }

  private buildExtrasPayload(
    extraServices?: GigSchemaType['extraServices'],
    existing?: { deliveryTime: string; price: Prisma.Decimal },
  ) {
    if (!extraServices) {
      return undefined;
    }

    const deliveryTime =
      extraServices.deliveryTime ?? existing?.deliveryTime;
    const price =
      extraServices.extraPrice ??
      (existing?.price !== undefined ? Number(existing.price) : undefined);

    if (deliveryTime === undefined || price === undefined) {
      return undefined;
    }

    return [
      {
        name: 'Additional service',
        deliveryTime,
        price,
      },
    ];
  }

  private buildMedia(data: GigSchemaType) {
    const media = [] as Array<{ type: MediaType; url: string }>;
    if (data.images) {
      media.push(
        ...data.images
          .filter(
            (image): image is { url: string } =>
              typeof image?.url === 'string' && image.url.length > 0,
          )
          .map((m) => ({ type: MediaType.IMAGE, url: m.url })),
      );
    }
    if (data.video?.url) {
      media.push({ type: MediaType.VIDEO, url: data.video.url });
    }
    if (data.documents) {
      media.push(
        ...data.documents
          .filter(
            (document): document is { url: string } =>
              typeof document?.url === 'string' && document.url.length > 0,
          )
          .map((d) => ({
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
        include: {
          packages: true,
          extras: true,
          questions: true,
          media: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch gigs for user "${userId}"`, error);
      normalizeAndThrowHttpError(
        error,
        (message, cause) =>
          new InternalServerErrorException(
            message,
            cause ? { cause } : undefined,
          ),
        'Unable to fetch gigs',
      );
    }
  }

  async getGig(identifier: string): Promise<Gig> {
    try {
      let gig = await this.prisma.gig.findUnique({
        where: { slug: identifier },
        include: { packages: true, extras: true, questions: true, media: true },
      });
      if (!gig) {
        gig = await this.prisma.gig.findUnique({
          where: { id: identifier },
          include: {
            packages: true,
            extras: true,
            questions: true,
            media: true,
          },
        });
      }
      if (!gig) {
        throw new NotFoundException(`Gig "${identifier}" not found`);
      }
      return gig;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to retrieve gig "${identifier}"`, error);
      normalizeAndThrowHttpError(
        error,
        (message, cause) =>
          new InternalServerErrorException(
            message,
            cause ? { cause } : undefined,
          ),
        'Unable to retrieve gig',
      );
    }
  }

  async deleteGig(identifier: string, userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const gigBasic = await tx.gig.findFirst({
          where: { OR: [{ slug: identifier }, { id: identifier }] },
          select: { id: true, userId: true },
        });
        if (!gigBasic)
          throw new NotFoundException(`Gig "${identifier}" not found`);

        const freelancer = await tx.freelancer.findUnique({
          where: { uid: userId },
          select: { id: true },
        });
        if (!freelancer || gigBasic.userId !== freelancer.id) {
          throw new ForbiddenException(`Cannot delete gig "${identifier}"`);
        }

        const hasPending = await tx.order.findFirst({
          where: {
            gigId: gigBasic.id,
            status: {
              in: [OrderStatus.ACTIVE, OrderStatus.PENDING, OrderStatus.LATE],
            },
          },
          select: { id: true, status: true },
        });
        if (hasPending) {
          throw new ForbiddenException(
            `Cannot delete gig "${identifier}" because it has pending orders`,
          );
        }

        await tx.mediaItem.deleteMany({ where: { gigId: gigBasic.id } });
        await tx.question.deleteMany({ where: { gigId: gigBasic.id } });
        await tx.extraService.deleteMany({ where: { gigId: gigBasic.id } });
        await tx.gigPackage.deleteMany({ where: { gigId: gigBasic.id } });
        await tx.gig.delete({ where: { id: gigBasic.id } });
      });
      this.logger.info(`Gig "${identifier}" deleted by user "${userId}"`);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to delete gig "${identifier}"`, error);
      normalizeAndThrowHttpError(
        error,
        (message, cause) =>
          new InternalServerErrorException(
            message,
            cause ? { cause } : undefined,
          ),
        'Unable to delete gig',
      );
    }
  }
}
