import React, { useState } from 'react';
import {
  CreditCard,
  ShoppingCart,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Building,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { WardSummary, MultiChildPaymentItem, useMultiChildPay } from '../../hooks/useParentData';

interface UnifiedPaymentPortalProps {
  wards: WardSummary[];
}

export const UnifiedPaymentPortal: React.FC<UnifiedPaymentPortalProps> = ({ wards }) => {
  const multiChildPayMutation = useMultiChildPay();

  // Multi-item Cart Selection State
  // Default all unpaid wards into the cart
  const initialSelectedItems: MultiChildPaymentItem[] = [
    {
      childId: 'std-001',
      childName: 'Aondoaver Moses Iorliam',
      invoiceId: 'inv-001',
      feeTitle: '2026/2027 NCE Tuition & Consolidated Institutional Fees',
      amountKobo: 4500000, // ₦45,000.00
    },
  ];

  const [cartItems, setCartItems] = useState<MultiChildPaymentItem[]>(initialSelectedItems);
  const [selectedGateway, setSelectedGateway] = useState<'VPAY' | 'PAYSTACK' | 'REMITA_BSCPP'>('VPAY');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);

  // Available fee items across all monitored wards
  const allAvailableFeeItems: MultiChildPaymentItem[] = [
    {
      childId: 'std-001',
      childName: 'Aondoaver Moses (NCE 100L)',
      invoiceId: 'inv-001',
      feeTitle: '2026/2027 NCE Tuition & Consolidated Institutional Fees',
      amountKobo: 4500000, // ₦45,000
    },
    {
      childId: 'std-001',
      childName: 'Aondoaver Moses (NCE 100L)',
      invoiceId: 'inv-002',
      feeTitle: 'Hostel Accommodation (Hall A - Female Bedspace)',
      amountKobo: 2000000, // ₦20,000
    },
    {
      childId: 'std-002',
      childName: 'Ngodoo Blessing (SS2 Science)',
      invoiceId: 'inv-dss-002',
      feeTitle: 'Demonstration Secondary Second Term Advance Tuition',
      amountKobo: 2500000, // ₦25,000
    },
    {
      childId: 'std-003',
      childName: 'Terhide Kelvin (Basic 4)',
      invoiceId: 'inv-sps-002',
      feeTitle: 'Staff Primary School Second Term Advance Tuition',
      amountKobo: 1800000, // ₦18,000
    },
  ];

  const handleToggleItem = (item: MultiChildPaymentItem) => {
    const exists = cartItems.some((i) => i.invoiceId === item.invoiceId);
    if (exists) {
      setCartItems(cartItems.filter((i) => i.invoiceId !== item.invoiceId));
    } else {
      setCartItems([...cartItems, item]);
    }
  };

  const handleSelectAll = () => {
    if (cartItems.length === allAvailableFeeItems.length) {
      setCartItems([]);
    } else {
      setCartItems([...allAvailableFeeItems]);
    }
  };

  const totalBaseKobo = cartItems.reduce((sum, item) => sum + item.amountKobo, 0);

  // Compute Gateway Surcharge
  let gatewayChargeKobo = 0;
  if (selectedGateway === 'PAYSTACK') {
    gatewayChargeKobo = totalBaseKobo > 250000 ? Math.round(totalBaseKobo * 0.015) + 10000 : Math.round(totalBaseKobo * 0.015);
  } else if (selectedGateway === 'REMITA_BSCPP') {
    gatewayChargeKobo = 16125; // ₦161.25 standard TSA/BSCPP fee
  } else {
    // VPay
    gatewayChargeKobo = 10000; // Flat ₦100 collection fee
  }

  const grandTotalKobo = totalBaseKobo + gatewayChargeKobo;

  const formatKobo = (kobo: number) => {
    return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExecutePayment = () => {
    if (cartItems.length === 0) return;

    multiChildPayMutation.mutate(
      {
        items: cartItems,
        gateway: selectedGateway,
      },
      {
        onSuccess: (data) => {
          setPaymentResponse(data.payment);
        },
      }
    );
  };

  const handleCopy = (acc: string) => {
    navigator.clipboard?.writeText(acc);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* VPay Dedicated Parent Multi-Ward Bank Account Banner */}
      <div className="bento-card p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-800">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
              VPay Family Dynamic NUBAN
            </span>
            <span className="text-xs text-emerald-200">Consolidated Guardian Clearing Rail</span>
          </div>
          <h3 className="text-xl font-bold">Consolidated Multi-Child Fee Payment</h3>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Select fees for one or multiple children across Tertiary, Secondary, and Primary divisions. Pay them together in a single transaction with automated instant reconciliation into respective student ledgers.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center w-full md:w-auto shrink-0 space-y-1.5">
          <span className="text-xs text-amber-300 font-semibold block">
            Wema Bank (COEKA Family Rail)
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-black tracking-wider text-white">
              9910840180
            </span>
            <button
              onClick={() => handleCopy('9910840180')}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition cursor-pointer"
              title="Copy Account Number"
            >
              {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-emerald-200 block font-mono">
            COEKA - JOSHUA TSEGHA (FAMILY)
          </span>
        </div>
      </div>

      {/* Payment Successful Result Card */}
      {paymentResponse && (
        <div className="bento-card p-6 bg-emerald-50 border-2 border-emerald-500 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            <div>
              <h4 className="text-base font-bold text-emerald-950">
                Consolidated Checkout Session Initialized!
              </h4>
              <p className="text-xs text-emerald-800">
                Transaction Reference: <span className="font-mono font-bold">{paymentResponse.reference}</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Total Amount Settled</span>
              <strong className="text-xl font-black text-emerald-700 block">
                {paymentResponse.formattedTotalPayable || formatKobo(grandTotalKobo)}
              </strong>
              <span className="text-[10px] text-slate-400">
                {cartItems.length} fee items across {new Set(cartItems.map((i) => i.childId)).size} wards
              </span>
            </div>

            {paymentResponse.paymentUrl && (
              <a
                href={paymentResponse.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <span>Proceed to {selectedGateway} Gateway</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Multi-Child Fee Cart & Gateway Selection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fee Selection Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Select Wards & Invoices for Consolidated Checkout
                </h4>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer"
              >
                {cartItems.length === allAvailableFeeItems.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* List of Fee Items */}
            <div className="space-y-2.5">
              {allAvailableFeeItems.map((item) => {
                const isChecked = cartItems.some((i) => i.invoiceId === item.invoiceId);

                return (
                  <label
                    key={item.invoiceId}
                    id={`cart-item-${item.invoiceId}`}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItem(item)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          {item.childName}
                        </strong>
                        <span className="text-[11px] text-slate-600 block">
                          {item.feeTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Invoice: {item.invoiceId}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <strong className="text-sm font-bold text-slate-900 block">
                        {formatKobo(item.amountKobo)}
                      </strong>
                      <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Active Due
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Payment Gateway Provider Selector */}
          <div className="bento-card p-6 bg-white border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Payment Processing Gateway
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'VPAY', name: 'VPay Auto-Transfer', fee: '₦100 Flat', desc: 'Direct Dynamic NUBAN' },
                { id: 'PAYSTACK', name: 'Paystack Checkout', fee: '1.5% Surcharge', desc: 'Cards, USSD, Transfer' },
                { id: 'REMITA_BSCPP', name: 'Remita (TSA/BSCPP)', fee: '₦161.25 Flat', desc: 'Govt e-Collection' },
              ].map((gw) => (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setSelectedGateway(gw.id as any)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                    selectedGateway === gw.id
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <strong className="text-xs font-bold text-slate-900 block">{gw.name}</strong>
                  <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">{gw.fee}</span>
                  <span className="text-[10px] text-slate-400 block">{gw.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Cart Checkout Summary Card */}
        <div className="space-y-4">
          <div className="bento-card p-6 bg-white border border-slate-200 space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Cart Summary</h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {/* Itemized List */}
            <div className="space-y-2 text-xs">
              {cartItems.map((item) => (
                <div key={item.invoiceId} className="flex justify-between text-slate-600">
                  <span className="truncate max-w-[170px]" title={item.feeTitle}>
                    {item.childName.split(' ')[0]}: {item.feeTitle}
                  </span>
                  <span className="font-mono font-bold text-slate-800 shrink-0">
                    {formatKobo(item.amountKobo)}
                  </span>
                </div>
              ))}
              {cartItems.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-2">
                  No items selected in cart.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Base Fees)</span>
                <span className="font-mono font-semibold">{formatKobo(totalBaseKobo)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Gateway Processing Charge</span>
                <span className="font-mono font-semibold">{formatKobo(gatewayChargeKobo)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable</span>
                <span className="font-mono text-emerald-800">{formatKobo(grandTotalKobo)}</span>
              </div>
            </div>

            <button
              id="btn-checkout-multi-child"
              disabled={cartItems.length === 0 || multiChildPayMutation.isPending}
              onClick={handleExecutePayment}
              className={`w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow flex items-center justify-center gap-2 ${
                cartItems.length === 0 || multiChildPayMutation.isPending
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
              }`}
            >
              {multiChildPayMutation.isPending ? (
                <span>Generating Checkout Token...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay {formatKobo(grandTotalKobo)} Now</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted & Reconciled Directly to Bursary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
