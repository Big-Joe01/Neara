import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { appConfig } from '@neara/config';
import { generateAgreementId } from '@neara/utils';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { mapAgreement } from '../mappers/index.js';
import { notify } from '../lib/notify.js';
import { getClientIp } from '../utils/ip.js';
import type { AuthedRequest } from '../middleware/auth.js';
import type { Agreement } from '@neara/types';

class AgreementService {
  /** Generate the agreement terms text with NEARA branding + transparent details. */
  private async buildTerms(ctx: {
    property: {
      title: string;
      address: string;
      city: string;
      state: string;
      rentalPeriod: string;
      rent: number;
    };
    landlordName: string;
    tenantName: string;
    amount: number;
    agreementId: string;
    breakdownText: string;
  }): Promise<string> {
    const date = new Date().toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `NEARA TENANCY AGREEMENT

Agreement ID: ${ctx.agreementId}
Date: ${date}

This Tenancy Agreement is made between:

LANDLORD: ${ctx.landlordName}
TENANT: ${ctx.tenantName}

PROPERTY: ${ctx.property.title}
ADDRESS: ${ctx.property.address}, ${ctx.property.city}, ${ctx.property.state}
RENTAL PERIOD: ${ctx.property.rentalPeriod}
ANNUAL/MONTHLY RENT: ₦${ctx.property.rent.toLocaleString()}

PAYMENT BREAKDOWN
${ctx.breakdownText}

Total amount paid: ₦${ctx.amount.toLocaleString()}

TERMS AND CONDITIONS

1. The Landlord agrees to let, and the Tenant agrees to rent, the property described above.
2. The Tenant shall pay the rent and all disclosed fees as listed in the payment breakdown above.
3. The Tenancy shall commence upon payment confirmation and shall run for the agreed rental period.
4. The Tenant shall keep the property in good condition and shall not sub-let without the Landlord's written consent.
5. The Landlord shall ensure the property is habitable and utilities are as represented on the NEARA listing.
6. Either party may terminate this agreement in accordance with the stated termination terms.
7. All payments under this agreement were processed and recorded through the NEARA platform.

RESPONSIBILITIES
- Tenant: maintain the property, pay disclosed charges, vacate in good condition.
- Landlord: provide the property as listed, address structural repairs, honour utilities disclosed.

TERMINATION
Either party may give written notice as required by Nigerian tenancy law applicable in the property's state.

SIGNATURES
This agreement is digitally signed by both parties below. NEARA records the signature metadata
(timestamp, document version) and acts as the digital platform/recording party for this transaction.
NEARA is NOT a licensed legal practitioner or notary. Where legal witnessing or notarization is
legally required, parties should obtain the services of a qualified legal professional.

PLATFORM WITNESS
NEARA — "One tap from home."
This agreement was generated, signed, and recorded on the NEARA platform.

Verification URL: ${appConfig.api.url}/api/agreements/${ctx.agreementId}/verify`;
  }

