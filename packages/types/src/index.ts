/**
 * NEARA shared domain types.
 * Consumed by the API, web, admin, and mobile apps.
 */

export type UserRole = 'CUSTOMER' | 'LANDLORD' | 'AGENT' | 'ADMIN';

export type RentalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type ElectricityReliability = 'excellent' | 'fair' | 'poor' | 'none';
export type WaterAvailability = 'reliable' | 'intermittent' | 'none';
export type WaterSource = 'borehole' | 'tap' | 'tanker' | 'well' | 'none';

export type ListingSource = 'direct' | 'agent';
export type VerificationLevel =
  | 'none'
  | 'identity'
  | 'landlord'
  | 'property'
  | 'inspection'
  | 'neara';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  status: UserStatus;
}

export type UserStatus = 'active' | 'suspended' | 'pending' | 'deleted';

export interface ProfileBase {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface CustomerProfile extends ProfileBase {
  occupation?: string | null;
  employer?: string | null;
  monthlyIncome?: number | null;
  preferredLocations?: string[];
}

export interface LandlordProfile extends ProfileBase {
  companyName?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  totalProperties: number;
  verifiedAtLevel: VerificationLevel;
}

export interface AgentProfile extends ProfileBase {
  agencyName?: string | null;
  licenseNumber?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  ratingAverage: number;
  ratingCount: number;
  activeAuthorizations: number;
}

export interface AdminProfile extends ProfileBase {
  role: 'moderator' | 'super_admin';
}

export interface PropertyLocation {
  address: string;
  city: string;
  state: string;
  area?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

export interface PropertyFees {
  rent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  agentFee: number;
  otherFees: number;
  otherFeesLabel?: string;
  /** Computed total estimated move-in cost (server-calculated). */
  totalMoveIn: number;
}

export interface PropertyUtilities {
  electricity: ElectricityReliability;
  prepaidMeter: boolean;
  water: WaterAvailability;
  waterSource: WaterSource;
  internet: boolean;
  generator: boolean;
  borehole: boolean;
  estimatedUtilityCost?: number | null;
}

export interface PropertyFeatures {
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
}

export interface PropertyMedia {
  coverImage: string;
  images: PropertyImage[];
  videoUrl?: string | null;
  tour360Url?: string | null;
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  isCover: boolean;
  order: number;
}

export type PropertyStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'suspended'
  | 'rented'
  | 'expired'
  | 'removed';

export interface PropertyAmenity {
  id: string;
  name: string;
  icon?: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  propertyTypeId: string;
  propertyType?: PropertyType;
  rentalPeriod: RentalPeriod;
  location: PropertyLocation;
  fees: PropertyFees;
  utilities: PropertyUtilities;
  features: PropertyFeatures;
  media: PropertyMedia;
  amenities: PropertyAmenity[];
  listingSource: ListingSource;
  landlord: LandlordProfile;
  agent?: AgentProfile | null;
  agentAuthorization?: AgentAuthorization | null;
  verification: PropertyVerification;
  status: PropertyStatus;
  views: number;
  saves: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  isFavorited?: boolean;
}

export interface PropertyType {
  id: string;
  name: string;
  slug: string;
  category?: string;
  isActive: boolean;
}

export interface PropertyVerification {
  level: VerificationLevel;
  nearaVerified: boolean;
  identityVerified: boolean;
  landlordVerified: boolean;
  propertyVerified: boolean;
  inspectionVerified: boolean;
  verifiedAt?: string | null;
}

export type AuthorizationStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'revoked'
  | 'expired';

export interface AgentAuthorization {
  id: string;
  agentId: string;
  landlordId: string;
  propertyId?: string | null;
  status: AuthorizationStatus;
  /** Landlord granted via NEARA, or agent submitted external evidence. */
  source: 'landlord_grant' | 'agent_evidence';
  evidenceDocumentUrl?: string | null;
  validFrom: string;
  validUntil?: string | null;
  createdAt: string;
  verifiedAt?: string | null;
  revokedAt?: string | null;
}

export interface FeeRule {
  id: string;
  name: string;
  minRent: number;
  maxRent: number | null;
  maxPercentage: number;
  maxFixedFee: number | null;
  minFee: number | null;
  propertyTypeIds?: string[];
  locationIds?: string[];
  validFrom: string;
  validUntil?: string | null;
  isActive: boolean;
}

export interface FeeCalculation {
  rent: number;
  maxAllowedAgentFee: number;
  appliedPercentage: number;
  appliedFixedFee: number | null;
  minFee: number | null;
  rule: FeeRule;
  exceedsLimit: boolean;
}

export type InspectionStatus =
  | 'requested'
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled'
  | 'completed';

export interface Inspection {
  id: string;
  propertyId: string;
  customerId: string;
  landlordId?: string;
  agentId?: string;
  requestedDate: string;
  requestedTime: string;
  confirmedDate?: string | null;
  status: InspectionStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'info_requested'
  | 'withdrawn';

export interface Application {
  id: string;
  propertyId: string;
  customerId: string;
  landlordId: string;
  agentId?: string;
  moveInDate: string;
  requestedPeriod: RentalPeriod;
  employment?: string;
  income?: number;
  supportingDocuments?: VerificationDocument[];
  status: ApplicationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded' | 'cancelled';
export type PaymentProvider = 'paystack' | 'bank_transfer' | 'ussd' | 'other';

export interface PaymentBreakdownItem {
  label: string;
  amount: number;
}

export interface PaymentBreakdown {
  rent: number;
  agentFee: number;
  legalFee: number;
  cautionFee: number;
  serviceCharge: number;
  otherFees: number;
  otherFeesLabel?: string;
  total: number;
  items: PaymentBreakdownItem[];
}

export interface Payment {
  id: string;
  reference: string;
  propertyId: string;
  customerId: string;
  landlordId: string;
  agentId?: string;
  applicationId?: string;
  breakdown: PaymentBreakdown;
  amount: number;
  provider: PaymentProvider;
  providerReference?: string;
  status: PaymentStatus;
  receiptUrl?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agreement {
  id: string;
  agreementId: string;
  paymentId: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  agentId?: string;
  documentUrl: string;
  verificationUrl: string;
  qrCodeUrl: string;
  terms: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'executed' | 'voided';
  signatures: AgreementSignature[];
  createdAt: string;
  updatedAt: string;
}

export interface AgreementSignature {
  id: string;
  agreementId: string;
  signerId: string;
  signerName: string;
  signerRole: UserRole;
  signatureData: string;
  signedAt: string;
  ipAddress?: string;
  documentVersion: string;
}

export interface VerificationDocument {
  id: string;
  userId: string;
  type: DocumentType;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewerId?: string;
  notes?: string;
  uploadedAt: string;
}

export type DocumentType =
  | 'identity'
  | 'proof_of_address'
  | 'landlord_ownership'
  | 'agent_license'
  | 'agent_authorization'
  | 'income_proof'
  | 'other';

export interface Conversation {
  id: string;
  propertyId?: string;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: { url: string; type: string }[];
  readBy: string[];
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'new_property'
  | 'application'
  | 'application_status'
  | 'inspection'
  | 'payment'
  | 'agreement'
  | 'signature'
  | 'agent_authorization'
  | 'verification'
  | 'message'
  | 'dispute'
  | 'account'
  | 'report';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  channel: 'in_app' | 'push' | 'email' | 'sms';
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  propertyId?: string;
  landlordId?: string;
  agentId?: string;
  rating: number;
  comment: string;
  isVerifiedTransaction: boolean;
  createdAt: string;
}

export type ReportReason =
  | 'fake_property'
  | 'fake_landlord'
  | 'fake_agent'
  | 'wrong_price'
  | 'wrong_location'
  | 'misleading_photos'
  | 'duplicate_property'
  | 'scam'
  | 'abusive_behavior'
  | 'inappropriate_content'
  | 'other';

export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reason: ReportReason;
  description: string;
  reportedEntityType: 'property' | 'landlord' | 'agent' | 'customer' | 'message';
  reportedEntityId: string;
  evidenceUrls?: string[];
  status: ReportStatus;
  priority: ReportPriority;
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type DisputeStatus =
  | 'opened'
  | 'under_review'
  | 'awaiting_information'
  | 'resolved'
  | 'rejected'
  | 'escalated';

export type DisputeType =
  | 'payment_dispute'
  | 'property_mismatch'
  | 'landlord_dispute'
  | 'agent_fee_dispute'
  | 'agreement_dispute'
  | 'refund_request';

export interface Dispute {
  id: string;
  openedById: string;
  againstId: string;
  type: DisputeType;
  paymentId?: string;
  propertyId?: string;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorRole?: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
}

export interface SearchFilters {
  query?: string;
  city?: string;
  area?: string;
  propertyTypeIds?: string[];
  minRent?: number;
  maxRent?: number;
  rentalPeriod?: RentalPeriod;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  electricity?: ElectricityReliability;
  water?: WaterAvailability;
  listingSource?: ListingSource;
  nearaVerified?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sort?: SearchSort;
}

export type SearchSort =
  | 'lowest_price'
  | 'highest_price'
  | 'newest'
  | 'closest'
  | 'most_viewed'
  | 'most_saved';

export interface DashboardStats {
  totalUsers: number;
  activeLandlords: number;
  activeAgents: number;
  properties: number;
  verifiedProperties: number;
  activeListings: number;
  transactions: number;
  revenue: number;
  pendingVerifications: number;
  pendingReports: number;
  disputes: number;
  agentActivity: number;
}
