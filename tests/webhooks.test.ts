import { describe, it, expect } from 'vitest';
import { PaymentFailoverRouter } from '../src/services/finance/paymentFailoverRouter';

describe('COEKA Multi-Gateway Webhook Verification', () => {
  it('correctly verifies valid Paystack HMAC-SHA512 webhook signature', async () => {
    const secretKey = 'sk_test_mock_paystack_secret_key';
    const rawBody = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'COEKA-1727170000',
        amount: 4500000,
        status: 'success',
      },
    });

    // Compute expected HMAC-SHA512 using Web Crypto
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const validSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = await PaymentFailoverRouter.verifyPaystackWebhook(rawBody, validSignature, secretKey);
    expect(isValid).toBe(true);

    const isFakeValid = await PaymentFailoverRouter.verifyPaystackWebhook(rawBody, 'invalid_signature_string', secretKey);
    expect(isFakeValid).toBe(false);
  });

  it('correctly verifies valid VPay HMAC-SHA256 webhook signature', async () => {
    const secretKey = 'vpay_api_secret_key';
    const rawBody = JSON.stringify({
      account_number: '9910840184',
      amount_kobo: 4500000,
      bank: 'Wema Bank',
    });

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const validSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = await PaymentFailoverRouter.verifyVPayWebhook(rawBody, validSignature, secretKey);
    expect(isValid).toBe(true);
  });
});
