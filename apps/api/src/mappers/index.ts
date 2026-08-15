import type {
  AdminProfile,
  AgentProfile,
  Agreement,
  AgreementSignature,
  Application,
  AuthUser,
  CustomerProfile,
  FeeCalculation,
  FeeRule,
  Inspection,
  LandlordProfile,
  Payment,
  PaymentBreakdown,
  Property,
  PropertyAmenity,
  PropertyFees,
  PropertyFeatures,
  PropertyImage,
  PropertyMedia,
  PropertyType,
  PropertyUtilities,
  PropertyVerification,
  Report,
  Review,
  Dispute,
  AgentAuthorization,
  Conversation,
  Message,
  AppNotification,
  Favorite,
} from '@neara/types';
import { safeJsonParse } from '@neara/utils';

export function mapUser(u: {
  id: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'LANDLORD' | 'AGENT' | 'ADMIN';
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  displayName: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
}): AuthUser {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    role: u.role,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    isEmailVerified: u.isEmailVerified,
    isPhoneVerified: u.isPhoneVerified,
    isIdentityVerified: u.isIdentityVerified,
    status: u.status,
  };
}

export function mapPropertyType(pt: {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  isActive: boolean;
}): PropertyType {
  return {
    id: pt.id,
    name: pt.name,
    slug: pt.slug,
    category: pt.category ?? undefined,
    isActive: pt.isActive,
  };
}

export function mapImage(img: {
  id: string;
  url: string;
  thumbnailUrl: string;
  isCover: boolean;
  order: number;
}): PropertyImage {
  return {
    id: img.id,
    url: img.url,
    thumbnailUrl: img.thumbnailUrl,
    isCover: img.isCover,
    order: img.order,
  };
}

export function mapAmenity(a: { id: string; name: string; icon: string | null }): PropertyAmenity {
  return { id: a.id, name: a.name, icon: a.icon ?? undefined };
}

export function mapFees(p: {
  rent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  agentFee: number;
  otherFees: number;
  otherFeesLabel: string | null;
  totalMoveIn: number;
}): PropertyFees {
  return {
    rent: p.rent,
    cautionFee: p.cautionFee,
    serviceCharge: p.serviceCharge,
    legalFee: p.legalFee,
    agentFee: p.agentFee,
    otherFees: p.otherFees,
    otherFeesLabel: p.otherFeesLabel ?? undefined,
    totalMoveIn: p.totalMoveIn,
  };
}

export function mapUtilities(p: {
  electricity: PropertyUtilities['electricity'];
  prepaidMeter: boolean;
  water: PropertyUtilities['water'];
  waterSource: PropertyUtilities['waterSource'];
  internet: boolean;
  generator: boolean;
  borehole: boolean;
  estimatedUtilityCost: number | null;
}): PropertyUtilities {
  return {
    electricity: p.electricity,
    prepaidMeter: p.prepaidMeter,
    water: p.water,
    waterSource: p.waterSource,
    internet: p.internet,
    generator: p.generator,
    borehole: p.borehole,
    estimatedUtilityCost: p.estimatedUtilityCost,
  };
}

export function mapFeatures(p: {
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
  parking: number;
  security: boolean;
  compound: boolean;
  fenced: boolean;
  airConditioning: boolean;
  furnished: boolean;
  balcony: boolean;
  wardrobe: boolean;
  securityGate: boolean;
}): PropertyFeatures {
  return {
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    kitchen: p.kitchen,
    parking: p.parking,
    security: p.security,
    compound: p.compound,
    fenced: p.fenced,
    airConditioning: p.airConditioning,
    furnished: p.furnished,
    balcony: p.balcony,
    wardrobe: p.wardrobe,
    securityGate: p.securityGate,
  };
}

export function mapVerification(p: {
  nearaVerified: boolean;
  identityVerified: boolean;
  landlordVerified: boolean;
  propertyVerified: boolean;
  inspectionVerified: boolean;
  verificationLevel: PropertyVerification['level'];
  verifiedAt: Date | null;
}): PropertyVerification {
  return {
    level: p.verificationLevel,
    nearaVerified: p.nearaVerified,
    identityVerified: p.identityVerified,
    landlordVerified: p.landlordVerified,
    propertyVerified: p.propertyVerified,
    inspectionVerified: p.inspectionVerified,
    verifiedAt: p.verifiedAt?.toISOString(),
  };
}

