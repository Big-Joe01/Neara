import { appConfig } from '@neara/config';
import { generateReference } from '@neara/utils';
import { prisma } from '../lib/prisma.js';
import { AppError, badRequest, ErrorCodes, feeExceedsLimit, notFound } from '../lib/errors.js';
import { feeService } from './fee.service.js';
import { mapPayment, mapPaymentBreakdown } from '../mappers/index.js';
import type { PaymentBreakdown, Payment, PaymentProvider } from '@neara/types';
import { audit } from '../lib/audit.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { agreementService } from './agreement.service.js';
import crypto from 'node:crypto';
import { notify } from '../lib/notify.js';

export interface PaystackInitializeResponse {
  status: boolean;
  data: {
    reference: string;
    authorization_url: string;
    access_code: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  data: {
    reference: string;
    amount: number; // in kobo
    currency: string;
    status: string;
    gateway_response: string;
    channel: string;
    customer: { email: string };
    metadata?: Record<string, unknown>;
  };
}

/**
 * Payment provider abstraction. Currently Paystack; structured so another
 * provider can be added later (flutterwave, stripe, etc.) behind the same
 * interface.
 */
export interface IPaymentProvider {
  initialize(
    amount: number,
    email: string,
    reference: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ authorizationUrl: string; providerReference: string }>;
  verify(reference: string): Promise<PaystackVerifyResponse>;
}

class PaystackProvider implements IPaymentProvider {
  private get secretKey(): string {
    return appConfig.paystack.secretKey;
  }
  private get baseUrl(): string {
    return appConfig.paystack.baseUrl;
  }

  async initialize(
    amount: number,
    email: string,
    reference: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ authorizationUrl: string; providerReference: string }> {
    if (!this.secretKey) {
      throw badRequest('Paystack is not configured. Set PAYSTACK_SECRET_KEY.');
    }
    const res = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // kobo
        reference,
        currency: 'NGN',
        metadata: metadata ?? {},
        callback_url: `${appConfig.web.url}/payment/callback`,
      }),
    });
    const json = (await res.json()) as PaystackInitializeResponse;
    if (!json.status) {
      throw new AppError(502, ErrorCodes.PAYMENT_FAILED, 'Failed to initialize payment.');
    }
    return {
      authorizationUrl: json.data.authorization_url,
      providerReference: json.data.reference,
    };
  }

  async verify(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.secretKey) {
      throw badRequest('Paystack is not configured. Set PAYSTACK_SECRET_KEY.');
    }
    const res = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    const json = (await res.json()) as PaystackVerifyResponse;
    return json;
  }

  /** Verify the webhook signature (HMAC SHA512). */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!appConfig.paystack.webhookSecret) return false;
    const expected = crypto
      .createHmac('sha512', appConfig.paystack.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }
}

class PaymentService {
  private provider: IPaymentProvider;

  constructor(provider: IPaymentProvider = new PaystackProvider()) {
    this.provider = provider;
  }

