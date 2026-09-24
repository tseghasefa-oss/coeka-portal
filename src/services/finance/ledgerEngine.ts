/**
 * COEKA Financial Engine: The Kobo Rule & Double-Entry Ledger
 * 
 * Strict Principle:
 * All monetary operations are performed strictly in 64-bit integer Kobo (₦1.00 = 100 Kobo).
 * Floating-point representation is forbidden for currency calculation to prevent IEEE 754 errors.
 */

export class LedgerEngine {
  /**
   * Convert Naira to Kobo strictly as an integer.
   * Uses Math.round to safely convert any decimal inputs before integer truncation.
   */
  static nairaToKobo(naira: number): number {
    if (isNaN(naira) || naira < 0) {
      throw new Error(`Invalid monetary amount: ${naira}`);
    }
    return Math.round(naira * 100);
  }

  /**
   * Format Kobo into a localized Nigerian Naira string (e.g., ₦45,000.00).
   */
  static koboToNaira(kobo: number): string {
    if (!Number.isInteger(kobo)) {
      throw new Error(`Kobo amount must be an integer, received: ${kobo}`);
    }
    const naira = kobo / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(naira);
  }

  /**
   * Calculate Payment Gateway Inbound Fee
   * VPay Web standard: 1.5% capped at ₦2,000 (200,000 Kobo).
   * Paystack standard: 1.5% + ₦100 (for > ₦2,500), capped at ₦2,000.
   */
  static calculateGatewayChargeKobo(
    amountKobo: number,
    gateway: 'VPAY' | 'PAYVESSEL' | 'PAYSTACK' | 'INTERSWITCH' | 'REMITA_BSCPP'
  ): number {
    if (amountKobo <= 0) return 0;

    switch (gateway) {
      case 'VPAY':
      case 'PAYVESSEL': {
        const fee = Math.round(amountKobo * 0.015);
        const maxCapKobo = 200000; // ₦2,000.00 max cap
        return Math.min(fee, maxCapKobo);
      }

      case 'PAYSTACK': {
        let fee = Math.round(amountKobo * 0.015);
        if (amountKobo >= 250000) {
          fee += 10000; // Flat ₦100 surcharge for transactions ₦2,500+
        }
        const maxCapKobo = 200000; // ₦2,000.00 max cap
        return Math.min(fee, maxCapKobo);
      }

      case 'REMITA_BSCPP': {
        // Standard Remita TSA statutory flat processing levy (₦150 - ₦300)
        return 25000; // ₦250.00 flat Remita fee
      }

      case 'INTERSWITCH': {
        const fee = Math.round(amountKobo * 0.015);
        const maxCapKobo = 200000;
        return Math.min(fee, maxCapKobo);
      }

      default:
        return 0;
    }
  }

  /**
   * Calculate Total Payable Amount with surcharge option
   */
  static calculateTotalPayableKobo(
    amountKobo: number,
    gateway: 'VPAY' | 'PAYVESSEL' | 'PAYSTACK' | 'INTERSWITCH' | 'REMITA_BSCPP',
    absorbCharge: boolean = false
  ): { feeAmountKobo: number; gatewayChargeKobo: number; totalPayableKobo: number } {
    const gatewayChargeKobo = LedgerEngine.calculateGatewayChargeKobo(amountKobo, gateway);
    const totalPayableKobo = absorbCharge ? amountKobo : amountKobo + gatewayChargeKobo;

    return {
      feeAmountKobo: amountKobo,
      gatewayChargeKobo,
      totalPayableKobo,
    };
  }

  /**
   * Apply payment to an existing invoice record
   */
  static reconcileInvoicePayment(
    currentDueKobo: number,
    currentPaidKobo: number,
    incomingCreditKobo: number
  ): {
    newPaidKobo: number;
    remainingDueKobo: number;
    newStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  } {
    if (incomingCreditKobo <= 0) {
      throw new Error(`Incoming credit must be positive: ${incomingCreditKobo}`);
    }

    const newPaidKobo = currentPaidKobo + incomingCreditKobo;
    const remainingDueKobo = Math.max(0, currentDueKobo - newPaidKobo);

    let newStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID';
    if (newPaidKobo >= currentDueKobo) {
      newStatus = 'PAID';
    } else if (newPaidKobo === 0) {
      newStatus = 'UNPAID';
    }

    return {
      newPaidKobo,
      remainingDueKobo,
      newStatus,
    };
  }
}
