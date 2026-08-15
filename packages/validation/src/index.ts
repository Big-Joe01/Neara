import { z } from 'zod';
import type {
  ElectricityReliability,
  RentalPeriod,
  ReportReason,
  WaterAvailability,
  WaterSource,
} from '@neara/types';

export const phoneRegex = /^(\+?234|0)[7-9][0-1]\d{8}$/;
export const slugRegex = /^[a-z0-9-]+$/;

export const roleSchema = z.enum(['CUSTOMER', 'LANDLORD', 'AGENT', 'ADMIN']);
export const rentalPeriodSchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom',
]);
export const electricitySchema = z.enum(['excellent', 'fair', 'poor', 'none']);
export const waterSchema = z.enum(['reliable', 'intermittent', 'none']);
export const waterSourceSchema = z.enum(['borehole', 'tap', 'tanker', 'well', 'none']);
export const reportReasonSchema = z.enum([
  'fake_property',
  'fake_landlord',
  'fake_agent',
  'wrong_price',
  'wrong_location',
  'misleading_photos',
  'duplicate_property',
  'scam',
  'abusive_behavior',
  'inappropriate_content',
  'other',
]);

export const registerSchema = z
  .object({
    email: z.string().email().toLowerCase(),
    phone: z.string().regex(phoneRegex, 'Enter a valid Nigerian phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: roleSchema,
    displayName: z.string().min(2).max(80),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter email or phone'),
  password: z.string().min(1),
});

export const otpSchema = z.object({
  identifier: z.string(),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  purpose: z.enum(['email', 'phone', 'password_reset']),
});

export const passwordResetRequestSchema = z.object({
  identifier: z.string().min(3),
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const locationSchema = z.object({
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  area: z.string().max(80).optional(),
  landmark: z.string().max(120).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const feesSchema = z.object({
  rent: z.number().int().min(0),
  cautionFee: z.number().int().min(0),
  serviceCharge: z.number().int().min(0),
  legalFee: z.number().int().min(0),
  agentFee: z.number().int().min(0),
  otherFees: z.number().int().min(0),
  otherFeesLabel: z.string().max(80).optional(),
});

export const utilitiesSchema = z.object({
  electricity: electricitySchema,
  prepaidMeter: z.boolean(),
  water: waterSchema,
  waterSource: waterSourceSchema,
  internet: z.boolean(),
  generator: z.boolean(),
  borehole: z.boolean(),
  estimatedUtilityCost: z.number().int().min(0).optional().nullable(),
});

export const featuresSchema = z.object({
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  kitchen: z.boolean(),
  parking: z.number().int().min(0),
  security: z.boolean(),
  compound: z.boolean(),
  fenced: z.boolean(),
  airConditioning: z.boolean(),
  furnished: z.boolean(),
  balcony: z.boolean(),
  wardrobe: z.boolean(),
  securityGate: z.boolean(),
});

export const createPropertySchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(5000),
  propertyTypeId: z.string().min(1),
  rentalPeriod: rentalPeriodSchema,
  location: locationSchema,
  fees: feesSchema,
  utilities: utilitiesSchema,
  features: featuresSchema,
  amenities: z.array(z.string()).optional(),
  listingSource: z.enum(['direct', 'agent']),
  agentId: z.string().optional(),
  coverImage: z.string().url(),
  images: z.array(z.object({ url: z.string().url(), isCover: z.boolean().optional() })).min(1),
  videoUrl: z.string().url().optional().nullable(),
  tour360Url: z.string().url().optional().nullable(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const searchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  propertyTypeIds: z.array(z.string()).optional(),
  minRent: z.coerce.number().int().min(0).optional(),
  maxRent: z.coerce.number().int().min(0).optional(),
  rentalPeriod: rentalPeriodSchema.optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  electricity: electricitySchema.optional(),
  water: waterSchema.optional(),
  listingSource: z.enum(['direct', 'agent']).optional(),
  nearaVerified: z.coerce.boolean().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(0).optional(),
  sort: z
    .enum([
      'lowest_price',
      'highest_price',
      'newest',
      'closest',
      'most_viewed',
      'most_saved',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const requestInspectionSchema = z.object({
  propertyId: z.string().min(1),
  requestedDate: z.string().min(1),
  requestedTime: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export const updateInspectionSchema = z.object({
  status: z.enum(['confirmed', 'rescheduled', 'cancelled', 'completed']),
  confirmedDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const createApplicationSchema = z.object({
  propertyId: z.string().min(1),
  moveInDate: z.string().min(1),
  requestedPeriod: rentalPeriodSchema,
  employment: z.string().max(200).optional(),
  income: z.number().int().min(0).optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected', 'info_requested']),
  notes: z.string().max(1000).optional(),
});

export const initPaymentSchema = z.object({
  propertyId: z.string().min(1),
  applicationId: z.string().optional(),
  provider: z.enum(['paystack', 'bank_transfer', 'ussd', 'other']).default('paystack'),
});

export const createAuthorizationSchema = z.object({
  agentId: z.string().min(1),
  propertyId: z.string().optional().nullable(),
  source: z.enum(['landlord_grant', 'agent_evidence']),
  evidenceDocumentUrl: z.string().url().optional().nullable(),
  validUntil: z.string().optional().nullable(),
});

export const feeRuleSchema = z.object({
  name: z.string().min(2).max(120),
  minRent: z.number().int().min(0),
  maxRent: z.number().int().min(0).nullable(),
  maxPercentage: z.number().min(0).max(100),
  maxFixedFee: z.number().int().min(0).nullable(),
  minFee: z.number().int().min(0).nullable(),
  propertyTypeIds: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(),
  validFrom: z.string().min(1),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const createReviewSchema = z.object({
  propertyId: z.string().optional(),
  landlordId: z.string().optional(),
  agentId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

export const createReportSchema = z.object({
  reason: reportReasonSchema,
  description: z.string().min(10).max(2000),
  reportedEntityType: z.enum(['property', 'landlord', 'agent', 'customer', 'message']),
  reportedEntityId: z.string().min(1),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export const createDisputeSchema = z.object({
  againstId: z.string().min(1),
  type: z.enum([
    'payment_dispute',
    'property_mismatch',
    'landlord_dispute',
    'agent_fee_dispute',
    'agreement_dispute',
    'refund_request',
  ]),
  paymentId: z.string().optional(),
  propertyId: z.string().optional(),
  description: z.string().min(10).max(3000),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000),
  attachments: z.array(z.object({ url: z.string().url(), type: z.string() })).optional(),
});

export const startConversationSchema = z.object({
  participantId: z.string().min(1),
  propertyId: z.string().optional(),
});

export const signAgreementSchema = z.object({
  signatureData: z.string().min(1),
});

export const verifyDocumentSchema = z.object({
  type: z.enum([
    'identity',
    'proof_of_address',
    'landlord_ownership',
    'agent_license',
    'agent_authorization',
    'income_proof',
    'other',
  ]),
  documentUrl: z.string().url(),
});

export const uuidParamSchema = z.object({ id: z.string().uuid() });

export type SearchInput = z.infer<typeof searchSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
