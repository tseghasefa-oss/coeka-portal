import { Hono } from 'hono';
import { Env } from '../../types/env';
import { HostelAllocationEngine, BedspaceReservationState } from '../../services/hostels/allocationEngine';
import { getContainer } from '../../infrastructure/container';

export const hostelRoutes = new Hono<{ Bindings: Env }>();

// In-memory reservation tracker for active demonstration
const bedspacesDb: Record<string, BedspaceReservationState> = {
  'bed-a101-1': { bedspaceId: 'bed-a101-1', isOccupied: false, reservedUntil: null },
  'bed-a101-2': { bedspaceId: 'bed-a101-2', isOccupied: false, reservedUntil: null },
  'bed-a101-3': { bedspaceId: 'bed-a101-3', isOccupied: true, reservedUntil: null },
  'bed-a101-4': { bedspaceId: 'bed-a101-4', isOccupied: false, reservedUntil: null },
};

hostelRoutes.get('/rooms', async (c) => {
  const container = getContainer(c.env);
  const now = Math.floor(Date.now() / 1000);

  // Sync with cache provider if available
  for (const bed of Object.values(bedspacesDb)) {
    const cachedLock = await container.cache.get<number>(`bedlock:${bed.bedspaceId}`);
    if (cachedLock && cachedLock > now) {
      bed.reservedUntil = cachedLock;
    } else if (bed.reservedUntil && bed.reservedUntil <= now) {
      bed.reservedUntil = null;
    }
  }

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
  const container = getContainer(c.env);
  const body = await c.req.json();
  const { bedspaceId } = body;
  const now = Math.floor(Date.now() / 1000);

  const bed = bedspacesDb[bedspaceId];
  if (!bed) {
    return c.json({ error: 'Bedspace not found' }, 404);
  }

  // Check cache lock
  const cachedLock = await container.cache.get<number>(`bedlock:${bedspaceId}`);
  if (cachedLock && cachedLock > now) {
    bed.reservedUntil = cachedLock;
  }

  const result = HostelAllocationEngine.acquireReservationLock(bed, now);

  if (!result.success) {
    return c.json({ error: result.message }, 409);
  }

  bed.reservedUntil = result.newReservedUntil;
  if (result.newReservedUntil) {
    await container.cache.set(`bedlock:${bedspaceId}`, result.newReservedUntil, 900);
  }

  return c.json({
    message: result.message,
    bedspaceId,
    reservedUntil: result.newReservedUntil,
    lockDurationSeconds: 900,
  });
});

