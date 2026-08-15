-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('CUSTOMER', 'LANDLORD', 'AGENT', 'ADMIN') NOT NULL,
    `status` ENUM('active', 'suspended', 'pending', 'deleted') NOT NULL DEFAULT 'pending',
    `displayName` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `isIdentityVerified` BOOLEAN NOT NULL DEFAULT false,
    `verificationLevel` ENUM('none', 'identity', 'landlord', 'property', 'inspection', 'neara') NOT NULL DEFAULT 'none',
    `otpCode` VARCHAR(191) NULL,
    `otpExpiresAt` DATETIME(3) NULL,
    `otpPurpose` VARCHAR(191) NULL,
    `resetToken` VARCHAR(191) NULL,
    `resetTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenHash` VARCHAR(191) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    UNIQUE INDEX `User_resetToken_key`(`resetToken`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_status_idx`(`status`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `occupation` VARCHAR(191) NULL,
    `employer` VARCHAR(191) NULL,
    `monthlyIncome` INTEGER NULL,
    `preferredLocations` JSON NULL,
    `bio` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CustomerProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LandlordProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LandlordProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `agencyName` VARCHAR(191) NULL,
    `licenseNumber` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `ratingAverage` DOUBLE NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgentProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('moderator', 'super_admin') NOT NULL DEFAULT 'moderator',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PropertyType_slug_key`(`slug`),
    INDEX `PropertyType_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Amenity` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Amenity_name_key`(`name`),
    UNIQUE INDEX `Amenity_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Location_slug_key`(`slug`),
    INDEX `Location_city_idx`(`city`),
    INDEX `Location_state_idx`(`state`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Property` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `propertyTypeId` VARCHAR(191) NOT NULL,
    `rentalPeriod` ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NOT NULL,
    `status` ENUM('draft', 'pending_review', 'active', 'suspended', 'rented', 'expired', 'removed') NOT NULL DEFAULT 'pending_review',
    `listingSource` ENUM('direct', 'agent') NOT NULL DEFAULT 'direct',
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NULL,
    `landmark` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `rent` INTEGER NOT NULL,
    `cautionFee` INTEGER NOT NULL DEFAULT 0,
    `serviceCharge` INTEGER NOT NULL DEFAULT 0,
    `legalFee` INTEGER NOT NULL DEFAULT 0,
    `agentFee` INTEGER NOT NULL DEFAULT 0,
    `otherFees` INTEGER NOT NULL DEFAULT 0,
    `otherFeesLabel` VARCHAR(191) NULL,
    `totalMoveIn` INTEGER NOT NULL DEFAULT 0,
    `electricity` ENUM('excellent', 'fair', 'poor', 'none') NOT NULL DEFAULT 'fair',
    `prepaidMeter` BOOLEAN NOT NULL DEFAULT false,
    `water` ENUM('reliable', 'intermittent', 'none') NOT NULL DEFAULT 'intermittent',
    `waterSource` ENUM('borehole', 'tap', 'tanker', 'well', 'none') NOT NULL DEFAULT 'tap',
    `internet` BOOLEAN NOT NULL DEFAULT false,
    `generator` BOOLEAN NOT NULL DEFAULT false,
    `borehole` BOOLEAN NOT NULL DEFAULT false,
    `estimatedUtilityCost` INTEGER NULL,
    `bedrooms` INTEGER NOT NULL DEFAULT 0,
    `bathrooms` INTEGER NOT NULL DEFAULT 0,
    `kitchen` BOOLEAN NOT NULL DEFAULT true,
    `parking` INTEGER NOT NULL DEFAULT 0,
    `security` BOOLEAN NOT NULL DEFAULT false,
    `compound` BOOLEAN NOT NULL DEFAULT false,
    `fenced` BOOLEAN NOT NULL DEFAULT false,
    `airConditioning` BOOLEAN NOT NULL DEFAULT false,
    `furnished` BOOLEAN NOT NULL DEFAULT false,
    `balcony` BOOLEAN NOT NULL DEFAULT false,
    `wardrobe` BOOLEAN NOT NULL DEFAULT false,
    `securityGate` BOOLEAN NOT NULL DEFAULT false,
    `coverImage` VARCHAR(191) NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `tour360Url` VARCHAR(191) NULL,
    `nearaVerified` BOOLEAN NOT NULL DEFAULT false,
    `identityVerified` BOOLEAN NOT NULL DEFAULT false,
    `landlordVerified` BOOLEAN NOT NULL DEFAULT false,
    `propertyVerified` BOOLEAN NOT NULL DEFAULT false,
    `inspectionVerified` BOOLEAN NOT NULL DEFAULT false,
    `verificationLevel` ENUM('none', 'identity', 'landlord', 'property', 'inspection', 'neara') NOT NULL DEFAULT 'none',
    `verifiedAt` DATETIME(3) NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `saves` INTEGER NOT NULL DEFAULT 0,
    `ratingAverage` DOUBLE NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Property_slug_key`(`slug`),
    INDEX `Property_landlordId_idx`(`landlordId`),
    INDEX `Property_city_idx`(`city`),
    INDEX `Property_state_idx`(`state`),
    INDEX `Property_propertyTypeId_idx`(`propertyTypeId`),
    INDEX `Property_status_idx`(`status`),
    INDEX `Property_rentalPeriod_idx`(`rentalPeriod`),
    INDEX `Property_rent_idx`(`rent`),
    INDEX `Property_createdAt_idx`(`createdAt`),
    INDEX `Property_nearaVerified_idx`(`nearaVerified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyImage` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NULL,
    `isCover` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PropertyImage_propertyId_idx`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyAmenity` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `amenityId` VARCHAR(191) NOT NULL,

    INDEX `PropertyAmenity_propertyId_idx`(`propertyId`),
    UNIQUE INDEX `PropertyAmenity_propertyId_amenityId_key`(`propertyId`, `amenityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentAuthorization` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NULL,
    `status` ENUM('pending', 'verified', 'rejected', 'revoked', 'expired') NOT NULL DEFAULT 'pending',
    `source` ENUM('landlord_grant', 'agent_evidence') NOT NULL,
    `evidenceDocumentUrl` VARCHAR(191) NULL,
    `validFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AgentAuthorization_agentId_idx`(`agentId`),
    INDEX `AgentAuthorization_landlordId_idx`(`landlordId`),
    INDEX `AgentAuthorization_propertyId_idx`(`propertyId`),
    INDEX `AgentAuthorization_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeeRule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `minRent` INTEGER NOT NULL,
    `maxRent` INTEGER NULL,
    `maxPercentage` DOUBLE NOT NULL,
    `maxFixedFee` INTEGER NULL,
    `minFee` INTEGER NULL,
    `propertyTypeIds` JSON NULL,
    `locationIds` JSON NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FeeRule_minRent_idx`(`minRent`),
    INDEX `FeeRule_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inspection` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NULL,
    `agentId` VARCHAR(191) NULL,
    `requestedDate` VARCHAR(191) NOT NULL,
    `requestedTime` VARCHAR(191) NOT NULL,
    `confirmedDate` DATETIME(3) NULL,
    `status` ENUM('requested', 'confirmed', 'rescheduled', 'cancelled', 'completed') NOT NULL DEFAULT 'requested',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Inspection_propertyId_idx`(`propertyId`),
    INDEX `Inspection_customerId_idx`(`customerId`),
    INDEX `Inspection_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `moveInDate` VARCHAR(191) NOT NULL,
    `requestedPeriod` ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NOT NULL,
    `employment` VARCHAR(191) NULL,
    `income` INTEGER NULL,
    `status` ENUM('submitted', 'under_review', 'approved', 'rejected', 'info_requested', 'withdrawn') NOT NULL DEFAULT 'submitted',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Application_propertyId_idx`(`propertyId`),
    INDEX `Application_customerId_idx`(`customerId`),
    INDEX `Application_landlordId_idx`(`landlordId`),
    INDEX `Application_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `breakdown` JSON NOT NULL,
    `provider` ENUM('paystack', 'bank_transfer', 'ussd', 'other') NOT NULL DEFAULT 'paystack',
    `providerReference` VARCHAR(191) NULL,
    `status` ENUM('pending', 'successful', 'failed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
    `receiptUrl` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `webhookProcessedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_reference_key`(`reference`),
    INDEX `Payment_propertyId_idx`(`propertyId`),
    INDEX `Payment_customerId_idx`(`customerId`),
    INDEX `Payment_status_idx`(`status`),
    INDEX `Payment_reference_idx`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agreement` (
    `id` VARCHAR(191) NOT NULL,
    `agreementId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `documentUrl` VARCHAR(191) NOT NULL,
    `verificationUrl` VARCHAR(191) NOT NULL,
    `qrCodeUrl` VARCHAR(191) NOT NULL,
    `terms` LONGTEXT NOT NULL,
    `status` ENUM('draft', 'pending_signature', 'signed', 'executed', 'voided') NOT NULL DEFAULT 'pending_signature',
    `documentVersion` VARCHAR(191) NOT NULL DEFAULT '1.0',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Agreement_agreementId_key`(`agreementId`),
    INDEX `Agreement_paymentId_idx`(`paymentId`),
    INDEX `Agreement_tenantId_idx`(`tenantId`),
    INDEX `Agreement_landlordId_idx`(`landlordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgreementSignature` (
    `id` VARCHAR(191) NOT NULL,
    `agreementId` VARCHAR(191) NOT NULL,
    `signerId` VARCHAR(191) NOT NULL,
    `signerName` VARCHAR(191) NOT NULL,
    `signerRole` ENUM('CUSTOMER', 'LANDLORD', 'AGENT', 'ADMIN') NOT NULL,
    `signatureData` TEXT NOT NULL,
    `signedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NULL,
    `documentVersion` VARCHAR(191) NOT NULL,

    INDEX `AgreementSignature_agreementId_idx`(`agreementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationDocument` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('identity', 'proof_of_address', 'landlord_ownership', 'agent_license', 'agent_authorization', 'income_proof', 'other') NOT NULL,
    `documentUrl` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewedAt` DATETIME(3) NULL,
    `reviewerId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VerificationDocument_userId_idx`(`userId`),
    INDEX `VerificationDocument_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NULL,
    `lastMessageAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Conversation_propertyId_idx`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lastReadAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConversationParticipant_userId_idx`(`userId`),
    UNIQUE INDEX `ConversationParticipant_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `attachments` JSON NULL,
    `readBy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_conversationId_idx`(`conversationId`),
    INDEX `Message_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('new_property', 'application', 'application_status', 'inspection', 'payment', 'agreement', 'signature', 'agent_authorization', 'verification', 'message', 'dispute', 'account', 'report') NOT NULL,
    `channel` ENUM('in_app', 'push', 'email', 'sms') NOT NULL DEFAULT 'in_app',
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `data` JSON NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_read_idx`(`read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NULL,
    `landlordId` VARCHAR(191) NULL,
    `agentId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `isVerifiedTransaction` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Review_propertyId_idx`(`propertyId`),
    INDEX `Review_landlordId_idx`(`landlordId`),
    INDEX `Review_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `reason` ENUM('fake_property', 'fake_landlord', 'fake_agent', 'wrong_price', 'wrong_location', 'misleading_photos', 'duplicate_property', 'scam', 'abusive_behavior', 'inappropriate_content', 'other') NOT NULL,
    `description` TEXT NOT NULL,
    `reportedEntityType` ENUM('property', 'landlord', 'agent', 'customer', 'message') NOT NULL,
    `reportedEntityId` VARCHAR(191) NOT NULL,
    `evidenceUrls` JSON NULL,
    `status` ENUM('open', 'under_review', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
    `priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    `adminNotes` TEXT NULL,
    `resolution` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `Report_reportedEntityId_idx`(`reportedEntityId`),
    INDEX `Report_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dispute` (
    `id` VARCHAR(191) NOT NULL,
    `openedById` VARCHAR(191) NOT NULL,
    `againstId` VARCHAR(191) NOT NULL,
    `type` ENUM('payment_dispute', 'property_mismatch', 'landlord_dispute', 'agent_fee_dispute', 'agreement_dispute', 'refund_request') NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `propertyId` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('opened', 'under_review', 'awaiting_information', 'resolved', 'rejected', 'escalated') NOT NULL DEFAULT 'opened',
    `resolution` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Dispute_openedById_idx`(`openedById`),
    INDEX `Dispute_againstId_idx`(`againstId`),
    INDEX `Dispute_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Favorite_userId_idx`(`userId`),
    UNIQUE INDEX `Favorite_userId_propertyId_key`(`userId`, `propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchHistory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `query` TEXT NOT NULL,
    `filters` JSON NULL,
    `propertyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SearchHistory_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSetting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlatformSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorRole` ENUM('CUSTOMER', 'LANDLORD', 'AGENT', 'ADMIN') NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_actorId_idx`(`actorId`),
    INDEX `AuditLog_entityType_idx`(`entityType`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerProfile` ADD CONSTRAINT `CustomerProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LandlordProfile` ADD CONSTRAINT `LandlordProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentProfile` ADD CONSTRAINT `AgentProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminProfile` ADD CONSTRAINT `AdminProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_propertyTypeId_fkey` FOREIGN KEY (`propertyTypeId`) REFERENCES `PropertyType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyImage` ADD CONSTRAINT `PropertyImage_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyAmenity` ADD CONSTRAINT `PropertyAmenity_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyAmenity` ADD CONSTRAINT `PropertyAmenity_amenityId_fkey` FOREIGN KEY (`amenityId`) REFERENCES `Amenity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentAuthorization` ADD CONSTRAINT `AgentAuthorization_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentAuthorization` ADD CONSTRAINT `AgentAuthorization_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentAuthorization` ADD CONSTRAINT `AgentAuthorization_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeRule` ADD CONSTRAINT `FeeRule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agreement` ADD CONSTRAINT `Agreement_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agreement` ADD CONSTRAINT `Agreement_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agreement` ADD CONSTRAINT `Agreement_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agreement` ADD CONSTRAINT `Agreement_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgreementSignature` ADD CONSTRAINT `AgreementSignature_agreementId_fkey` FOREIGN KEY (`agreementId`) REFERENCES `Agreement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgreementSignature` ADD CONSTRAINT `AgreementSignature_signerId_fkey` FOREIGN KEY (`signerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationDocument` ADD CONSTRAINT `VerificationDocument_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_openedById_fkey` FOREIGN KEY (`openedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_againstId_fkey` FOREIGN KEY (`againstId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dispute` ADD CONSTRAINT `Dispute_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchHistory` ADD CONSTRAINT `SearchHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchHistory` ADD CONSTRAINT `SearchHistory_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
