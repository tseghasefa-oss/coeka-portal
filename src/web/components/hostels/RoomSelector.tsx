import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  Clock,
  Lock,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { HostelSummary, HostelRoom, Bedspace } from '../../../services/hostels/hostelService';

export interface RoomSelectorProps {
  hostels: HostelSummary[];
  selectedBedspaceId?: string;
  isReserving?: boolean;
  onReserveBed: (bedspaceId: string) => Promise<void>;
  onRefresh?: () => void;
  studentGender?: string;
  activeLockBedspaceId?: string;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  hostels,
  selectedBedspaceId,
  isReserving,
  onReserveBed,
  onRefresh,
  studentGender,
  activeLockBedspaceId,
}) => {
  const [selectedHostelId, setSelectedHostelId] = useState<string>(() => {
    if (studentGender) {
      const match = hostels.find(
        (h) => h.gender.toUpperCase() === (studentGender.toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE')
      );
      if (match) return match.id;
    }
    return hostels[0]?.id || '';
  });

  const activeHostel = hostels.find((h) => h.id === selectedHostelId) || hostels[0];

  return (
    <div className="space-y-6">
      {/* Hostel Selection Pills & Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Hostel Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {hostels.map((h) => {
            const isSelected = h.id === activeHostel?.id;
            const isFemale = h.gender === 'FEMALE';
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHostelId(h.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Building className={`w-3.5 h-3.5 ${isFemale ? 'text-pink-400' : 'text-blue-400'}`} />
                <span>{h.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {h.availableCount} Available
                </span>
              </button>
            );
          })}
        </div>

        {/* Refresh & Legend */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
              title="Refresh Room Occupancy"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse" />
              <span>Locked (15m)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Occupied</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hostel Banner Overview */}
      {activeHostel && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                {activeHostel.gender} Hall of Residence
              </span>
              <span className="text-xs text-slate-300">
                Total Capacity: {activeHostel.totalCapacity} Students
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight">{activeHostel.name}</h3>
          </div>

          <div className="flex items-center gap-4 text-center shrink-0">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase block font-semibold">Occupied</span>
              <strong className="text-sm font-bold text-rose-300">{activeHostel.occupiedCount}</strong>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase block font-semibold">Under Lock</span>
              <strong className="text-sm font-bold text-amber-300">{activeHostel.lockedCount}</strong>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase block font-semibold">Free Beds</span>
              <strong className="text-sm font-bold text-emerald-300">{activeHostel.availableCount}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeHostel?.rooms?.map((room: HostelRoom) => {
          return (
            <div
              key={room.roomId}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-slate-300 transition"
            >
              {/* Room Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-base font-extrabold text-slate-900">{room.roomNumber}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Floor {room.floorNumber}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Standard 4-Man Room • ₦{(room.priceKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Available</span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      room.availableBedspaces > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {room.availableBedspaces} / {room.capacity}
                  </span>
                </div>
              </div>

              {/* Bedspaces Visual Map */}
              <div className="grid grid-cols-2 gap-3">
                {room.bedspaces.map((bed: Bedspace) => {
                  const isLocked = bed.status === 'LOCKED';
                  const isOccupied = bed.status === 'OCCUPIED';
                  const isAvailable = bed.status === 'AVAILABLE';
                  const isMyLock = activeLockBedspaceId === bed.id;

                  let borderClass = 'border-slate-200 bg-slate-50';
                  let statusBadgeClass = 'bg-slate-200 text-slate-700';

                  if (isOccupied) {
                    borderClass = 'border-rose-200 bg-rose-50/50 opacity-75';
                    statusBadgeClass = 'bg-rose-100 text-rose-800';
                  } else if (isLocked) {
                    borderClass = 'border-amber-300 bg-amber-50/70';
                    statusBadgeClass = 'bg-amber-100 text-amber-900';
                  } else if (isAvailable) {
                    borderClass = 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-500 hover:shadow-sm';
                    statusBadgeClass = 'bg-emerald-100 text-emerald-800';
                  }

                  return (
                    <div
                      key={bed.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition ${borderClass}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">{bed.bedLabel}</strong>
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${statusBadgeClass}`}>
                            {isMyLock ? 'YOUR LOCK' : bed.status}
                          </span>
                        </div>
                        {isOccupied && <Lock className="w-3.5 h-3.5 text-rose-500" />}
                        {isLocked && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                        {isAvailable && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>

                      {/* Remaining Lock Timer or Occupant note */}
                      {isLocked && bed.remainingLockSeconds !== undefined && bed.remainingLockSeconds > 0 && (
                        <div className="text-[10px] text-amber-800 font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>
                            {Math.floor(bed.remainingLockSeconds / 60)}m {bed.remainingLockSeconds % 60}s left
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      {isAvailable && (
                        <button
                          onClick={() => onReserveBed(bed.id)}
                          disabled={isReserving}
                          className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                        >
                          {isReserving && selectedBedspaceId === bed.id ? 'Reserving...' : 'Reserve (15m)'}
                        </button>
                      )}

                      {isLocked && !isMyLock && (
                        <span className="text-[10px] text-slate-400 font-medium text-center py-1">
                          Held for Payment
                        </span>
                      )}

                      {isMyLock && (
                        <span className="text-[10px] text-amber-800 font-bold text-center py-1 bg-amber-200/60 rounded">
                          Pay Above ⬆
                        </span>
                      )}

                      {isOccupied && (
                        <span className="text-[10px] text-rose-500 font-medium text-center py-1">
                          Occupied
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
