/**
 * Cryptographic Tamper-Evidence Service
 * Uses Web Crypto HMAC-SHA256 to ensure financial transactions and audit logs
 * cannot be altered in the database without immediate detection.
 */

export class SignatureService {
  /**
   * Helper to convert an ArrayBuffer to a hex string
   */
  private static bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate HMAC-SHA256 signature for a transaction payload
   */
  static async signTransaction(
    secret: string,
    params: {
      txId: string;
      invoiceId: string;
      amountKobo: number;
      reference: string;
      status: string;
    }
  ): Promise<string> {
    const rawPayload = `${params.txId}:${params.invoiceId}:${params.amountKobo}:${params.reference}:${params.status}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(rawPayload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return SignatureService.bufferToHex(signatureBuffer);
  }

  /**
   * Verify an existing transaction signature against its payload
   */
  static async verifyTransactionSignature(
    secret: string,
    params: {
      txId: string;
      invoiceId: string;
      amountKobo: number;
      reference: string;
      status: string;
    },
    expectedSignature: string
  ): Promise<boolean> {
    const computedSignature = await SignatureService.signTransaction(secret, params);
    return computedSignature.toLowerCase() === expectedSignature.toLowerCase();
  }

  /**
   * Generate SHA-256 hash for document / transcript verification
   */
  static async generateVerificationHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return SignatureService.bufferToHex(hashBuffer);
  }
}
