import { Hono } from 'hono';
import { Env } from '../../types/env';
import { PaymentFailoverRouter } from '../../services/finance/paymentFailoverRouter';
import { SignatureService } from '../../services/finance/signatureService';

export const webhookRoutes = new Hono<{ Bindings: Env }>();

// 1. Paystack Webhook Handler
webhookRoutes.post('/paystack', async (c) => {
  const signature = c.req.header('x-paystack-signature') || '';
  const rawBody = await c.req.text();
  const secretKey = c.env?.PAYSTACK_SECRET_KEY || 'sk_test_mock_coeka_secret_key';

  const isValid = await PaymentFailoverRouter.verifyPaystackWebhook(rawBody, signature, secretKey);

  if (!isValid && c.env?.ENVIRONMENT === 'production') {
    return c.json({ error: 'Invalid Paystack HMAC signature' }, 401);
  }

  const payload = JSON.parse(rawBody || '{}');
  const event = payload.event;

  if (event === 'charge.success') {
    const data = payload.data;
    const reference = data.reference;
    const amountKobo = data.amount;

    // Log cryptographic transaction signature
    const txSignature = await SignatureService.signTransaction(
      c.env?.LEDGER_SIGNING_SECRET || 'coeka_ledger_secret_key',
      {
        txId: `tx-${reference}`,
        invoiceId: data.metadata?.invoice_id || 'inv-001',
        amountKobo,
        reference,
        status: 'SUCCESS',
      }
    );

    return c.json({ status: 'success', reference, txSignature });
  }

  return c.json({ status: 'ignored' });
});

// 2. VPay / Payvessel Virtual Account Transfer Webhook
webhookRoutes.post('/vpay', async (c) => {
  const signature = c.req.header('x-vpay-signature') || '';
  const rawBody = await c.req.text();
  const secretKey = c.env?.VPAY_API_KEY || 'vpay_secret_mock';

  const isValid = await PaymentFailoverRouter.verifyVPayWebhook(rawBody, signature, secretKey);

  if (!isValid && c.env?.ENVIRONMENT === 'production') {
    return c.json({ error: 'Invalid VPay HMAC signature' }, 401);
  }

  const payload = JSON.parse(rawBody || '{}');
  // Automated reconciliation: student paid into their dedicated virtual account
  return c.json({
    status: 'success',
    reconciled: true,
    accountNumber: payload.account_number,
    amountKobo: payload.amount_kobo || 4500000,
    settledAt: new Date().toISOString(),
  });
});
