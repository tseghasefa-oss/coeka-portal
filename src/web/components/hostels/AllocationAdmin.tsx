import React, { useState, useEffect } from 'react';
import {
  Users,
  Building,
  Search,
  RefreshCw,
  ArrowRightLeft,
  UserX,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { RoomOccupantsReport, HostelSummary } from '../../../services/hostels/hostelService';

export interface AllocationAdminProps {
  hostels: HostelSummary[];
  onRefreshHostels?: () => void;
}

export const AllocationAdmin: React.FC<AllocationAdminProps> = ({ hostels, onRefreshHostels }) => {
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('Room 101');
  const [selectedHostelId, setSelectedHostelId] = useState<string>(hostels[0]?.id || '');
  const [report, setReport] = useState<RoomOccupantsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Relocation Modal State
  const [isRelocating, setIsRelocating] = useState(false);
  const [relocateStudent, setRelocateStudent] = useState<{ studentId: string; name: string; matric: string } | null>(null);
  const [targetBedspaceId, setTargetBedspaceId] = useState('');
  const [relocateReason, setRelocateReason] = useState('');

  // Revocation State
  const [revokingAllocationId, setRevokingAllocationId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Sweeping State
  const [isSweeping, setIsSweeping] = useState(false);

  const fetchRoster = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const query = new URLSearchParams({
        roomNumber: selectedRoomNumber,
      });
      if (selectedHostelId) query.append('hostelId', selectedHostelId);

      const res = await fetch(`/api/hostels/warden/roster?${query.toString()}`);
      const data: any = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to fetch room roster.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Network error fetching room roster.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedRoomNumber, selectedHostelId]);

  const handleSweepExpiredLocks = async () => {
    setIsSweeping(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/hostels/cleanup-locks', { method: 'POST' });
      const data: any = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: `Sweep complete: ${data.expiredCount} expired locks cleared from database.`,
        });
        fetchRoster();
        onRefreshHostels?.();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to sweep expired locks.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSweeping(false);
    }
  };

  const handleConfirmRelocation = async () => {
    if (!relocateStudent || !targetBedspaceId) return;
    try {
      const res = await fetch('/api/hostels/warden/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: relocateStudent.studentId,
          targetBedspaceId,
          reason: relocateReason || 'Warden administrative relocation',
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: data.message || `Student successfully reassigned.`,
        });
        setIsRelocating(false);
        setRelocateStudent(null);
        setTargetBedspaceId('');
        setRelocateReason('');
        fetchRoster();
        onRefreshHostels?.();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Reassignment failed.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleConfirmRevocation = async (allocationId: string) => {
    if (!revokeReason) {
      alert('Please provide a reason for revoking this hostel allocation.');
      return;
    }
    try {
      const res = await fetch('/api/hostels/warden/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId,
          reason: revokeReason,
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: data.message || `Allocation successfully revoked. Bedspace is now free.`,
        });
        setRevokingAllocationId(null);
        setRevokeReason('');
        fetchRoster();
        onRefreshHostels?.();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Revocation failed.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Find all currently available bedspaces across all rooms in the selected hostel for relocation
  const availableBedsInHostel =
    hostels
      .find((h) => h.id === selectedHostelId)
      ?.rooms.flatMap((r) =>
        r.bedspaces
          .filter((b) => b.status === 'AVAILABLE')
          .map((b) => ({
            id: b.id,
            label: `${r.roomNumber} - ${b.bedLabel}`,
          }))
      ) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
              Hostel Warden Desk
            </span>
            <span className="text-xs text-slate-300">Live Concurrency & Clearance Center</span>
          </div>
          <h3 className="text-xl font-black mt-1">Hostel Room Rosters & Student Dossiers</h3>
        </div>

        <button
          onClick={handleSweepExpiredLocks}
          disabled={isSweeping}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Clock className="w-4 h-4" />
          <span>{isSweeping ? 'Sweeping...' : 'Sweep Expired Locks'}</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter / Room Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Hostel Picker */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Select Hall
            </label>
            <select
              value={selectedHostelId}
              onChange={(e) => setSelectedHostelId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.gender})
                </option>
              ))}
            </select>
          </div>

          {/* Room Number Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Room Number
            </label>
            <input
              type="text"
              value={selectedRoomNumber}
              onChange={(e) => setSelectedRoomNumber(e.target.value)}
              placeholder="e.g. Room 101 or 101"
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 min-w-[150px]"
            />
          </div>
        </div>

        <button
          onClick={fetchRoster}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{loading ? 'Searching...' : 'Inspect Room'}</span>
        </button>
      </div>

      {/* Room Roster Table */}
      {report && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Room Header Info */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-slate-900">
                  {report.hostelName} • {report.roomNumber}
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Floor {report.floorNumber}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  {report.gender}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Capacity: {report.capacity} Bedspaces ({report.occupiedCount} Occupied, {report.lockedCount} Locked,{' '}
                {report.availableCount} Available)
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Generated: {new Date(report.generatedAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Bed Occupant Dossiers */}
          <div className="divide-y divide-slate-100">
            {report.occupants.map((occ) => {
              const isOccupied = occ.isOccupied;
              const isLocked = occ.isLocked;

              return (
                <div key={occ.bedspaceId} className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Bed & Student Info */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-slate-900">{occ.bedLabel}</strong>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          isOccupied
                            ? 'bg-rose-100 text-rose-800'
                            : isLocked
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {occ.status}
                      </span>
                      {occ.paymentReference && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {occ.paymentReference}
                        </span>
                      )}
                    </div>

                    {isOccupied && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{occ.studentName}</span>
                          <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {occ.matricNumber}
                          </span>
                          <span className="text-xs text-slate-500">
                            • Level {occ.currentLevel} • {occ.programmeName}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          {occ.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{occ.phoneNumber}</span>
                            </span>
                          )}
                          {occ.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{occ.email}</span>
                            </span>
                          )}
                          {occ.contactAddress && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[200px]">{occ.contactAddress}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isLocked && (
                      <p className="text-xs text-amber-800 font-medium">
                        Reserving Student: {occ.studentName} ({occ.matricNumber}) —{' '}
                        {Math.floor((occ.remainingLockSeconds || 0) / 60)} minutes left before auto-release.
                      </p>
                    )}

                    {!isOccupied && !isLocked && (
                      <p className="text-xs text-slate-400 italic">Bedspace unoccupied and available for booking.</p>
                    )}
                  </div>

                  {/* Warden Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                    {isOccupied && (
                      <>
                        <button
                          onClick={() => {
                            setRelocateStudent({
                              studentId: occ.studentId!,
                              name: occ.studentName!,
                              matric: occ.matricNumber!,
                            });
                            setIsRelocating(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                          <span>Relocate</span>
                        </button>

                        <button
                          onClick={() => setRevokingAllocationId(occ.allocationId || null)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Relocation Modal */}
      {isRelocating && relocateStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <span>Relocate Student</span>
              </h4>
              <button
                onClick={() => setIsRelocating(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Transfer <strong className="text-slate-900">{relocateStudent.name}</strong> ({relocateStudent.matric}) to
              another available bedspace.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Free Bedspace</label>
              <select
                value={targetBedspaceId}
                onChange={(e) => setTargetBedspaceId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">-- Choose Target Bedspace --</option>
                {availableBedsInHostel.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Reassignment</label>
              <textarea
                value={relocateReason}
                onChange={(e) => setRelocateReason(e.target.value)}
                placeholder="e.g. Health grounds / room maintenance"
                className="w-full text-xs font-normal p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsRelocating(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRelocation}
                disabled={!targetBedspaceId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                Confirm Relocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Reason Prompt */}
      {revokingAllocationId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h4 className="text-base font-extrabold text-rose-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Revoke Hostel Space</span>
              </h4>
              <button
                onClick={() => setRevokingAllocationId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Revoking this allocation will immediately vacate the bedspace and return it to the available pool. Please state the official reason.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Revocation Reason</label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Student misconduct / disciplinary action / room abandonment"
                className="w-full text-xs font-normal p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 h-24"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRevokingAllocationId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmRevocation(revokingAllocationId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                Revoke Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