export function mapLandlordProfile(
  u: { id: string; displayName: string; avatarUrl: string | null },
  lp: { isVerified: boolean; verifiedAt: Date | null } | null,
  totalProperties: number,
): LandlordProfile {
  return {
    id: u.id,
    userId: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    isVerified: lp?.isVerified ?? false,
    verifiedAt: lp?.verifiedAt?.toISOString() ?? null,
    totalProperties,
    verifiedAtLevel: lp?.isVerified ? 'neara' : 'none',
  };
}

export function mapAgentProfile(
  u: { id: string; displayName: string; avatarUrl: string | null },
  ap: {
    agencyName: string | null;
    licenseNumber: string | null;
    isVerified: boolean;
    verifiedAt: Date | null;
    ratingAverage: number;
    ratingCount: number;
  } | null,
  activeAuthorizations: number,
): AgentProfile {
  return {
    id: u.id,
    userId: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    agencyName: ap?.agencyName ?? null,
    licenseNumber: ap?.licenseNumber ?? null,
    isVerified: ap?.isVerified ?? false,
    verifiedAt: ap?.verifiedAt?.toISOString() ?? null,
    ratingAverage: ap?.ratingAverage ?? 0,
    ratingCount: ap?.ratingCount ?? 0,
    activeAuthorizations,
  };
}

export function mapProperty(
  p: {
    id: string;
    slug: string;
    title: string;
    description: string;
    rentalPeriod: Property['rentalPeriod'];
    status: Property['status'];
    listingSource: Property['listingSource'];
    address: string;
    city: string;
    state: string;
    area: string | null;
    landmark: string | null;
    latitude: number;
    longitude: number;
    rent: number;
    cautionFee: number;
    serviceCharge: number;
    legalFee: number;
    agentFee: number;
    otherFees: number;
    otherFeesLabel: string | null;
    totalMoveIn: number;
    electricity: PropertyUtilities['electricity'];
    prepaidMeter: boolean;
    water: PropertyUtilities['water'];
    waterSource: PropertyUtilities['waterSource'];
    internet: boolean;
    generator: boolean;
    borehole: boolean;
    estimatedUtilityCost: number | null;
    bedrooms: number;
    bathrooms: number;
    kitchen: boolean;
    parking: number;
    security: boolean;
    compound: boolean;
    fenced: boolean;
    airConditioning: boolean;
    furnished: boolean;
    balcony: boolean;
    wardrobe: boolean;
    securityGate: boolean;
    coverImage: string;
    videoUrl: string | null;
    tour360Url: string | null;
    nearaVerified: boolean;
    identityVerified: boolean;
    landlordVerified: boolean;
    propertyVerified: boolean;
    inspectionVerified: boolean;
    verificationLevel: PropertyVerification['level'];
    verifiedAt: Date | null;
    views: number;
    saves: number;
    ratingAverage: number;
    ratingCount: number;
    createdAt: Date;
    updatedAt: Date;
    propertyType: { id: string; name: string; slug: string; category: string | null; isActive: boolean };
    landlord: { id: string; displayName: string; avatarUrl: string | null; landlordProfile: { isVerified: boolean; verifiedAt: Date | null } | null };
    images: { id: string; url: string; thumbnailUrl: string; isCover: boolean; order: number }[];
    amenities: { id: string; name: string; icon: string | null }[];
  },
  isFavorited = false,
): Property {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    propertyTypeId: p.propertyType.id,
    propertyType: mapPropertyType(p.propertyType),
    rentalPeriod: p.rentalPeriod,
    status: p.status,
    listingSource: p.listingSource,
    location: {
      address: p.address,
      city: p.city,
      state: p.state,
      area: p.area ?? undefined,
      landmark: p.landmark ?? undefined,
      latitude: p.latitude,
      longitude: p.longitude,
    },
    fees: mapFees(p),
    utilities: mapUtilities(p),
    features: mapFeatures(p),
    media: {
      coverImage: p.coverImage,
      images: p.images.map(mapImage),
      videoUrl: p.videoUrl,
      tour360Url: p.tour360Url,
    } satisfies PropertyMedia,
    amenities: p.amenities.map(mapAmenity),
    landlord: mapLandlordProfile(
      p.landlord,
      p.landlord.landlordProfile,
      0,
    ),
    verification: mapVerification(p),
    views: p.views,
    saves: p.saves,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    isFavorited,
  };
}

