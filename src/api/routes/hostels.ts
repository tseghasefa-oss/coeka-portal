import { Hono } from 'hono';
import { Env } from '../../types/env';
import { HostelAllocationEngine, BedspaceReservationState } from '../../services/hostels/allocationEngine';

export const hostelRoutes = new Hono<{ Bindings: Env }>();

// In-memory reservation tracker for active demonstration
const bedspacesDb: Record<string, BedspaceReservationState> = {
  'bed-a101-1': { bedspaceId: 'bed-a101-1', isOccupied: false, reservedUntil: null },
  'bed-a101-2': { bedspaceId: 'bed-a101-2', isOccupied: false, reservedUntil: null },
  'bed-a101-3': { bedspaceId: 'bed-a101-3', isOccupied: true, reservedUntil: null },
  'bed-a101-4': { bedspaceId: 'bed-a101-4', isOccupied: false, reservedUntil: null },
};

hostelRoutes.get('/rooms', async (c) => {
  const now = Math.floor(Date.now() / 1000);

  const rooms = [
    {
      roomId: 'room-a-101',
      hostelName: 'Hall A (Queen Amina Hall - Female)',
      gender: 'FEMALE',
      roomNumber: 'Room 101 (Ground Floor)',
      capacity: 4,
      feeKobo: 2000000, // ₦20,000.00
      bedspaces: Object.values(bedspacesDb).map(b => ({
        id: b.bedspaceId,
        isOccupied: b.isOccupied,
        isReserved: b.reservedUntil !== null && b.reservedUntil > now,
        isAvailable: HostelAllocationEngine.isBedspaceAvailable(b, now),
        remainingLockSeconds: b.reservedUntil && b.reservedUntil > now ? b.reservedUntil - now : 0,
      })),
    },
  ];

  return c.json({ rooms });
});

hostelRoutes.post('/reserve', async (c) => {
  const body = await c.req.json();
  const { bedspaceId } = body;
  const now = Math.floor(Date.now() / 1000);

  const bed = bedspacesDb[bedspaceId];
  if (!bed) {
    return c.json({ error: 'Bedspace not found' }, 404);
  }

  const result = HostelAllocationEngine.acquireReservationLock(bed, now);

  if (!result.success) {
    return c.json({ error: result.message }, 409);
  }

  bed.reservedUntil = result.newReservedUntil;

  return c.json({
    message: result.message,
    bedspaceId,
    reservedUntil: result.newReservedUntil,
    lockDurationSeconds: 900,
  });
});
