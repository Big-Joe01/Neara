import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { feeService } from './fee.service.js';
import { audit } from '../lib/audit.js';
import { distanceKm, slugify } from '@neara/utils';
import { mediaService } from './media.service.js';
import { mapProperty } from '../mappers/index.js';
import type { AuthedRequest } from '../middleware/auth.js';
import type {
  Property,
  RentalPeriod,
  SearchFilters,
  SearchSort,
} from '@neara/types';
import type { Prisma } from '@prisma/client';
import { appConfig } from '@neara/config';

const propertyInclude = {
  propertyType: true,
  landlord: { include: { landlordProfile: true } },
  images: { orderBy: { order: 'asc' } },
  amenities: { include: { amenity: true } },
} satisfies Prisma.PropertyInclude;

type PropertyWithRelations = Prisma.PropertyGetPayload<{ include: typeof propertyInclude }>;

export function toDto(p: PropertyWithRelations, isFavorited = false): Property {
  // reshape amenities (PropertyAmenity -> {id,name})
  const remapped = {
    ...p,
    amenities: p.amenities.map((pa) => ({ id: pa.amenity.id, name: pa.amenity.name, icon: pa.amenity.icon })),
  };
  return mapProperty(remapped, isFavorited);
}

export class PropertyService {
  async create(req: AuthedRequest, data: {
    title: string;
    description: string;
    propertyTypeId: string;
    rentalPeriod: RentalPeriod;
    location: {
      address: string;
      city: string;
      state: string;
      area?: string;
      landmark?: string;
      latitude: number;
      longitude: number;
    };
    fees: {
      rent: number;
      cautionFee: number;
      serviceCharge: number;
      legalFee: number;
      agentFee: number;
      otherFees: number;
      otherFeesLabel?: string;
    };
    utilities: Property['utilities'];
    features: Property['features'];
    amenities?: string[];
    listingSource: 'direct' | 'agent';
    agentId?: string;
    coverImage: string;
    images: { url: string; isCover?: boolean }[];
    videoUrl?: string | null;
    tour360Url?: string | null;
  }): Promise<Property> {
    const userId = req.user!.id;
    const role = req.user!.role;

    // Only landlords and authorized agents can create properties.
    if (role !== 'LANDLORD' && role !== 'AGENT') {
      throw forbidden('Only landlords or agents can create properties.');
    }

    const landlordId = role === 'LANDLORD' ? userId : data.agentId ?? userId;
    const agentId = role === 'AGENT' ? userId : data.agentId ?? null;

    // Agent must have a verified authorization to the landlord (or submit evidence)
    if (role === 'AGENT') {
      const auth = await prisma.agentAuthorization.findFirst({
        where: {
          agentId: userId,
          landlordId,
          status: 'verified',
          OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
        },
      });
      if (!auth) {
        throw forbidden(
          'You are not an authorized agent for this landlord. Request authorization first.',
        );
      }
      data.listingSource = 'agent';
    }

    // Enforce agent fee regulation
    if (data.fees.agentFee > 0) {
      await feeService.calculate(
        data.fees.rent,
        data.fees.agentFee,
        data.propertyTypeId,
        undefined,
        true,
      );
    }

    const propertyType = await prisma.propertyType.findUnique({
      where: { id: data.propertyTypeId },
    });
    if (!propertyType) throw notFound('Property type not found');

    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let n = 1;
    while (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`;
    }

    const totalMoveIn =
      data.fees.rent +
      data.fees.agentFee +
      data.fees.legalFee +
      data.fees.cautionFee +
      data.fees.serviceCharge +
      data.fees.otherFees;

    const coverImage = data.coverImage;
    const images = data.images.map((img, i) => ({
      url: img.url,
      thumbnailUrl: mediaService.thumbnail(img.url),
      isCover: img.isCover ?? img.url === coverImage,
      order: i,
    }));
    // ensure one cover
    const hasCover = images.some((i) => i.isCover);
    if (!hasCover) images[0]!.isCover = true;

    const property = await prisma.property.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        propertyTypeId: data.propertyTypeId,
        rentalPeriod: data.rentalPeriod,
        status: 'pending_review',
        listingSource: data.listingSource,
        address: data.location.address,
        city: data.location.city,
        state: data.location.state,
        area: data.location.area ?? null,
        landmark: data.location.landmark ?? null,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        rent: data.fees.rent,
        cautionFee: data.fees.cautionFee,
        serviceCharge: data.fees.serviceCharge,
        legalFee: data.fees.legalFee,
        agentFee: data.fees.agentFee,
        otherFees: data.fees.otherFees,
        otherFeesLabel: data.fees.otherFeesLabel ?? null,
        totalMoveIn,
        electricity: data.utilities.electricity,
        prepaidMeter: data.utilities.prepaidMeter,
        water: data.utilities.water,
        waterSource: data.utilities.waterSource,
        internet: data.utilities.internet,
        generator: data.utilities.generator,
        borehole: data.utilities.borehole,
        estimatedUtilityCost: data.utilities.estimatedUtilityCost ?? null,
        bedrooms: data.features.bedrooms,
        bathrooms: data.features.bathrooms,
        kitchen: data.features.kitchen,
        parking: data.features.parking,
        security: data.features.security,
        compound: data.features.compound,
        fenced: data.features.fenced,
        airConditioning: data.features.airConditioning,
        furnished: data.features.furnished,
        balcony: data.features.balcony,
        wardrobe: data.features.wardrobe,
        securityGate: data.features.securityGate,
        coverImage,
        videoUrl: data.videoUrl ?? null,
        tour360Url: data.tour360Url ?? null,
        landlordId,
        agentId,
        images: { create: images },
        amenities: data.amenities
          ? {
              create: data.amenities.map((name) => ({
                amenity: {
                  connectOrCreate: {
                    where: { slug: slugify(name) },
                    create: { name, slug: slugify(name) },
                  },
                },
              })),
            }
          : undefined,
      },
      include: propertyInclude,
    }) as PropertyWithRelations;

    await audit(req, 'property.create', 'property', property.id, { title: property.title });

    // If agent created, link the authorization to the property
    if (role === 'AGENT') {
      const auth = await prisma.agentAuthorization.findFirst({
        where: { agentId: userId, landlordId, status: 'verified' },
      });
      if (auth) {
        await prisma.agentAuthorization.update({
          where: { id: auth.id },
          data: { propertyId: property.id },
        });
      }
    }

    return toDto(property);
  }

  async update(req: AuthedRequest, id: string, data: Partial<Parameters<PropertyService['create']>[1]>) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw notFound('Property not found');

    const canEdit =
      property.landlordId === req.user!.id ||
      property.agentId === req.user!.id ||
      req.user!.role === 'ADMIN';
    if (!canEdit) throw forbidden('You cannot edit this property.');

    if (data.fees && data.fees.agentFee !== undefined && data.fees.agentFee > 0) {
      await feeService.calculate(
        data.fees.rent ?? property.rent,
        data.fees.agentFee,
        property.propertyTypeId,
        undefined,
        true,
      );
    }

    const totalMoveIn =
      (data.fees?.rent ?? property.rent) +
      (data.fees?.agentFee ?? property.agentFee) +
      (data.fees?.legalFee ?? property.legalFee) +
      (data.fees?.cautionFee ?? property.cautionFee) +
      (data.fees?.serviceCharge ?? property.serviceCharge) +
      (data.fees?.otherFees ?? property.otherFees);

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title, slug: slugify(data.title) } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.propertyTypeId ? { propertyTypeId: data.propertyTypeId } : {}),
        ...(data.rentalPeriod ? { rentalPeriod: data.rentalPeriod } : {}),
        ...(data.location
          ? {
              address: data.location.address,
              city: data.location.city,
              state: data.location.state,
              area: data.location.area ?? null,
              landmark: data.location.landmark ?? null,
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            }
          : {}),
        ...(data.fees
          ? {
              rent: data.fees.rent,
              cautionFee: data.fees.cautionFee,
              serviceCharge: data.fees.serviceCharge,
              legalFee: data.fees.legalFee,
              agentFee: data.fees.agentFee,
              otherFees: data.fees.otherFees,
              otherFeesLabel: data.fees.otherFeesLabel ?? null,
              totalMoveIn,
            }
          : {}),
        ...(data.utilities
          ? {
              electricity: data.utilities.electricity,
              prepaidMeter: data.utilities.prepaidMeter,
              water: data.utilities.water,
              waterSource: data.utilities.waterSource,
              internet: data.utilities.internet,
              generator: data.utilities.generator,
              borehole: data.utilities.borehole,
              estimatedUtilityCost: data.utilities.estimatedUtilityCost ?? null,
            }
          : {}),
        ...(data.features
          ? {
              bedrooms: data.features.bedrooms,
              bathrooms: data.features.bathrooms,
              kitchen: data.features.kitchen,
              parking: data.features.parking,
              security: data.features.security,
              compound: data.features.compound,
              fenced: data.features.fenced,
              airConditioning: data.features.airConditioning,
              furnished: data.features.furnished,
              balcony: data.features.balcony,
              wardrobe: data.features.wardrobe,
              securityGate: data.features.securityGate,
            }
          : {}),
        ...(data.coverImage ? { coverImage: data.coverImage } : {}),
        ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
        ...(data.tour360Url !== undefined ? { tour360Url: data.tour360Url } : {}),
      },
      include: propertyInclude,
    }) as PropertyWithRelations;

    await audit(req, 'property.update', 'property', id);
    return toDto(updated);
  }

  async getById(id: string, userId?: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });
    if (!property || property.deletedAt) throw notFound('Property not found');

    // increment views (only for non-owner viewers of active listings)
    if (
      property.status === 'active' &&
      userId !== property.landlordId &&
      userId !== property.agentId
    ) {
      await prisma.property.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    }

    let isFavorited = false;
    if (userId) {
      const fav = await prisma.favorite.findUnique({
        where: { userId_propertyId: { userId, propertyId: id } },
      });
      isFavorited = Boolean(fav);
    }
    return toDto(property, isFavorited);
  }

  async getBySlug(slug: string, userId?: string) {
    const property = await prisma.property.findUnique({
      where: { slug },
      include: propertyInclude,
    });
    if (!property || property.deletedAt) throw notFound('Property not found');
    let isFavorited = false;
    if (userId) {
      const fav = await prisma.favorite.findUnique({
        where: { userId_propertyId: { userId, propertyId: property.id } },
      });
      isFavorited = Boolean(fav);
    }
    return toDto(property, isFavorited);
  }

  async listByOwner(userId: string) {
    const properties = await prisma.property.findMany({
      where: { OR: [{ landlordId: userId }, { agentId: userId }], deletedAt: null },
      include: propertyInclude,
      orderBy: { createdAt: 'desc' },
    });
    return properties.map((p) => toDto(p));
  }

  async remove(req: AuthedRequest, id: string) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw notFound('Property not found');
    const canDelete =
      property.landlordId === req.user!.id || req.user!.role === 'ADMIN';
    if (!canDelete) throw forbidden('You cannot delete this property.');
    await prisma.property.update({
      where: { id },
      data: { status: 'removed', deletedAt: new Date() },
    });
    await audit(req, 'property.remove', 'property', id);
  }

  async setStatus(req: AuthedRequest, id: string, status: Property['status']) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw notFound('Property not found');
    const canSet =
      property.landlordId === req.user!.id ||
      property.agentId === req.user!.id ||
      req.user!.role === 'ADMIN';
    if (!canSet) throw forbidden('You cannot change this property status.');
    const updated = await prisma.property.update({
      where: { id },
      data: { status },
      include: propertyInclude,
    });
    await audit(req, 'property.status', 'property', id, { status });
    return toDto(updated);
  }

  async reorderImages(propertyId: string, imageOrders: { id: string; order: number; isCover?: boolean }[]) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw notFound('Property not found');
    await prisma.$transaction(
      imageOrders.map((io) =>
        prisma.propertyImage.update({
          where: { id: io.id },
          data: { order: io.order, isCover: io.isCover ?? false },
        }),
      ),
    );
    if (imageOrders.some((i) => i.isCover)) {
      const cover = imageOrders.find((i) => i.isCover);
      if (cover) {
        const img = await prisma.propertyImage.findUnique({ where: { id: cover.id } });
        if (img) {
          await prisma.property.update({
            where: { id: propertyId },
            data: { coverImage: img.url },
          });
        }
      }
    }
    return prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
      include: propertyInclude,
    }).then((p) => toDto(p));
  }

  async search(filters: SearchFilters & { page: number; pageSize: number; sort?: SearchSort }, userId?: string) {
    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      status: 'active',
      ...(filters.city ? { city: { contains: filters.city } } : {}),
      ...(filters.area ? { area: { contains: filters.area } } : {}),
      ...(filters.propertyTypeIds?.length
        ? { propertyTypeId: { in: filters.propertyTypeIds } }
        : {}),
      ...(filters.rentalPeriod ? { rentalPeriod: filters.rentalPeriod } : {}),
      ...(filters.minRent !== undefined || filters.maxRent !== undefined
        ? {
            rent: {
              ...(filters.minRent !== undefined ? { gte: filters.minRent } : {}),
              ...(filters.maxRent !== undefined ? { lte: filters.maxRent } : {}),
            },
          }
        : {}),
      ...(filters.bedrooms !== undefined ? { bedrooms: { gte: filters.bedrooms } } : {}),
      ...(filters.bathrooms !== undefined ? { bathrooms: { gte: filters.bathrooms } } : {}),
      ...(filters.electricity ? { electricity: filters.electricity } : {}),
      ...(filters.water ? { water: filters.water } : {}),
      ...(filters.listingSource ? { listingSource: filters.listingSource } : {}),
      ...(filters.nearaVerified ? { nearaVerified: true } : {}),
    };

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query } },
        { description: { contains: filters.query } },
        { address: { contains: filters.query } },
        { area: { contains: filters.query } },
        { landmark: { contains: filters.query } },
      ];
    }

    if (filters.amenities?.length) {
      where.amenities = {
        some: { amenity: { name: { in: filters.amenities } } },
      };
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      filters.sort === 'lowest_price'
        ? { rent: 'asc' }
        : filters.sort === 'highest_price'
          ? { rent: 'desc' }
          : filters.sort === 'most_viewed'
            ? { views: 'desc' }
            : filters.sort === 'most_saved'
              ? { saves: 'desc' }
              : { createdAt: 'desc' };

    const [total, items] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        include: propertyInclude,
        orderBy,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    let dtos = items.map((p) => toDto(p));
    // sort by closest (post-query; properties count is paginated)
    if (filters.sort === 'closest' && filters.latitude !== undefined && filters.longitude !== undefined) {
      dtos = dtos
        .map((p) => ({
          p,
          d: distanceKm(filters.latitude!, filters.longitude!, p.location.latitude, p.location.longitude),
        }))
        .sort((a, b) => a.d - b.d)
        .map((x) => x.p);
    }

    // record search history (best-effort)
    if (userId || filters.query) {
      await prisma.searchHistory
        .create({
          data: {
            userId,
            query: filters.query ?? '',
            filters: filters as unknown as object,
          },
        })
        .catch(() => {});
    }

    return {
      items: dtos,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      pages: Math.max(1, Math.ceil(total / filters.pageSize)),
    };
  }

  async mapSearch(
    bounds: { south: number; west: number; north: number; east: number },
    limit = 200,
  ) {
    const properties = await prisma.property.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        latitude: { gte: bounds.south, lte: bounds.north },
        longitude: { gte: bounds.west, lte: bounds.east },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        rent: true,
        rentalPeriod: true,
        city: true,
        area: true,
        latitude: true,
        longitude: true,
        coverImage: true,
        listingSource: true,
        nearaVerified: true,
        bedrooms: true,
        bathrooms: true,
      },
      take: limit,
    });
    return properties;
  }

  async recommended(limit = 10, userId?: string) {
    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      status: 'active',
    };
    if (userId) {
      const fav = await prisma.favorite.findMany({
        where: { userId },
        select: { property: { select: { city: true, propertyTypeId: true } } },
      });
      if (fav.length) {
        where.OR = [
          { city: { in: fav.map((f) => f.property.city) } },
          { propertyTypeId: { in: fav.map((f) => f.property.propertyTypeId) } },
        ];
      }
    }
    return prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: [{ nearaVerified: 'desc' }, { views: 'desc' }],
      take: limit,
    }).then((ps) => ps.map((p) => toDto(p)));
  }

  async recentlyAdded(limit = 10) {
    return prisma.property
      .findMany({
        where: { deletedAt: null, status: 'active' },
        include: propertyInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      .then((ps) => ps.map((p) => toDto(p)));
  }

  async directFromLandlord(limit = 10) {
    return prisma.property
      .findMany({
        where: { deletedAt: null, status: 'active', listingSource: 'direct' },
        include: propertyInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      .then((ps) => ps.map((p) => toDto(p)));
  }
}

export const propertyService = new PropertyService();
export { appConfig };