  /** Generate the agreement PDF document URL (text-based for MVP; upgradeable to PDF lib). */
  async generateForPayment(paymentId: string): Promise<Agreement> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        property: { select: { title: true, address: true, city: true, state: true, rentalPeriod: true, rent: true, landlordId: true, agentId: true } },
        customer: { select: { id: true, displayName: true, email: true } },
      },
    });
    if (!payment) throw notFound('Payment not found');
    if (payment.status !== 'successful') {
      throw badRequest('Agreement can only be generated after confirmed payment.');
    }

    const existing = await prisma.agreement.findFirst({ where: { paymentId }, include: { signatures: true } });
    if (existing) return mapAgreement(existing);

    const landlord = await prisma.user.findUnique({
      where: { id: payment.property.landlordId },
      select: { displayName: true },
    });
    const agreementId = generateAgreementId();
    const verificationUrl = `${appConfig.api.url}/api/agreements/${agreementId}/verify`;

    const breakdownText = paymentService_breakdownText(payment.breakdown);
    const terms = await this.buildTerms({
      property: payment.property,
      landlordName: landlord?.displayName ?? 'Landlord',
      tenantName: payment.customer.displayName,
      amount: payment.amount,
      agreementId,
      breakdownText,
    });

    const qrCodeUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 220,
      color: { dark: '#006840', light: '#ffffff' },
    });
    const documentUrl = `${appConfig.api.url}/api/agreements/${agreementId}/document`;

    const agreement = await prisma.agreement.create({
      data: {
        agreementId,
        paymentId,
        propertyId: payment.propertyId,
        landlordId: payment.property.landlordId,
        tenantId: payment.customerId,
        agentId: payment.property.agentId ?? null,
        documentUrl,
        verificationUrl,
        qrCodeUrl,
        terms,
        status: 'pending_signature',
      },
      include: { signatures: true },
    });

    await notify(
      payment.customerId,
      'agreement',
      'Tenancy agreement ready',
      'Your tenancy agreement has been generated. Please review and sign.',
      { agreementId: agreement.id },
    );
    await notify(
      payment.property.landlordId,
      'agreement',
      'Tenancy agreement ready',
      'A tenancy agreement has been generated. Please review and sign.',
      { agreementId: agreement.id },
    );

    return mapAgreement(agreement);
  }

  async sign(agreementId: string, req: AuthedRequest, signatureData: string): Promise<Agreement> {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { signatures: true, payment: { select: { customerId: true } }, property: { select: { landlordId: true } } },
    });
    if (!agreement) throw notFound('Agreement not found');
    if (agreement.status === 'voided' || agreement.status === 'executed') {
      throw conflict('This agreement cannot be signed in its current state.');
    }

    const userId = req.user!.id;
    const isLandlord = agreement.property.landlordId === userId;
    const isTenant = agreement.payment.customerId === userId;
    if (!isLandlord && !isTenant) {
      throw badRequest('You are not a party to this agreement.');
    }

    const alreadySigned = agreement.signatures.find((s) => s.signerId === userId);
    if (alreadySigned) throw conflict('You have already signed this agreement.');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, role: true },
    });

    const signature = await prisma.agreementSignature.create({
      data: {
        agreementId,
        signerId: userId,
        signerName: user!.displayName,
        signerRole: user!.role,
        signatureData,
        ipAddress: getClientIp(req),
        documentVersion: agreement.documentVersion,
      },
    });

    // Execute when both parties have signed
    const signatures = [...agreement.signatures, signature];
    const landlordSigned = signatures.some((s) => s.signerId === agreement.property.landlordId);
    const tenantSigned = signatures.some((s) => s.signerId === agreement.payment.customerId);
    const executed = landlordSigned && tenantSigned;

    const updated = await prisma.agreement.update({
      where: { id: agreementId },
      data: { status: executed ? 'executed' : 'signed' },
      include: { signatures: true },
    });

    await notify(
      userId === agreement.property.landlordId
        ? agreement.payment.customerId
        : agreement.property.landlordId,
      'signature',
      'Agreement signed',
      `${user!.displayName} has signed the tenancy agreement.`,
      { agreementId },
    );

    if (executed) {
      await notify(
        agreement.property.landlordId,
        'signature',
        'Agreement executed',
        'Your tenancy agreement has been fully signed by both parties.',
        { agreementId },
      );
      await notify(
        agreement.payment.customerId,
        'signature',
        'Agreement executed',
        'Your tenancy agreement has been fully signed. You can download your copy.',
        { agreementId },
      );
    }

    return mapAgreement(updated);
  }

  async getForUser(agreementId: string, userId: string): Promise<Agreement> {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { signatures: true },
    });
    if (!agreement) throw notFound('Agreement not found');
    if (
      agreement.tenantId !== userId &&
      agreement.landlordId !== userId &&
      (agreement.agentId ?? '') !== userId
    ) {
      // public verification allowed via verify endpoint; full doc restricted to parties
      throw notFound('Agreement not found');
    }
    return mapAgreement(agreement);
  }

  async listForUser(userId: string): Promise<Agreement[]> {
    const agreements = await prisma.agreement.findMany({
      where: {
        OR: [{ tenantId: userId }, { landlordId: userId }],
      },
      include: { signatures: true },
      orderBy: { createdAt: 'desc' },
    });
    return agreements.map(mapAgreement);
  }

  /** Public verification by agreementId — confirms existence + signature count. */
  async verify(agreementId: string) {
    const agreement = await prisma.agreement.findUnique({
      where: { agreementId },
      select: {
        agreementId: true,
        status: true,
        documentVersion: true,
        createdAt: true,
        signatures: { select: { signerName: true, signerRole: true, signedAt: true } },
      },
    });
    if (!agreement) throw notFound('Agreement not found or has been altered.');
    return {
      agreementId: agreement.agreementId,
      status: agreement.status,
      valid: agreement.status === 'executed',
      documentVersion: agreement.documentVersion,
      createdAt: agreement.createdAt.toISOString(),
      signatures: agreement.signatures.map((s) => ({
        signerName: s.signerName,
        signerRole: s.signerRole,
        signedAt: s.signedAt.toISOString(),
      })),
    };
  }
}

function paymentService_breakdownText(breakdown: unknown): string {
  const b = (breakdown ?? {}) as {
    rent?: number;
    agentFee?: number;
    legalFee?: number;
    cautionFee?: number;
    serviceCharge?: number;
    otherFees?: number;
    otherFeesLabel?: string;
    total?: number;
  };
  const lines: string[] = [];
  if (b.rent) lines.push(`Rent: ₦${b.rent.toLocaleString()}`);
  if (b.agentFee) lines.push(`Agent fee: ₦${b.agentFee.toLocaleString()}`);
  if (b.legalFee) lines.push(`Legal fee: ₦${b.legalFee.toLocaleString()}`);
  if (b.cautionFee) lines.push(`Caution fee: ₦${b.cautionFee.toLocaleString()}`);
  if (b.serviceCharge) lines.push(`Service charge: ₦${b.serviceCharge.toLocaleString()}`);
  if (b.otherFees) lines.push(`${b.otherFeesLabel ?? 'Other charges'}: ₦${b.otherFees.toLocaleString()}`);
  if (b.total) lines.push(`TOTAL: ₦${b.total.toLocaleString()}`);
  return lines.join('\n');
}

export const agreementService = new AgreementService();