export function mapAuthorization(
  a: {
    id: string;
    agentId: string;
    landlordId: string;
    propertyId: string | null;
    status: AgentAuthorization['status'];
    source: AgentAuthorization['source'];
    evidenceDocumentUrl: string | null;
    validFrom: Date;
    validUntil: Date | null;
    createdAt: Date;
    verifiedAt: Date | null;
    revokedAt: Date | null;
  },
): AgentAuthorization {
  return {
    id: a.id,
    agentId: a.agentId,
    landlordId: a.landlordId,
    propertyId: a.propertyId,
    status: a.status,
    source: a.source,
    evidenceDocumentUrl: a.evidenceDocumentUrl,
    validFrom: a.validFrom.toISOString(),
    validUntil: a.validUntil?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    verifiedAt: a.verifiedAt?.toISOString() ?? null,
    revokedAt: a.revokedAt?.toISOString() ?? null,
  };
}

export function mapFeeRule(r: {
  id: string;
  name: string;
  minRent: number;
  maxRent: number | null;
  maxPercentage: number;
  maxFixedFee: number | null;
  minFee: number | null;
  propertyTypeIds: unknown;
  locationIds: unknown;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
}): FeeRule {
  return {
    id: r.id,
    name: r.name,
    minRent: r.minRent,
    maxRent: r.maxRent,
    maxPercentage: r.maxPercentage,
    maxFixedFee: r.maxFixedFee,
    minFee: r.minFee,
    propertyTypeIds: safeJsonParse<string[]>(r.propertyTypeIds as string, []),
    locationIds: safeJsonParse<string[]>(r.locationIds as string, []),
    validFrom: r.validFrom.toISOString(),
    validUntil: r.validUntil?.toISOString() ?? null,
    isActive: r.isActive,
  };
}

export function mapFeeCalculation(
  rent: number,
  maxFee: number,
  rule: FeeRule,
  exceeds: boolean,
): FeeCalculation {
  const appliedFixedFee = rule.maxFixedFee;
  return {
    rent,
    maxAllowedAgentFee: maxFee,
    appliedPercentage: rule.maxPercentage,
    appliedFixedFee,
    minFee: rule.minFee,
    rule,
    exceedsLimit: exceeds,
  };
}

