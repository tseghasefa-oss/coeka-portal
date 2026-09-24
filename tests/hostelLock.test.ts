import { describe, it, expect } from 'vitest';
import { HostelAllocationEngine, BedspaceReservationState } from '../src/services/hostels/allocationEngine';

describe('COEKA Hostel 15-Minute Reservation Lock', () => {
  it('allows reservation when bedspace is free and not locked', () => {
    const bed: BedspaceReservationState = {
      bedspaceId: 'bed-01',
      isOccupied: false,
      reservedUntil: null,
    };
    const now = 10000;

    const result = HostelAllocationEngine.acquireReservationLock(bed, now);
    expect(result.success).toBe(true);
    expect(result.newReservedUntil).toBe(now + 900); // exactly 15 minutes later
  });

  it('rejects reservation when bedspace is already occupied', () => {
    const bed: BedspaceReservationState = {
      bedspaceId: 'bed-02',
      isOccupied: true,
      reservedUntil: null,
    };
    const now = 10000;

    const result = HostelAllocationEngine.acquireReservationLock(bed, now);
    expect(result.success).toBe(false);
  });

  it('rejects concurrent reservation if active lock is held, but permits after expiration', () => {
    const lockExpiry = 10500;
    const bed: BedspaceReservationState = {
      bedspaceId: 'bed-03',
      isOccupied: false,
      reservedUntil: lockExpiry,
    };

    // Attempt before lock expiry (10200 < 10500)
    const concurrentAttempt = HostelAllocationEngine.acquireReservationLock(bed, 10200);
    expect(concurrentAttempt.success).toBe(false);

    // Attempt after lock expired (10501 > 10500)
    const afterExpiryAttempt = HostelAllocationEngine.acquireReservationLock(bed, 10501);
    expect(afterExpiryAttempt.success).toBe(true);
    expect(afterExpiryAttempt.newReservedUntil).toBe(10501 + 900);
  });
});
