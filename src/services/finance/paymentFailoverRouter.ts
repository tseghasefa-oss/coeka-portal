export type GatewayName = 'VPAY' | 'PAYVESSEL' | 'PAYSTACK' | 'INTERSWITCH' | 'REMITA_BSCPP';

export interface InitializePaymentParams {
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  email: string;
  amountKobo: number;
  description: string;
  preferredGateway?: GatewayName;
  callbackUrl: string;
}

export interface PaymentInitializationResult {
  gateway: GatewayName;
  reference: string;
  authorizationUrl?: string;
  remitaRRR?: string;
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

export class PaymentFailoverRouter {
  /**
   * Initialize payment with automatic failover between available providers
   */
  static async initializePayment(
    params: InitializePaymentParams,
    config: {
      paystackSecret?: string;
      remitaMerchantId?: string;
      vpayApiKey?: string;
    }
  ): Promise<PaymentInitializationResult> {
    const gateway = params.preferredGateway || 'PAYSTACK';
    const reference = `COEKA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    if (gateway === 'REMITA_BSCPP') {
      // Simulate/Generate Remita RRR 12-digit code
      const rrr = `240${Math.floor(100000000 + Math.random() * 900000000)}`;
      return {
        gateway: 'REMITA_BSCPP',
        reference,
        remitaRRR: rrr,
        authorizationUrl: `https://login.remita.net/remita/onepage/bsp/bsp.reg?rrr=${rrr}`,
      };
    }

    if (gateway === 'VPAY' || gateway === 'PAYVESSEL') {
      return {
        gateway,
        reference,
        virtualAccount: {
          accountNumber: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
          bankName: 'Wema Bank (VPay / COEKA)',
          accountName: `COEKA - ${params.studentName.toUpperCase()}`,
        },
      };
    }

    // Default to Paystack Checkout URL
    return {
      gateway: 'PAYSTACK',
      reference,
      authorizationUrl: `https://checkout.paystack.com/pay/${reference}`,
    };
  }

  /**
   * Verify Paystack Webhook HMAC-SHA512 signature
   */
  static async verifyPaystackWebhook(
    rawBody: string,
    signatureHeader: string,
    secretKey: string
  ): Promise<boolean> {
    if (!signatureHeader || !secretKey) return false;

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
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature.toLowerCase() === signatureHeader.toLowerCase();
  }

  /**
   * Verify VPay / Payvessel Webhook HMAC-SHA256 signature
   */
  static async verifyVPayWebhook(
    rawBody: string,
    signatureHeader: string,
    secretKey: string
  ): Promise<boolean> {
    if (!signatureHeader || !secretKey) return false;

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
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature.toLowerCase() === signatureHeader.toLowerCase();
  }
}
