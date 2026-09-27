import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Truck,
  Mail,
  Building,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  TranscriptRequestRecord,
  useTranscriptRequests,
  useUpdateTranscriptStatusMutation,
} from '../../hooks/useRegistrarData';

export function TranscriptQueue() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dispatchModalItem, setDispatchModalItem] = useState<TranscriptRequestRecord | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useTranscriptRequests(
    statusFilter === 'ALL' ? undefined : statusFilter
  );

  const updateMutation = useUpdateTranscriptStatusMutation();

  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.matricNumber && r.matricNumber.toLowerCase().includes(term)) ||
      (r.studentName && r.studentName.toLowerCase().includes(term)) ||
      r.recipientName.toLowerCase().includes(term) ||
      r.recipientAddress.toLowerCase().includes(term) ||
      (r.trackingNumber && r.trackingNumber.toLowerCase().includes(term))
    );
  });

  const handleStartProcessing = async (req: TranscriptRequestRecord) => {
    setActionFeedback(null);
    try {
      await updateMutation.mutateAsync({
        id: req.id,
        status: 'PROCESSING',
      });
      setActionFeedback(`Transcript request for ${req.studentName} is now in PROCESSING.`);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalItem) return;
    try {
      await updateMutation.mutateAsync({
        id: dispatchModalItem.id,
        status: 'SENT',
        trackingNumber: trackingNumber || undefined,
        dispatchNotes: dispatchNotes || undefined,
      });
      setActionFeedback(`Transcript dispatched to ${dispatchModalItem.recipientName}!`);
      setDispatchModalItem(null);
      setTrackingNumber('');
      setDispatchNotes('');
    } catch (err: any) {
      setActionFeedback(`Dispatch Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Registrar Transcript Operations
            </span>
            <span className="text-xs text-slate-400">• Official Academic Dossier Dispatch</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Transcript Fulfillment Queue</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage academic transcript requests from students and alumni. Move requests across the
            fulfillment pipeline from <strong>PAID</strong> &rarr; <strong>PROCESSING</strong> &rarr;{' '}
            <strong>SENT</strong> with courier tracking numbers and digital delivery notes.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          {(['ALL', 'PAID', 'PROCESSING', 'SENT', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === status
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-blue-500 hover:text-blue-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, matric number, recipient, destination, or tracking number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">Transcript Orders</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredRequests.length} requests
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Standard Processing SLA: 48 hours from payment confirmation
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading transcript requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No transcript requests found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Select another status filter or wait for student requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold text-slate-600">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Recipient / Destination</th>
                  <th className="py-3 px-3 text-center">Delivery Method</th>
                  <th className="py-3 px-3 text-center">Fee Paid</th>
                  <th className="py-3 px-3 text-center">Current Status</th>
                  <th className="py-3 px-4 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{req.studentName || 'Student'}</div>
                      <div className="font-mono text-[11px] text-slate-500">{req.matricNumber}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Requested: {new Date(req.requestedAt * 1000).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Recipient */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.recipientName}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5">
                        {req.recipientAddress}
                      </div>
                      {req.recipientEmail && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{req.recipientEmail}</span>
                        </div>
                      )}
                    </td>

                    {/* Delivery Method */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {req.deliveryMethod === 'COURIER' ? (
                          <Truck className="w-3 h-3 text-slate-500" />
                        ) : req.deliveryMethod === 'ELECTRONIC' ? (
                          <Mail className="w-3 h-3 text-slate-500" />
                        ) : (
                          <Building className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{req.deliveryMethod}</span>
                      </span>
                      {req.trackingNumber && (
                        <div className="font-mono text-[9px] text-blue-600 font-bold mt-1">
                          Track: {req.trackingNumber}
                        </div>
                      )}
                    </td>

                    {/* Fee */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-slate-900">
                        ₦{(req.feeAmountKobo / 100).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">PAID</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status === 'SENT' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {req.status === 'PROCESSING' && <Clock className="w-3 h-3 text-blue-600" />}
                        {req.status === 'PAID' && <Clock className="w-3 h-3 text-amber-600" />}
                        {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{req.status}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {req.status === 'PAID' && (
                        <button
                          onClick={() => handleStartProcessing(req)}
                          disabled={updateMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Start Processing</span>
                        </button>
                      )}

                      {req.status === 'PROCESSING' && (
                        <button
                          onClick={() => {
                            setDispatchModalItem(req);
                            setTrackingNumber('');
                            setDispatchNotes('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Dossier</span>
                        </button>
                      )}

                      {req.status === 'SENT' && (
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatched</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {dispatchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Dispatch Official Academic Transcript
                </h3>
                <p className="text-xs text-slate-500">
                  Recipient: {dispatchModalItem.recipientName} ({dispatchModalItem.deliveryMethod})
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Courier Tracking Number / Electronic Transmission ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHL-98421092 or NIPOST-BN-4401"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dispatch Notes & Seal Details
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sealed with official embossed Registrar Stamp. Sent via express dispatch."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                Notice: Dispatched transcripts cannot be revoked. This permanently marks the request as
                COMPLETED.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDispatchModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