export function mapInspection(i: {
  id: string;
  propertyId: string;
  customerId: string;
  landlordId: string | null;
  agentId: string | null;
  requestedDate: string;
  requestedTime: string;
  confirmedDate: Date | null;
  status: Inspection['status'];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Inspection {
  return {
    id: i.id,
    propertyId: i.propertyId,
    customerId: i.customerId,
    landlordId: i.landlordId ?? undefined,
    agentId: i.agentId ?? undefined,
    requestedDate: i.requestedDate,
    requestedTime: i.requestedTime,
    confirmedDate: i.confirmedDate?.toISOString() ?? null,
    status: i.status,
    notes: i.notes ?? undefined,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export function mapApplication(a: {
  id: string;
  propertyId: string;
  customerId: string;
  landlordId: string;
  agentId: string | null;
  moveInDate: string;
  requestedPeriod: Application['requestedPeriod'];
  employment: string | null;
  income: number | null;
  status: Application['status'];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Application {
  return {
    id: a.id,
    propertyId: a.propertyId,
    customerId: a.customerId,
    landlordId: a.landlordId,
    agentId: a.agentId ?? undefined,
    moveInDate: a.moveInDate,
    requestedPeriod: a.requestedPeriod,
    employment: a.employment ?? undefined,
    income: a.income ?? undefined,
    status: a.status,
    notes: a.notes ?? undefined,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function mapPaymentBreakdown(b: unknown): PaymentBreakdown {
  const bd = (b ?? {}) as Partial<PaymentBreakdown> & { otherFeesLabel?: string };
  const rent = bd.rent ?? 0;
  const agentFee = bd.agentFee ?? 0;
  const legalFee = bd.legalFee ?? 0;
  const cautionFee = bd.cautionFee ?? 0;
  const serviceCharge = bd.serviceCharge ?? 0;
  const otherFees = bd.otherFees ?? 0;
  const otherFeesLabel = bd.otherFeesLabel;
  const total = rent + agentFee + legalFee + cautionFee + serviceCharge + otherFees;
  const items = [
    { label: 'Rent', amount: rent },
    { label: 'Agent fee', amount: agentFee },
    { label: 'Legal fee', amount: legalFee },
    { label: 'Caution fee', amount: cautionFee },
    { label: 'Service charge', amount: serviceCharge },
    ...(otherFees > 0 ? [{ label: otherFeesLabel ?? 'Other charges', amount: otherFees }] : []),
  ];
  return { rent, agentFee, legalFee, cautionFee, serviceCharge, otherFees, otherFeesLabel, total, items };
}

export function mapPayment(p: {
  id: string;
  reference: string;
  propertyId: string;
  customerId: string;
  landlordId: string;
  agentId: string | null;
  applicationId: string | null;
  amount: number;
  breakdown: unknown;
  provider: Payment['provider'];
  providerReference: string | null;
  status: Payment['status'];
  receiptUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  return {
    id: p.id,
    reference: p.reference,
    propertyId: p.propertyId,
    customerId: p.customerId,
    landlordId: p.landlordId,
    agentId: p.agentId ?? undefined,
    applicationId: p.applicationId ?? undefined,
    breakdown: mapPaymentBreakdown(p.breakdown),
    amount: p.amount,
    provider: p.provider,
    providerReference: p.providerReference ?? undefined,
    status: p.status,
    receiptUrl: p.receiptUrl ?? undefined,
    paidAt: p.paidAt?.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function mapAgreement(a: {
  id: string;
  agreementId: string;
  paymentId: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  agentId: string | null;
  documentUrl: string;
  verificationUrl: string;
  qrCodeUrl: string;
  terms: string;
  status: Agreement['status'];
  documentVersion: string;
  createdAt: Date;
  updatedAt: Date;
  signatures: {
    id: string;
    agreementId: string;
    signerId: string;
    signerName: string;
    signerRole: AgreementSignature['signerRole'];
    signatureData: string;
    signedAt: Date;
    ipAddress: string | null;
    documentVersion: string;
  }[];
}): Agreement {
  return {
    id: a.id,
    agreementId: a.agreementId,
    paymentId: a.paymentId,
    propertyId: a.propertyId,
    landlordId: a.landlordId,
    tenantId: a.tenantId,
    agentId: a.agentId ?? undefined,
    documentUrl: a.documentUrl,
    verificationUrl: a.verificationUrl,
    qrCodeUrl: a.qrCodeUrl,
    terms: a.terms,
    status: a.status,
    signatures: a.signatures.map((s) => ({
      id: s.id,
      agreementId: s.agreementId,
      signerId: s.signerId,
      signerName: s.signerName,
      signerRole: s.signerRole,
      signatureData: s.signatureData,
      signedAt: s.signedAt.toISOString(),
      ipAddress: s.ipAddress ?? undefined,
      documentVersion: s.documentVersion,
    })),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function mapReview(r: {
  id: string;
  reviewerId: string;
  reviewer: { displayName: string };
  propertyId: string | null;
  landlordId: string | null;
  agentId: string | null;
  rating: number;
  comment: string;
  isVerifiedTransaction: boolean;
  createdAt: Date;
}): Review {
  return {
    id: r.id,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewer.displayName,
    propertyId: r.propertyId ?? undefined,
    landlordId: r.landlordId ?? undefined,
    agentId: r.agentId ?? undefined,
    rating: r.rating,
    comment: r.comment,
    isVerifiedTransaction: r.isVerifiedTransaction,
    createdAt: r.createdAt.toISOString(),
  };
}

export function mapReport(r: {
  id: string;
  reporterId: string;
  reason: Report['reason'];
  description: string;
  reportedEntityType: Report['reportedEntityType'];
  reportedEntityId: string;
  evidenceUrls: unknown;
  status: Report['status'];
  priority: Report['priority'];
  adminNotes: string | null;
  resolution: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}): Report {
  return {
    id: r.id,
    reporterId: r.reporterId,
    reason: r.reason,
    description: r.description,
    reportedEntityType: r.reportedEntityType,
    reportedEntityId: r.reportedEntityId,
    evidenceUrls: safeJsonParse<string[]>(r.evidenceUrls as string, []),
    status: r.status,
    priority: r.priority,
    adminNotes: r.adminNotes ?? undefined,
    resolution: r.resolution ?? undefined,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString(),
  };
}

export function mapDispute(d: {
  id: string;
  openedById: string;
  againstId: string;
  type: Dispute['type'];
  paymentId: string | null;
  propertyId: string | null;
  description: string;
  status: Dispute['status'];
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Dispute {
  return {
    id: d.id,
    openedById: d.openedById,
    againstId: d.againstId,
    type: d.type,
    paymentId: d.paymentId ?? undefined,
    propertyId: d.propertyId ?? undefined,
    description: d.description,
    status: d.status,
    resolution: d.resolution ?? undefined,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function mapConversation(
  c: {
    id: string;
    propertyId: string | null;
    participants: { userId: string; user: { id: string; displayName: string; avatarUrl: string | null; role: 'CUSTOMER' | 'LANDLORD' | 'AGENT' | 'ADMIN' } }[];
    messages: { id: string; content: string; senderId: string; createdAt: Date }[];
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  currentUserId: string,
): Conversation {
  const lastMessageArr = c.messages.slice(-1);
  const lastMessage = lastMessageArr[0];
  return {
    id: c.id,
    propertyId: c.propertyId ?? undefined,
    participantIds: c.participants.map((p) => p.userId),
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          conversationId: c.id,
          senderId: lastMessage.senderId,
          content: lastMessage.content,
          read: true,
          readBy: [],
          createdAt: lastMessage.createdAt.toISOString(),
        }
      : undefined,
    unreadCount: 0,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function mapMessage(m: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: unknown;
  readBy: unknown;
  createdAt: Date;
}): Message {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.content,
    attachments: safeJsonParse<{ url: string; type: string }[]>(m.attachments as string, []),
    readBy: safeJsonParse<string[]>(m.readBy as string, []),
    read: safeJsonParse<string[]>(m.readBy as string, []).length > 0,
    createdAt: m.createdAt.toISOString(),
  };
}

export function mapNotification(n: {
  id: string;
  userId: string;
  type: AppNotification['type'];
  channel: AppNotification['channel'];
  title: string;
  body: string;
  data: unknown;
  read: boolean;
  createdAt: Date;
}): AppNotification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    data: safeJsonParse<Record<string, unknown>>(n.data as string, {}),
    read: n.read,
    channel: n.channel,
    createdAt: n.createdAt.toISOString(),
  };
}

export function mapFavorite(f: {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
}): Favorite {
  return {
    id: f.id,
    userId: f.userId,
    propertyId: f.propertyId,
    createdAt: f.createdAt.toISOString(),
  };
}

export function mapCustomerProfile(
  u: { id: string; displayName: string; avatarUrl: string | null },
  cp: {
    occupation: string | null;
    employer: string | null;
    monthlyIncome: number | null;
    preferredLocations: unknown;
    bio: string | null;
  } | null,
): CustomerProfile {
  return {
    id: u.id,
    userId: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    occupation: cp?.occupation ?? null,
    employer: cp?.employer ?? null,
    monthlyIncome: cp?.monthlyIncome ?? null,
    preferredLocations: safeJsonParse<string[]>(cp?.preferredLocations as string, []),
    bio: cp?.bio ?? null,
  };
}

export function mapAdminProfile(
  u: { id: string; displayName: string; avatarUrl: string | null },
  ap: { role: 'moderator' | 'super_admin' } | null,
): AdminProfile {
  return {
    id: u.id,
    userId: u.id,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: ap?.role ?? 'moderator',
  };
}
