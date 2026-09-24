import { describe, it, expect } from 'vitest';
import { LedgerEngine } from '../src/services/finance/ledgerEngine';
import { SignatureService } from '../src/services/finance/signatureService';

describe('COEKA Financial Engine & Ledger Integrity', () => {
  it('strictly converts Naira to integer Kobo without precision loss', () => {
    expect(LedgerEngine.nairaToKobo(45000)).toBe(4500000);
    expect(LedgerEngine.nairaToKobo(1500.50)).toBe(150050);
    expect(LedgerEngine.nairaToKobo(0)).toBe(0);
  });

  it('formats integer Kobo to Nigerian Naira correctly', () => {
    const formatted = LedgerEngine.koboToNaira(4500000);
    expect(formatted).toContain('45,000.00');
  });

  it('throws an error if floating-point Kobo is provided to formatter', () => {
    expect(() => LedgerEngine.koboToNaira(45000.55 as any)).toThrow();
  });

  it('calculates VPay gateway charge with strict ₦2,000 cap', () => {
    // 1.5% of ₦45,000 (4,500,000 Kobo) is ₦675 (67,500 Kobo)
    const chargeSmall = LedgerEngine.calculateGatewayChargeKobo(4500000, 'VPAY');
    expect(chargeSmall).toBe(67500);

    // 1.5% of ₦200,000 (20,000,000 Kobo) is ₦3,000, but capped at ₦2,000 (200,000 Kobo)
    const chargeCapped = LedgerEngine.calculateGatewayChargeKobo(20000000, 'VPAY');
    expect(chargeCapped).toBe(200000); // exactly ₦2,000 cap
  });

  it('correctly reconciles invoice payments', () => {
    const invoiceDue = 4500000;
    const initialPaid = 0;
    const partialPayment = 2000000;

    const step1 = LedgerEngine.reconcileInvoicePayment(invoiceDue, initialPaid, partialPayment);
    expect(step1.newPaidKobo).toBe(2000000);
    expect(step1.remainingDueKobo).toBe(2500000);
    expect(step1.newStatus).toBe('PARTIALLY_PAID');

    const step2 = LedgerEngine.reconcileInvoicePayment(invoiceDue, step1.newPaidKobo, 2500000);
    expect(step2.newPaidKobo).toBe(4500000);
    expect(step2.remainingDueKobo).toBe(0);
    expect(step2.newStatus).toBe('PAID');
  });

  it('generates cryptographic HMAC-SHA256 signature and catches data tampering', async () => {
    const secret = 'coeka_production_secret_key_2026';
    const txData = {
      txId: 'tx-001',
      invoiceId: 'inv-001',
      amountKobo: 4500000,
      reference: 'REF-2026-COEKA',
      status: 'SUCCESS',
    };

    const signature = await SignatureService.signTransaction(secret, txData);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(64); // SHA-256 hex string is 64 chars

    // Valid verification
    const isValid = await SignatureService.verifyTransactionSignature(secret, txData, signature);
    expect(isValid).toBe(true);

    // Tampering test: amount changed in database
    const tamperedData = { ...txData, amountKobo: 1000000 };
    const isTamperedValid = await SignatureService.verifyTransactionSignature(secret, tamperedData, signature);
    expect(isTamperedValid).toBe(false);
  });
});
