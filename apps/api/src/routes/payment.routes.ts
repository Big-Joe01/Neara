import { Router } from 'express';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { initPaymentSchema, uuidParamSchema } from '@neara/validation';
import { paymentService } from '../services/payment.service.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, notFound } from '../lib/errors.js';
import { appConfig } from '@neara/config';
import type { Request, Response } from 'express';

export const paymentRouter = Router();

// Preview breakdown (no gateway call) — lets customer see total cost before paying
paymentRouter.get('/breakdown/:propertyId', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const propertyId = pstr(req, 'propertyId');
    const { breakdown, feeCalculation } = await paymentService.buildBreakdown(propertyId);
    send(res, { breakdown, feeCalculation });
  } catch (err) {
    sendError(res, err);
  }
});

// Initialize payment
paymentRouter.post('/init', authenticate(), validate(initPaymentSchema), async (req: AuthedRequest, res) => {
  try {
    const { propertyId, applicationId, provider } = req.body as {
      propertyId: string;
      applicationId?: string;
      provider: 'paystack' | 'bank_transfer' | 'ussd' | 'other';
    };
    // Build + return the transparent breakdown first so the customer sees total cost
    const { breakdown, feeCalculation } = await paymentService.buildBreakdown(propertyId);
    const { payment, authorizationUrl } = await paymentService.init(
      req,
      propertyId,
      provider,
      applicationId,
    );
    send(res, { payment, breakdown, feeCalculation, authorizationUrl }, 201);
  } catch (err) {
    sendError(res, err);
  }
});

// Verify payment (server-side). Frontend calls this after gateway redirect.
paymentRouter.get('/verify/:reference', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const payment = await paymentService.verifyAndSettle(pstr(req, "reference"));
    send(res, payment, 200, 'Payment verified');
  } catch (err) {
    sendError(res, err);
  }
});

paymentRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    send(res, await paymentService.listForUser(req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
});

paymentRouter.get('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    send(res, await paymentService.getById(pstr(req, "id"), req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
});

// Webhook (no auth — verified by signature). Must receive raw body.
paymentRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-paystack-signature'] as string) ?? '';
    // Express raw body capture is configured in server.ts (verifyWebhook middleware)
    const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? '';
    const result = await paymentService.handleWebhook(rawBody, signature);
    send(res, result, 200);
  } catch (err) {
    sendError(res, err);
  }
});

// Public receipt endpoint (tokenized in production; MVP returns by id)
paymentRouter.get('/:id/receipt', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: pstr(req, "id") },
      include: { property: { select: { title: true, address: true, city: true, state: true } }, customer: { select: { displayName: true, email: true } } },
    });
    if (!payment) throw notFound('Payment not found');
    const breakdown = payment.breakdown as { items?: { label: string; amount: number }[]; total?: number };
    const date = payment.paidAt?.toLocaleDateString('en-NG') ?? '';
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>NEARA Receipt ${payment.reference}</title>
    <style>body{font-family:Inter,system-ui;max-width:680px;margin:40px auto;padding:24px;color:#1B2421}
    .brand{color:#006840;font-weight:700;font-size:24px} h1{color:#006840}
    table{width:100%;border-collapse:collapse;margin:16px 0} td,th{padding:10px;border-bottom:1px solid #DCE5E0;text-align:left}
    .total{font-weight:700;font-size:18px;color:#006840}</style></head>
    <body><div class="brand">NEARA</div><p>One tap from home.</p>
    <h1>Payment Receipt</h1>
    <p>Reference: <strong>${payment.reference}</strong></p>
    <p>Date: ${date}</p>
    <p>Tenant: ${payment.customer.displayName}</p>
    <p>Property: ${payment.property.title}, ${payment.property.address}, ${payment.property.city}</p>
    <table><tr><th>Item</th><th>Amount</th></tr>
    ${(breakdown.items ?? []).map((i) => `<tr><td>${i.label}</td><td>₦${i.amount.toLocaleString()}</td></tr>`).join('')}
    </table>
    <p class="total">Total: ₦${(breakdown.total ?? payment.amount).toLocaleString()}</p>
    <p>Status: ${payment.status}</p>
    <p style="color:#5A6B64;font-size:12px;margin-top:32px">This receipt was generated by NEARA. Verify at ${appConfig.api.url}/api/agreements</p>
    </body></html>`);
  } catch (err) {
    sendError(res, err);
  }
});

export { appConfig };
export { notFound, forbidden };
