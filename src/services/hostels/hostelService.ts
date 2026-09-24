import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { ICacheProvider } from '../../infrastructure/interfaces/ICacheProvider';
import { HostelAllocationEngine, BedspaceReservationState } from './allocationEngine';

export interface Bedspace {
  id: string;
  name: string;
  isOccupied: boolean;
  reservedUntil: number | null;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
}

export interface HostelRoom {
  roomId: string;
  roomNumber: string;
  hallName: string;
  gender: 'M' | 'F';
  capacity: number;
  availableBedspaces: number;
  bedspaces: Bedspace[];
}

export class HostelService {
  constructor(
    private db: IDatabaseProvider,
    private cache: ICacheProvider
  ) {}

  async getRooms(): Promise<HostelRoom[]> {
    const now = Math.floor(Date.now() / 1000);

    // Initial mock room layout
    const rooms: HostelRoom[] = [
      {
        roomId: 'rm-101',
        roomNumber: 'Room 101',
        hallName: 'Hall A (Female)',
        gender: 'F',
        capacity: 4,
        availableBedspaces: 1,
        bedspaces: [
          { id: 'b-101-1', name: 'Bed 1 (Lower)', isOccupied: true, reservedUntil: null, status: 'OCCUPIED' },
          { id: 'b-101-2', name: 'Bed 2 (Upper)', isOccupied: true, reservedUntil: null, status: 'OCCUPIED' },
          { id: 'b-101-3', name: 'Bed 3 (Lower)', isOccupied: false, reservedUntil: null, status: 'AVAILABLE' },
          { id: 'b-101-4', name: 'Bed 4 (Upper)', isOccupied: true, reservedUntil: null, status: 'OCCUPIED' },
        ],
      },
      {
        roomId: 'rm-201',
        roomNumber: 'Room 201',
        hallName: 'Hall B (Male)',
        gender: 'M',
        capacity: 4,
        availableBedspaces: 3,
        bedspaces: [
          { id: 'b-201-1', name: 'Bed 1 (Lower)', isOccupied: true, reservedUntil: null, status: 'OCCUPIED' },
          { id: 'b-201-2', name: 'Bed 2 (Upper)', isOccupied: false, reservedUntil: null, status: 'AVAILABLE' },
          { id: 'b-201-3', name: 'Bed 3 (Lower)', isOccupied: false, reservedUntil: null, status: 'AVAILABLE' },
          { id: 'b-201-4', name: 'Bed 4 (Upper)', isOccupied: false, reservedUntil: null, status: 'AVAILABLE' },
        ],
      },
    ];

    // Check dynamic reservation cache for bed locks
    for (const room of rooms) {
      for (const bed of room.bedspaces) {
        if (!bed.isOccupied) {
          const lockTime = await this.cache.get<number>(`bedlock:${bed.id}`);
          if (lockTime && lockTime > now) {
            bed.reservedUntil = lockTime;
            bed.status = 'RESERVED';
          }
        }
      }
      room.availableBedspaces = room.bedspaces.filter(b => b.status === 'AVAILABLE').length;
    }

    return rooms;
  }

  async reserveBedspace(bedspaceId: string, studentId: string): Promise<{
    success: boolean;
    message: string;
    reservedUntil?: number;
    bedspaceId: string;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const existingLock = await this.cache.get<number>(`bedlock:${bedspaceId}`);

    const bedState: BedspaceReservationState = {
      bedspaceId,
      isOccupied: false,
      reservedUntil: existingLock,
    };

    const lockResult = HostelAllocationEngine.acquireReservationLock(bedState, now);
    if (!lockResult.success || !lockResult.newReservedUntil) {
      return {
        success: false,
        message: lockResult.message,
        bedspaceId,
      };
    }

    // Cache the lock for 15 minutes (900 seconds)
    await this.cache.set(`bedlock:${bedspaceId}`, lockResult.newReservedUntil, 900);
    await this.cache.set(`student-bed:${studentId}`, bedspaceId, 900);

    return {
      success: true,
      message: lockResult.message,
      reservedUntil: lockResult.newReservedUntil,
      bedspaceId,
    };
  }
}