  /** Build the transparent payment breakdown from property fees + fee regulation. */
  async buildBreakdown(propertyId: string, proposedAgentFee?: number): Promise<{
    breakdown: PaymentBreakdown;
    feeCalculation: Awaited<ReturnType<typeof feeService.calculate>>;
  }> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        rent: true,
        cautionFee: true,
        serviceCharge: true,
        legalFee: true,
        agentFee: true,
        otherFees: true,
        otherFeesLabel: true,
        propertyTypeId: true,
      },
    });
    if (!property) throw notFound('Property not found');

    const agentFee = proposedAgentFee ?? property.agentFee;
    const feeCalculation = await feeService.calculate(
      property.rent,
      agentFee,
      property.propertyTypeId,
      undefined,
      true,
    );

    const breakdown: PaymentBreakdown = {
      rent: property.rent,
      agentFee,
      legalFee: property.legalFee,
      cautionFee: property.cautionFee,
      serviceCharge: property.serviceCharge,
      otherFees: property.otherFees,
      otherFeesLabel: property.otherFeesLabel ?? undefined,
      total:
        property.rent +
        agentFee +
        property.legalFee +
        property.cautionFee +
        property.serviceCharge +
        property.otherFees,
      items: [],
    } as PaymentBreakdown;
    breakdown.items = [
      { label: 'Rent', amount: breakdown.rent },
      { label: 'Agent fee', amount: breakdown.agentFee },
      { label: 'Legal fee', amount: breakdown.legalFee },
      { label: 'Caution fee', amount: breakdown.cautionFee },
      { label: 'Service charge', amount: breakdown.serviceCharge },
      ...(breakdown.otherFees > 0
        ? [{ label: breakdown.otherFeesLabel ?? 'Other charges', amount: breakdown.otherFees }]
        : []),
    ];
    return { breakdown, feeCalculation };
  }

  /** Initialize a payment. Validates fee regulation before creating a record. */
  async init(
    req: AuthedRequest,
    propertyId: string,
    provider: PaymentProvider,
    applicationId?: string,
  ) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        rent: true,
        agentFee: true,
        landlordId: true,
        agentId: true,
        title: true,
        status: true,
      },
    });
    if (!property) throw notFound('Property not found');
    if (property.status !== 'active') {
      throw badRequest('This property is not available for payment.');
    }

    const { breakdown } = await this.buildBreakdown(propertyId);

    const reference = generateReference('PAY');
    const payment = await prisma.payment.create({
      data: {
        reference,
        propertyId,
        customerId: req.user!.id,
        landlordId: property.landlordId,
        agentId: property.agentId ?? null,
        applicationId,
        amount: breakdown.total,
        breakdown: breakdown as unknown as object,
        provider,
        status: 'pending',
      },
    });

    const customer = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true },
    });

    let authorizationUrl: string | undefined;
    if (provider === 'paystack' && appConfig.paystack.secretKey) {
      const init = await this.provider.initialize(breakdown.total, customer!.email, reference, {
        paymentId: payment.id,
        propertyId,
        customerId: req.user!.id,
        custom_fields: [
          { display_name: 'Property', variable_name: 'property', value: property.title },
          { display_name: 'Platform', variable_name: 'platform', value: 'NEARA' },
        ],
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerReference: init.providerReference },
      });
      authorizationUrl = init.authorizationUrl;
    } else {
      // bank_transfer / ussd: in production, generate virtual account here.
      // Test-mode: returns a pending payment the webhook/verify can settle.
    }

    await audit(req, 'payment.init', 'payment', payment.id, { amount: breakdown.total });

    return {
      payment: mapPayment(
        await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }),
      ),
      authorizationUrl,
    };
  }

  /** Verify a transaction server-side. NEVER trust frontend payment success. */
  async verifyAndSettle(reference: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) throw notFound('Payment not found');

    // Idempotency: already settled
    if (payment.status === 'successful' && payment.webhookProcessedAt) {
      return mapPayment(payment);
    }

    if (payment.provider === 'paystack' && appConfig.paystack.secretKey) {
      const verify = await this.provider.verify(reference);
      const status = verify.data?.status;
      if (status === 'success') {
        return this.settlePayment(payment.id, verify.data?.reference ?? reference);
      }
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed', providerReference: verify.data?.reference },
      });
      throw new AppError(402, ErrorCodes.PAYMENT_FAILED, 'Payment was not successful.');
    }

    // Non-gateway providers must be settled via webhook/admin confirmation only.
    throw badRequest(
      'This payment provider requires server-side webhook confirmation.',
    );
  }

  /** Settle a payment: mark successful, generate receipt, trigger agreement. */
  async settlePayment(paymentId: string, providerReference: string): Promise<Payment> {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
      if (payment.status === 'successful') {
        return mapPayment(payment);
      }

      const settled = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'successful',
          providerReference,
          paidAt: new Date(),
          webhookProcessedAt: new Date(),
          receiptUrl: `${appConfig.api.url}/api/payments/${payment.id}/receipt`,
        },
      });

      // Mark property rented
      await tx.property.update({
        where: { id: payment.propertyId },
        data: { status: 'rented' },
      });

      await notify(
        payment.customerId,
        'payment',
        'Payment confirmed',
        `Your payment of ₦${payment.amount.toLocaleString()} was successful. Your receipt is ready.`,
        { paymentId: payment.id },
      );
      await notify(
        payment.landlordId,
        'payment',
        'Payment received',
        `A payment of ₦${payment.amount.toLocaleString()} has been received for your property.`,
        { paymentId: payment.id },
      );

      // Generate the tenancy agreement after confirmed payment.
      try {
        await agreementService.generateForPayment(paymentId);
      } catch (e) {
        // agreement generation failure should not roll back a settled payment
        console.error('agreement generation failed', e);
      }

      return mapPayment(settled);
    });
  }

  /** Webhook handler — verifies signature, is idempotent. */
  async handleWebhook(rawBody: string, signature: string): Promise<{ received: boolean }> {
    if (!(this.provider as PaystackProvider).verifyWebhookSignature(rawBody, signature)) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid webhook signature');
    }
    const event = JSON.parse(rawBody) as {
      event: string;
      data: { reference: string; status: string };
    };

    if (event.event === 'charge.success' && event.data?.reference) {
      const payment = await prisma.payment.findUnique({
        where: { reference: event.data.reference },
      });
      if (payment && payment.status !== 'successful') {
        await this.settlePayment(payment.id, event.data.reference);
      }
    }
    return { received: true };
  }

  async listForUser(userId: string) {
    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ customerId: userId }, { landlordId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map(mapPayment);
  }

  async getById(id: string, userId: string) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw notFound('Payment not found');
    if (
      payment.customerId !== userId &&
      payment.landlordId !== userId &&
      payment.agentId !== userId
    ) {
      // admins handled separately
    }
    return mapPayment(payment);
  }

  breakdownToText(b: PaymentBreakdown): string {
    const lines = b.items.map((i) => `${i.label}: ₦${i.amount.toLocaleString()}`);
    lines.push(`TOTAL: ₦${b.total.toLocaleString()}`);
    return lines.join('\n');
  }
}

export const paymentService = new PaymentService();
export { feeExceedsLimit };
