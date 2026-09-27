import React, { useState, useEffect } from 'react';
import {
  Building,
  Shield,
  Clock,
  CheckCircle2,
  Users,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { RoomSelector } from './RoomSelector';
import { ReservationTimer } from './ReservationTimer';
import { AllocationAdmin } from './AllocationAdmin';
import { HostelSummary } from '../../../services/hostels/hostelService';
import { useAppStore } from '../../stores/useAppStore';

export const HostelPortal: React.FC = () => {
  const { userSession } = useAppStore();
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'student' | 'warden'>('student');

  // Student State
  const [studentStatus, setStudentStatus] = useState<any>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isStaffOrAdmin =
    userSession?.role === 'SUPER_ADMIN' ||
    userSession?.role === 'ADMIN' ||
    userSession?.role === 'BURSARY' ||
    userSession?.role === 'STAFF' ||
    (userSession?.role as string) === 'WARDEN';

  const fetchHostelData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hostels/overview');
      const data: any = await res.json();
      if (data.success && data.hostels) {
        setHostels(data.hostels);
      }
    } catch (err: any) {
      console.error('Failed to load hostel overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStatus = async () => {
    try {
      const res = await fetch('/api/hostels/student-status');
      const data: any = await res.json();
      if (data.success) {
        setStudentStatus(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch student status:', err);
    }
  };

  useEffect(() => {
    fetchHostelData();
    fetchStudentStatus();
  }, []);

  const handleReserveBed = async (bedspaceId: string) => {
    setIsReserving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/hostels/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedspaceId,
          studentId: studentStatus?.student?.id,
        }),
      });
      const data: any = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: data.message || 'Bedspace lock acquired! You have 15 minutes to pay.',
        });
        await fetchHostelData();
        await fetchStudentStatus();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to reserve bedspace.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error during reservation.' });
    } finally {
      setIsReserving(false);
    }
  };

  const handleConfirmPayment = async (paymentRef: string) => {
    if (!studentStatus?.lock?.bedspaceId) return;
    const res = await fetch('/api/hostels/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bedspaceId: studentStatus.lock.bedspaceId,
        studentId: studentStatus.student.id,
        paymentReference: paymentRef,
      }),
    });
    const data: any = await res.json();
    if (data.success) {
      setStatusMessage({
        type: 'success',
        text: data.message || 'Hostel bed allocated permanently!',
      });
      await fetchHostelData();
      await fetchStudentStatus();
    } else {
      throw new Error(data.error || 'Failed to confirm bed allocation');
    }
  };

  const handleCancelReservation = async () => {
    await fetch('/api/hostels/cleanup-locks', { method: 'POST' });
    await fetchHostelData();
    await fetchStudentStatus();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              High-Concurrency Allocation Engine
            </span>
            <span className="text-xs text-slate-500">Atomic 15-Minute Locks • Zero Double Booking</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">COEKA Hostel Accommodation Hub</h2>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Bed Selection
          </button>
          {isStaffOrAdmin && (
            <button
              onClick={() => setActiveSubTab('warden')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'warden' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Warden Desk</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SUBTAB 1: Student Reservation View */}
      {activeSubTab === 'student' && (
        <div className="space-y-6">
          {/* Active Permanent Allocation Banner */}
          {studentStatus?.hasActiveAllocation && studentStatus.allocation && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-700">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Hostel Allocation Confirmed
                  </span>
                </div>
                <h3 className="text-xl font-black">
                  {studentStatus.allocation.hostelName} • {studentStatus.allocation.roomNumber} (
                  {studentStatus.allocation.bedLabel})
                </h3>
                <p className="text-xs text-emerald-200">
                  Allocated to {studentStatus.student.name} ({studentStatus.student.matricNumber}) • Payment Ref:{' '}
                  {studentStatus.allocation.paymentReference}
                </p>
              </div>

              <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/20">
                <span className="text-[10px] text-emerald-300 uppercase block font-bold">Status</span>
                <span className="text-xs font-extrabold text-white">ACTIVE OCCUPANT</span>
              </div>
            </div>
          )}

          {/* Active 15-Minute Reservation Timer */}
          {studentStatus?.hasActiveLock && studentStatus.lock && (
            <ReservationTimer
              bedLabel={studentStatus.lock.bedLabel}
              roomNumber={studentStatus.lock.roomNumber}
              hostelName={studentStatus.lock.hostelName}
              expiresAt={studentStatus.lock.expiresAt}
              feeKobo={studentStatus.lock.feeKobo}
              onConfirmPayment={handleConfirmPayment}
              onCancelReservation={handleCancelReservation}
            />
          )}

          {/* Room Selector Interactive Map */}
          <RoomSelector
            hostels={hostels}
            isReserving={isReserving}
            onReserveBed={handleReserveBed}
            onRefresh={() => {
              fetchHostelData();
              fetchStudentStatus();
            }}
            studentGender={studentStatus?.student?.gender}
            activeLockBedspaceId={studentStatus?.lock?.bedspaceId}
          />
        </div>
      )}

      {/* SUBTAB 2: Warden Desk */}
      {activeSubTab === 'warden' && (
        <AllocationAdmin
          hostels={hostels}
          onRefreshHostels={() => {
            fetchHostelData();
            fetchStudentStatus();
          }}
        />
      )}
    </div>
  );
};
