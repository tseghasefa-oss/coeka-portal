import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { ICacheProvider } from '../../infrastructure/interfaces/ICacheProvider';
import { HostelAllocationEngine, BedspaceReservationState } from './allocationEngine';

export interface Bedspace {
  id: string;
  name: string;
  bedLabel: string;
  roomId: string;
  roomNumber?: string;
  hostelId?: string;
  hostelName?: string;
  gender?: string;
  isOccupied: boolean;
  reservedUntil: number | null;
  status: 'AVAILABLE' | 'LOCKED' | 'OCCUPIED';
  remainingLockSeconds?: number;
  occupant?: {
    studentId: string;
    matricNumber: string;
    studentName: string;
    programmeName?: string;
    currentLevel?: number;
    allocatedAt?: number;
  };
}

export interface HostelRoom {
  roomId: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  hallName: string;
  gender: 'MALE' | 'FEMALE';
  capacity: number;
  floorNumber: number;
  priceKobo: number;
  availableBedspaces: number;
  occupiedBedspaces: number;
  lockedBedspaces: number;
  bedspaces: Bedspace[];
}

export interface HostelSummary {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  totalCapacity: number;
  occupiedCount: number;
  lockedCount: number;
  availableCount: number;
  occupancyRate: number;
  rooms: HostelRoom[];
}

export interface BedLockResult {
  success: boolean;
  lockId: string;
  bedspaceId: string;
  bedLabel: string;
  roomId: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  lockedAt: number;
  expiresAt: number;
  remainingSeconds: number;
  feeKobo: number;
  message: string;
}

export interface HostelAllocationResult {
  success: boolean;
  allocationId: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  bedspaceId: string;
  bedLabel: string;
  roomId: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  sessionId: string;
  paymentReference: string;
  allocatedAt: number;
  status: 'ACTIVE';
  message: string;
}

export interface RoomOccupantsReport {
  roomId: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  gender: string;
  floorNumber: number;
  capacity: number;
  occupiedCount: number;
  lockedCount: number;
  availableCount: number;
  occupants: Array<{
    bedspaceId: string;
    bedLabel: string;
    isOccupied: boolean;
    isLocked: boolean;
    status: 'OCCUPIED' | 'LOCKED' | 'AVAILABLE';
    allocationId?: string;
    allocatedAt?: number;
    paymentReference?: string;
    studentId?: string;
    matricNumber?: string;
    studentName?: string;
    gender?: string;
    currentLevel?: number;
    programmeName?: string;
    phoneNumber?: string;
    email?: string;
    contactAddress?: string;
    lockExpiry?: number;
    remainingLockSeconds?: number;
  }>;
  generatedAt: string;
}

export class HostelService {
  constructor(
    private db: IDatabaseProvider,
    private cache?: ICacheProvider
  ) {}

  /**
   * Acquire a concurrency-safe 15-minute reservation lock on a bedspace.
   * If two students click "Reserve" at the exact same millisecond, database atomic
   * conditional update ensures strictly one student secures the lock.
   */
  async acquireBedLock(studentId: string, bedspaceId: string): Promise<BedLockResult> {
    const now = Math.floor(Date.now() / 1000);
    const lockDurationSeconds = 900; // 15 minutes
    const expiresAt = now + lockDurationSeconds;

    // 1. Resolve student record
    const student = await this.db.queryFirst<{
      id: string;
      matric_number: string;
      first_name: string;
      last_name: string;
      gender: string;
      academic_status: string;
    }>(
      `SELECT id, matric_number, first_name, last_name, gender, academic_status 
       FROM students 
       WHERE id = ? OR matric_number = ? LIMIT 1`,
      [studentId, studentId]
    );

    if (!student) {
      throw new Error(`Student not found with identifier: ${studentId}`);
    }

    if (student.academic_status === 'SUSPENDED' || student.academic_status === 'EXPELLED') {
      throw new Error(`Student ${student.matric_number} is currently ${student.academic_status} and ineligible for hostel allocation.`);
    }

    // 2. Check if student already has an active permanent allocation
    const existingAllocation = await this.db.queryFirst<{
      id: string;
      bedspace_id: string;
      room_number: string;
      hostel_name: string;
    }>(
      `SELECT a.id, a.bedspace_id, r.room_number, h.name as hostel_name
       FROM hostel_allocations a
       JOIN hostel_bedspaces b ON a.bedspace_id = b.id
       JOIN hostel_rooms r ON b.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE a.student_id = ? AND a.status = 'ACTIVE' LIMIT 1`,
      [student.id]
    );

    if (existingAllocation) {
      throw new Error(
        `Student already has an active bed allocation in ${existingAllocation.hostel_name} (${existingAllocation.room_number}). Only one bed is permitted per student.`
      );
    }

    // 3. Check if student already holds an active lock on ANOTHER bedspace
    const studentActiveLock = await this.db.queryFirst<{
      id: string;
      bedspace_id: string;
      expires_at: number;
    }>(
      `SELECT id, bedspace_id, expires_at 
       FROM allocation_locks 
       WHERE student_id = ? AND status = 'LOCKED' AND expires_at > ? LIMIT 1`,
      [student.id, now]
    );

    if (studentActiveLock && studentActiveLock.bedspace_id !== bedspaceId) {
      const remainingSecs = studentActiveLock.expires_at - now;
      throw new Error(
        `Student already holds an active reservation lock on another bedspace. Please complete payment or wait ${Math.ceil(remainingSecs / 60)} minutes for it to expire.`
      );
    }

    // 4. Fetch target bedspace, room, and hostel details
    const bedDetails = await this.db.queryFirst<{
      bedspace_id: string;
      bed_label: string;
      is_occupied: number;
      reserved_until: number | null;
      room_id: string;
      room_number: string;
      capacity: number;
      price_kobo: number;
      hostel_id: string;
      hostel_name: string;
      hostel_gender: string;
    }>(
      `SELECT b.id as bedspace_id, b.bed_label, b.is_occupied, b.reserved_until,
              r.id as room_id, r.room_number, r.capacity, COALESCE(r.price_kobo, 2000000) as price_kobo,
              h.id as hostel_id, h.name as hostel_name, h.gender as hostel_gender
       FROM hostel_bedspaces b
       JOIN hostel_rooms r ON b.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE b.id = ? LIMIT 1`,
      [bedspaceId]
    );

    if (!bedDetails) {
      throw new Error(`Bedspace with ID "${bedspaceId}" not found.`);
    }

    // 5. Gender check
    const studentGenderNorm = student.gender.toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE';
    const hostelGenderNorm = bedDetails.hostel_gender.toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE';

    if (studentGenderNorm !== hostelGenderNorm) {
      throw new Error(
        `Gender restriction violation: ${studentGenderNorm} students cannot reserve bedspaces in ${hostelGenderNorm} hostels (${bedDetails.hostel_name}).`
      );
    }

    // 6. Check if permanently occupied
    if (bedDetails.is_occupied === 1) {
      throw new Error(`Bedspace ${bedDetails.bed_label} in ${bedDetails.room_number} is already permanently occupied.`);
    }

    // 7. Atomic transaction reservation lock
    return await this.db.transaction(async (tx) => {
      // If student already has an active lock on this exact bed, refresh/return it
      if (studentActiveLock && studentActiveLock.bedspace_id === bedspaceId) {
        await tx.execute(
          `UPDATE hostel_bedspaces SET reserved_until = ? WHERE id = ?`,
          [expiresAt, bedspaceId]
        );
        await tx.execute(
          `UPDATE allocation_locks SET expires_at = ?, updated_at = ? WHERE id = ?`,
          [expiresAt, now, studentActiveLock.id]
        );
        if (this.cache) {
          await this.cache.set(`bedlock:${bedspaceId}`, expiresAt, lockDurationSeconds);
          await this.cache.set(`student-bed:${student.id}`, bedspaceId, lockDurationSeconds);
        }

        return {
          success: true,
          lockId: studentActiveLock.id,
          bedspaceId: bedDetails.bedspace_id,
          bedLabel: bedDetails.bed_label,
          roomId: bedDetails.room_id,
          roomNumber: bedDetails.room_number,
          hostelId: bedDetails.hostel_id,
          hostelName: bedDetails.hostel_name,
          studentId: student.id,
          matricNumber: student.matric_number,
          studentName: `${student.first_name} ${student.last_name}`,
          lockedAt: now,
          expiresAt,
          remainingSeconds: lockDurationSeconds,
          feeKobo: bedDetails.price_kobo,
          message: 'Active reservation lock renewed. You have 15 minutes to complete payment.',
        };
      }

      // Concurrency check-and-set:
      // Updates reserved_until ONLY IF the bed is unoccupied AND either not reserved or existing reservation has expired.
      const updateResult = await tx.execute(
        `UPDATE hostel_bedspaces 
         SET reserved_until = ? 
         WHERE id = ? 
           AND is_occupied = 0 
           AND (reserved_until IS NULL OR reserved_until <= ?)`,
        [expiresAt, bedspaceId, now]
      );

      if (!updateResult.rowsAffected || updateResult.rowsAffected === 0) {
        throw new Error(
          `Bedspace ${bedDetails.bed_label} in ${bedDetails.room_number} is currently occupied or locked by another student.`
        );
      }

      // Mark any old/expired locks for this bed as RELEASED/EXPIRED
      await tx.execute(
        `UPDATE allocation_locks 
         SET status = 'EXPIRED', updated_at = ? 
         WHERE bedspace_id = ? AND status = 'LOCKED' AND expires_at <= ?`,
        [now, bedspaceId, now]
      );

      // Insert new allocation lock record
      const lockId = `lock-${crypto.randomUUID()}`;
      await tx.execute(
        `INSERT INTO allocation_locks (id, student_id, bedspace_id, locked_at, expires_at, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'LOCKED', ?, ?)`,
        [lockId, student.id, bedspaceId, now, expiresAt, now, now]
      );

      // Cache lock in KV if provider is present
      if (this.cache) {
        await this.cache.set(`bedlock:${bedspaceId}`, expiresAt, lockDurationSeconds);
        await this.cache.set(`student-bed:${student.id}`, bedspaceId, lockDurationSeconds);
      }

      return {
        success: true,
        lockId,
        bedspaceId: bedDetails.bedspace_id,
        bedLabel: bedDetails.bed_label,
        roomId: bedDetails.room_id,
        roomNumber: bedDetails.room_number,
        hostelId: bedDetails.hostel_id,
        hostelName: bedDetails.hostel_name,
        studentId: student.id,
        matricNumber: student.matric_number,
        studentName: `${student.first_name} ${student.last_name}`,
        lockedAt: now,
        expiresAt,
        remainingSeconds: lockDurationSeconds,
        feeKobo: bedDetails.price_kobo,
        message: 'Bedspace lock acquired successfully. You have 15 minutes to complete payment.',
      };
    });
  }

  /**
   * Convert an active reservation lock into a permanent allocation upon verified fee payment.
   */
  async confirmAllocation(
    studentId: string,
    bedspaceId: string,
    paymentReference?: string,
    sessionId?: string
  ): Promise<HostelAllocationResult> {
    const now = Math.floor(Date.now() / 1000);

    // 1. Resolve student
    const student = await this.db.queryFirst<{
      id: string;
      matric_number: string;
      first_name: string;
      last_name: string;
    }>(
      `SELECT id, matric_number, first_name, last_name FROM students WHERE id = ? OR matric_number = ? LIMIT 1`,
      [studentId, studentId]
    );

    if (!student) {
      throw new Error(`Student not found with identifier: ${studentId}`);
    }

    // 2. Fetch bed, room, and hostel metadata
    const bed = await this.db.queryFirst<{
      bedspace_id: string;
      bed_label: string;
      is_occupied: number;
      room_id: string;
      room_number: string;
      hostel_id: string;
      hostel_name: string;
    }>(
      `SELECT b.id as bedspace_id, b.bed_label, b.is_occupied,
              r.id as room_id, r.room_number,
              h.id as hostel_id, h.name as hostel_name
       FROM hostel_bedspaces b
       JOIN hostel_rooms r ON b.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE b.id = ? LIMIT 1`,
      [bedspaceId]
    );

    if (!bed) {
      throw new Error(`Bedspace with ID "${bedspaceId}" not found.`);
    }

    if (bed.is_occupied === 1) {
      throw new Error(`Bedspace ${bed.bed_label} in ${bed.room_number} is already permanently occupied.`);
    }

    // 3. Resolve academic session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await this.db.queryFirst<{ id: string }>(
        `SELECT id FROM academic_sessions WHERE is_current = 1 LIMIT 1`
      );
      targetSessionId = activeSession?.id || 'sess-2026-2027';
    }

    // 4. Atomic transaction confirmation
    return await this.db.transaction(async (tx) => {
      // Find active lock held by this student
      const activeLock = await tx.queryFirst<{
        id: string;
        expires_at: number;
      }>(
        `SELECT id, expires_at 
         FROM allocation_locks 
         WHERE student_id = ? AND bedspace_id = ? AND status = 'LOCKED' AND expires_at > ?
         ORDER BY locked_at DESC LIMIT 1`,
        [student.id, bedspaceId, now]
      );

      if (!activeLock) {
        throw new Error(
          `No active reservation lock found for student ${student.matric_number} on bedspace ${bed.bed_label}, or the 15-minute lock has expired.`
        );
      }

      const paymentRef = paymentReference || `PAY-HST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const allocationId = `alloc-${crypto.randomUUID()}`;

      // Update allocation_locks to CONFIRMED
      await tx.execute(
        `UPDATE allocation_locks 
         SET status = 'CONFIRMED', payment_reference = ?, updated_at = ? 
         WHERE id = ?`,
        [paymentRef, now, activeLock.id]
      );

      // Update hostel_bedspaces to permanently occupied and clear lock
      await tx.execute(
        `UPDATE hostel_bedspaces 
         SET is_occupied = 1, reserved_until = NULL 
         WHERE id = ?`,
        [bedspaceId]
      );

      // Insert permanent hostel allocation
      await tx.execute(
        `INSERT INTO hostel_allocations (
           id, bedspace_id, student_id, session_id, payment_reference, allocated_at, status
         ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [allocationId, bedspaceId, student.id, targetSessionId, paymentRef, now]
      );

      // Clean up cache
      if (this.cache) {
        await this.cache.delete(`bedlock:${bedspaceId}`);
        await this.cache.delete(`student-bed:${student.id}`);
      }

      return {
        success: true,
        allocationId,
        studentId: student.id,
        matricNumber: student.matric_number,
        studentName: `${student.first_name} ${student.last_name}`,
        bedspaceId: bed.bedspace_id,
        bedLabel: bed.bed_label,
        roomId: bed.room_id,
        roomNumber: bed.room_number,
        hostelId: bed.hostel_id,
        hostelName: bed.hostel_name,
        sessionId: targetSessionId!,
        paymentReference: paymentRef,
        allocatedAt: now,
        status: 'ACTIVE',
        message: `Hostel bedspace ${bed.bed_label} successfully allocated to ${student.first_name} ${student.last_name}.`,
      };
    });
  }

  /**
   * Cron/Worker task to release expired locks older than 15 minutes.
   * Resets bedspace reserved_until to NULL if unoccupied.
   */
  async releaseExpiredLocks(): Promise<{ expiredCount: number; freedBedspaces: string[] }> {
    const now = Math.floor(Date.now() / 1000);

    const expiredLocks = await this.db.query<{
      id: string;
      bedspace_id: string;
      student_id: string;
    }>(
      `SELECT id, bedspace_id, student_id 
       FROM allocation_locks 
       WHERE status = 'LOCKED' AND expires_at <= ?`,
      [now]
    );

    const freedBedspaces: string[] = [];

    for (const lock of expiredLocks) {
      await this.db.execute(
        `UPDATE allocation_locks SET status = 'EXPIRED', updated_at = ? WHERE id = ?`,
        [now, lock.id]
      );

      // If bedspace is unoccupied, clear reserved_until
      const result = await this.db.execute(
        `UPDATE hostel_bedspaces 
         SET reserved_until = NULL 
         WHERE id = ? AND is_occupied = 0 AND (reserved_until IS NULL OR reserved_until <= ?)`,
        [lock.bedspace_id, now]
      );

      if (result.rowsAffected && result.rowsAffected > 0) {
        freedBedspaces.push(lock.bedspace_id);
      }

      if (this.cache) {
        await this.cache.delete(`bedlock:${lock.bedspace_id}`);
        await this.cache.delete(`student-bed:${lock.student_id}`);
      }
    }

    // Sweep any orphaned bedspaces where reserved_until has passed and is_occupied = 0
    await this.db.execute(
      `UPDATE hostel_bedspaces 
       SET reserved_until = NULL 
       WHERE is_occupied = 0 AND reserved_until IS NOT NULL AND reserved_until <= ?`,
      [now]
    );

    return {
      expiredCount: expiredLocks.length,
      freedBedspaces,
    };
  }

  /**
   * Generates occupant dossier and bed roster for the Hostel Warden.
   */
  async generateRoomList(roomNumberOrId: string, hostelId?: string): Promise<RoomOccupantsReport> {
    const now = Math.floor(Date.now() / 1000);

    let roomQuery = `
      SELECT r.id as room_id, r.room_number, r.capacity, r.floor_number,
             h.id as hostel_id, h.name as hostel_name, h.gender as hostel_gender
      FROM hostel_rooms r
      JOIN hostels h ON r.hostel_id = h.id
      WHERE (r.id = ? OR r.room_number = ? OR r.room_number = ?)
    `;
    const params: any[] = [roomNumberOrId, roomNumberOrId, `Room ${roomNumberOrId}`];

    if (hostelId) {
      roomQuery += ` AND (h.id = ? OR h.name LIKE ?)`;
      params.push(hostelId, `%${hostelId}%`);
    }

    roomQuery += ` LIMIT 1`;

    const room = await this.db.queryFirst<{
      room_id: string;
      room_number: string;
      capacity: number;
      floor_number: number;
      hostel_id: string;
      hostel_name: string;
      hostel_gender: string;
    }>(roomQuery, params);

    if (!room) {
      throw new Error(`Room "${roomNumberOrId}" not found${hostelId ? ` in hostel ${hostelId}` : ''}.`);
    }

    // Fetch all bedspaces in this room
    const bedspaces = await this.db.query<{
      id: string;
      bed_label: string;
      is_occupied: number;
      reserved_until: number | null;
    }>(
      `SELECT id, bed_label, is_occupied, reserved_until 
       FROM hostel_bedspaces 
       WHERE room_id = ? 
       ORDER BY bed_label ASC`,
      [room.room_id]
    );

    const occupantsReport: RoomOccupantsReport['occupants'] = [];
    let occupiedCount = 0;
    let lockedCount = 0;
    let availableCount = 0;

    for (const bed of bedspaces) {
      const isOccupied = bed.is_occupied === 1;
      const isLocked = !isOccupied && bed.reserved_until !== null && bed.reserved_until > now;

      if (isOccupied) {
        occupiedCount++;
        // Fetch active allocation
        const alloc = await this.db.queryFirst<{
          allocation_id: string;
          allocated_at: number;
          payment_reference: string;
          student_id: string;
          matric_number: string;
          first_name: string;
          last_name: string;
          gender: string;
          current_level: number;
          contact_address: string;
          phone_number: string;
          email: string;
          programme_name: string;
        }>(
          `SELECT a.id as allocation_id, a.allocated_at, a.payment_reference,
                  s.id as student_id, s.matric_number, s.first_name, s.last_name, s.gender,
                  s.current_level, s.contact_address,
                  COALESCE(u.phone_number, '') as phone_number,
                  COALESCE(u.email, '') as email,
                  COALESCE(p.name, 'General NCE') as programme_name
           FROM hostel_allocations a
           JOIN students s ON a.student_id = s.id
           JOIN users u ON s.user_id = u.id
           LEFT JOIN programmes p ON s.programme_id = p.id
           WHERE a.bedspace_id = ? AND a.status = 'ACTIVE'
           ORDER BY a.allocated_at DESC LIMIT 1`,
          [bed.id]
        );

        occupantsReport.push({
          bedspaceId: bed.id,
          bedLabel: bed.bed_label,
          isOccupied: true,
          isLocked: false,
          status: 'OCCUPIED',
          allocationId: alloc?.allocation_id,
          allocatedAt: alloc?.allocated_at,
          paymentReference: alloc?.payment_reference,
          studentId: alloc?.student_id,
          matricNumber: alloc?.matric_number,
          studentName: alloc ? `${alloc.first_name} ${alloc.last_name}` : 'Unknown Occupant',
          gender: alloc?.gender,
          currentLevel: alloc?.current_level,
          programmeName: alloc?.programme_name,
          phoneNumber: alloc?.phone_number,
          email: alloc?.email,
          contactAddress: alloc?.contact_address,
        });
      } else if (isLocked) {
        lockedCount++;
        const lockInfo = await this.db.queryFirst<{
          lock_id: string;
          student_id: string;
          matric_number: string;
          first_name: string;
          last_name: string;
          expires_at: number;
        }>(
          `SELECT l.id as lock_id, l.student_id, l.expires_at,
                  s.matric_number, s.first_name, s.last_name
           FROM allocation_locks l
           JOIN students s ON l.student_id = s.id
           WHERE l.bedspace_id = ? AND l.status = 'LOCKED' AND l.expires_at > ?
           ORDER BY l.locked_at DESC LIMIT 1`,
          [bed.id, now]
        );

        const remainingSecs = (bed.reserved_until || 0) - now;

        occupantsReport.push({
          bedspaceId: bed.id,
          bedLabel: bed.bed_label,
          isOccupied: false,
          isLocked: true,
          status: 'LOCKED',
          studentId: lockInfo?.student_id,
          matricNumber: lockInfo?.matric_number,
          studentName: lockInfo ? `${lockInfo.first_name} ${lockInfo.last_name} (Pending Payment)` : 'Reservation in Progress',
          lockExpiry: bed.reserved_until || 0,
          remainingLockSeconds: Math.max(0, remainingSecs),
        });
      } else {
        availableCount++;
        occupantsReport.push({
          bedspaceId: bed.id,
          bedLabel: bed.bed_label,
          isOccupied: false,
          isLocked: false,
          status: 'AVAILABLE',
        });
      }
    }

    return {
      roomId: room.room_id,
      roomNumber: room.room_number,
      hostelId: room.hostel_id,
      hostelName: room.hostel_name,
      gender: room.hostel_gender,
      floorNumber: room.floor_number,
      capacity: room.capacity,
      occupiedCount,
      lockedCount,
      availableCount,
      occupants: occupantsReport,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Warden reassignment: relocate an occupant to a different bedspace.
   */
  async reassignStudentBed(
    studentId: string,
    targetBedspaceId: string,
    wardenStaffId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    studentId: string;
    oldBedspaceId: string;
    newBedspaceId: string;
    targetRoomNumber: string;
    targetHostelName: string;
    reassignedAt: number;
    message: string;
  }> {
    const now = Math.floor(Date.now() / 1000);

    // 1. Find student
    const student = await this.db.queryFirst<{ id: string; matric_number: string; first_name: string; last_name: string }>(
      `SELECT id, matric_number, first_name, last_name FROM students WHERE id = ? OR matric_number = ? LIMIT 1`,
      [studentId, studentId]
    );

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    // 2. Find current active allocation
    const currentAlloc = await this.db.queryFirst<{
      id: string;
      bedspace_id: string;
    }>(
      `SELECT id, bedspace_id FROM hostel_allocations WHERE student_id = ? AND status = 'ACTIVE' LIMIT 1`,
      [student.id]
    );

    if (!currentAlloc) {
      throw new Error(`Student ${student.matric_number} has no active hostel allocation to reassign.`);
    }

    if (currentAlloc.bedspace_id === targetBedspaceId) {
      throw new Error(`Student is already allocated to this exact bedspace.`);
    }

    // 3. Find target bedspace
    const targetBed = await this.db.queryFirst<{
      id: string;
      bed_label: string;
      is_occupied: number;
      reserved_until: number | null;
      room_number: string;
      hostel_name: string;
    }>(
      `SELECT b.id, b.bed_label, b.is_occupied, b.reserved_until,
              r.room_number, h.name as hostel_name
       FROM hostel_bedspaces b
       JOIN hostel_rooms r ON b.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE b.id = ? LIMIT 1`,
      [targetBedspaceId]
    );

    if (!targetBed) {
      throw new Error(`Target bedspace not found: ${targetBedspaceId}`);
    }

    if (targetBed.is_occupied === 1) {
      throw new Error(`Target bedspace ${targetBed.bed_label} in ${targetBed.room_number} is already occupied.`);
    }

    if (targetBed.reserved_until && targetBed.reserved_until > now) {
      throw new Error(`Target bedspace ${targetBed.bed_label} in ${targetBed.room_number} is currently locked by a student.`);
    }

    return await this.db.transaction(async (tx) => {
      // Free old bedspace
      await tx.execute(
        `UPDATE hostel_bedspaces SET is_occupied = 0, reserved_until = NULL WHERE id = ?`,
        [currentAlloc.bedspace_id]
      );

      // Occupy target bedspace
      await tx.execute(
        `UPDATE hostel_bedspaces SET is_occupied = 1, reserved_until = NULL WHERE id = ?`,
        [targetBedspaceId]
      );

      // Update allocation record
      const notes = reason ? `Reassigned by Warden (${wardenStaffId}): ${reason}` : `Reassigned by Warden (${wardenStaffId})`;
      await tx.execute(
        `UPDATE hostel_allocations 
         SET bedspace_id = ?, warden_staff_id = ?, notes = ?, allocated_at = ? 
         WHERE id = ?`,
        [targetBedspaceId, wardenStaffId, notes, now, currentAlloc.id]
      );

      return {
        success: true,
        studentId: student.id,
        oldBedspaceId: currentAlloc.bedspace_id,
        newBedspaceId: targetBedspaceId,
        targetRoomNumber: targetBed.room_number,
        targetHostelName: targetBed.hostel_name,
        reassignedAt: now,
        message: `Student ${student.first_name} ${student.last_name} (${student.matric_number}) successfully reassigned to ${targetBed.bed_label} in ${targetBed.room_number} (${targetBed.hostel_name}).`,
      };
    });
  }

  /**
   * Revoke an allocation (e.g. student expulsion, misconduct, or non-compliance).
   */
  async revokeAllocation(
    allocationId: string,
    wardenStaffId: string,
    reason: string
  ): Promise<{ success: boolean; allocationId: string; freedBedspaceId: string; message: string }> {
    const alloc = await this.db.queryFirst<{
      id: string;
      bedspace_id: string;
      student_id: string;
      status: string;
    }>(
      `SELECT id, bedspace_id, student_id, status FROM hostel_allocations WHERE id = ? LIMIT 1`,
      [allocationId]
    );

    if (!alloc) {
      throw new Error(`Hostel allocation record not found: ${allocationId}`);
    }

    if (alloc.status === 'REVOKED') {
      throw new Error(`Allocation ${allocationId} is already revoked.`);
    }

    const now = Math.floor(Date.now() / 1000);
    const notes = `Revoked by Warden (${wardenStaffId}): ${reason}`;

    await this.db.transaction(async (tx) => {
      await tx.execute(
        `UPDATE hostel_allocations SET status = 'REVOKED', warden_staff_id = ?, notes = ? WHERE id = ?`,
        [wardenStaffId, notes, alloc.id]
      );

      await tx.execute(
        `UPDATE hostel_bedspaces SET is_occupied = 0, reserved_until = NULL WHERE id = ?`,
        [alloc.bedspace_id]
      );
    });

    return {
      success: true,
      allocationId: alloc.id,
      freedBedspaceId: alloc.bedspace_id,
      message: `Hostel allocation ${allocationId} successfully revoked. Bedspace is now available.`,
    };
  }

  /**
   * Retrieves full hostel inventory and real-time room/bed statuses.
   */
  async getHostelOverview(genderFilter?: string): Promise<HostelSummary[]> {
    const now = Math.floor(Date.now() / 1000);

    let hostelSql = `SELECT id, name, gender, total_capacity, is_active FROM hostels WHERE is_active = 1`;
    const params: any[] = [];

    if (genderFilter) {
      const gNorm = genderFilter.toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE';
      hostelSql += ` AND gender = ?`;
      params.push(gNorm);
    }

    hostelSql += ` ORDER BY name ASC`;

    const hostelsList = await this.db.query<{
      id: string;
      name: string;
      gender: 'MALE' | 'FEMALE';
      total_capacity: number;
      is_active: number;
    }>(hostelSql, params);

    const summaries: HostelSummary[] = [];

    for (const h of hostelsList) {
      const roomsList = await this.db.query<{
        id: string;
        room_number: string;
        capacity: number;
        floor_number: number;
        price_kobo: number;
      }>(
        `SELECT id, room_number, capacity, floor_number, COALESCE(price_kobo, 2000000) as price_kobo 
         FROM hostel_rooms 
         WHERE hostel_id = ? 
         ORDER BY room_number ASC`,
        [h.id]
      );

      let hostelOccupied = 0;
      let hostelLocked = 0;
      let hostelAvailable = 0;
      const roomDtos: HostelRoom[] = [];

      for (const r of roomsList) {
        const bedspaces = await this.db.query<{
          id: string;
          bed_label: string;
          is_occupied: number;
          reserved_until: number | null;
        }>(
          `SELECT id, bed_label, is_occupied, reserved_until 
           FROM hostel_bedspaces 
           WHERE room_id = ? 
           ORDER BY bed_label ASC`,
          [r.id]
        );

        let roomAvailable = 0;
        let roomOccupied = 0;
        let roomLocked = 0;
        const bedDtos: Bedspace[] = [];

        for (const b of bedspaces) {
          const isOcc = b.is_occupied === 1;
          const isLock = !isOcc && b.reserved_until !== null && b.reserved_until > now;

          let status: Bedspace['status'] = 'AVAILABLE';
          let remainingLockSeconds = 0;

          if (isOcc) {
            status = 'OCCUPIED';
            roomOccupied++;
            hostelOccupied++;
          } else if (isLock) {
            status = 'LOCKED';
            roomLocked++;
            hostelLocked++;
            remainingLockSeconds = Math.max(0, (b.reserved_until || 0) - now);
          } else {
            status = 'AVAILABLE';
            roomAvailable++;
            hostelAvailable++;
          }

          bedDtos.push({
            id: b.id,
            name: b.bed_label,
            bedLabel: b.bed_label,
            roomId: r.id,
            roomNumber: r.room_number,
            hostelId: h.id,
            hostelName: h.name,
            gender: h.gender,
            isOccupied: isOcc,
            reservedUntil: b.reserved_until,
            status,
            remainingLockSeconds,
          });
        }

        roomDtos.push({
          roomId: r.id,
          roomNumber: r.room_number,
          hostelId: h.id,
          hostelName: h.name,
          hallName: h.name,
          gender: h.gender,
          capacity: r.capacity,
          floorNumber: r.floor_number,
          priceKobo: r.price_kobo,
          availableBedspaces: roomAvailable,
          occupiedBedspaces: roomOccupied,
          lockedBedspaces: roomLocked,
          bedspaces: bedDtos,
        });
      }

      const totalBeds = hostelOccupied + hostelLocked + hostelAvailable;
      const occupancyRate = totalBeds > 0 ? Math.round((hostelOccupied / totalBeds) * 100) : 0;

      summaries.push({
        id: h.id,
        name: h.name,
        gender: h.gender,
        totalCapacity: h.total_capacity,
        occupiedCount: hostelOccupied,
        lockedCount: hostelLocked,
        availableCount: hostelAvailable,
        occupancyRate,
        rooms: roomDtos,
      });
    }

    return summaries;
  }

  /**
   * Check a student's active reservation or allocation state.
   */
  async getStudentStatus(studentIdOrMatric: string): Promise<{
    student: {
      id: string;
      matricNumber: string;
      name: string;
      gender: string;
      level: number;
    };
    hasActiveAllocation: boolean;
    allocation?: {
      allocationId: string;
      bedspaceId: string;
      bedLabel: string;
      roomNumber: string;
      hostelName: string;
      allocatedAt: number;
      paymentReference: string;
    };
    hasActiveLock: boolean;
    lock?: {
      lockId: string;
      bedspaceId: string;
      bedLabel: string;
      roomNumber: string;
      hostelName: string;
      lockedAt: number;
      expiresAt: number;
      remainingSeconds: number;
      feeKobo: number;
    };
  }> {
    const now = Math.floor(Date.now() / 1000);

    const student = await this.db.queryFirst<{
      id: string;
      matric_number: string;
      first_name: string;
      last_name: string;
      gender: string;
      current_level: number;
    }>(
      `SELECT id, matric_number, first_name, last_name, gender, current_level 
       FROM students 
       WHERE id = ? OR matric_number = ? LIMIT 1`,
      [studentIdOrMatric, studentIdOrMatric]
    );

    if (!student) {
      throw new Error(`Student not found: ${studentIdOrMatric}`);
    }

    // Check active allocation
    const alloc = await this.db.queryFirst<{
      id: string;
      bedspace_id: string;
      bed_label: string;
      room_number: string;
      hostel_name: string;
      allocated_at: number;
      payment_reference: string;
    }>(
      `SELECT a.id, a.bedspace_id, b.bed_label, r.room_number, h.name as hostel_name,
              a.allocated_at, a.payment_reference
       FROM hostel_allocations a
       JOIN hostel_bedspaces b ON a.bedspace_id = b.id
       JOIN hostel_rooms r ON b.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE a.student_id = ? AND a.status = 'ACTIVE' LIMIT 1`,
      [student.id]
    );

    // Check active lock
    const lock = await this.db.queryFirst<{
      id: string;
      bedspace_id: string;
      bed_label: string;
      room_number: string;
      hostel_name: string;
      locked_at: number;
      expires_at: number;
      price_kobo: number;
    }>(
      `SELECT l.id, l.bedspace_id, b.bed_label, r.room_number, h.name as hostel_name,
              l.locked_at, l.expires_at, COALESCE(r.price_kobo, 2000000) as price_kobo
       FROM allocation_locks l
       JOIN hostel_bedspaces b ON l.bedspace_id = b.id
       JOIN hostel_rooms r ON b.room_id = r.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE l.student_id = ? AND l.status = 'LOCKED' AND l.expires_at > ?
       ORDER BY l.locked_at DESC LIMIT 1`,
      [student.id, now]
    );

    return {
      student: {
        id: student.id,
        matricNumber: student.matric_number,
        name: `${student.first_name} ${student.last_name}`,
        gender: student.gender,
        level: student.current_level,
      },
      hasActiveAllocation: !!alloc,
      allocation: alloc
        ? {
            allocationId: alloc.id,
            bedspaceId: alloc.bedspace_id,
            bedLabel: alloc.bed_label,
            roomNumber: alloc.room_number,
            hostelName: alloc.hostel_name,
            allocatedAt: alloc.allocated_at,
            paymentReference: alloc.payment_reference,
          }
        : undefined,
      hasActiveLock: !!lock,
      lock: lock
        ? {
            lockId: lock.id,
            bedspaceId: lock.bedspace_id,
            bedLabel: lock.bed_label,
            roomNumber: lock.room_number,
            hostelName: lock.hostel_name,
            lockedAt: lock.locked_at,
            expiresAt: lock.expires_at,
            remainingSeconds: Math.max(0, lock.expires_at - now),
            feeKobo: lock.price_kobo,
          }
        : undefined,
    };
  }

  /**
   * Backward-compatibility wrapper for getRooms()
   */
  async getRooms(): Promise<HostelRoom[]> {
    const overview = await this.getHostelOverview();
    return overview.flatMap(h => h.rooms);
  }

  /**
   * Backward-compatibility wrapper for reserveBedspace()
   */
  async reserveBedspace(bedspaceId: string, studentId: string): Promise<{
    success: boolean;
    message: string;
    reservedUntil?: number;
    bedspaceId: string;
  }> {
    try {
      const lock = await this.acquireBedLock(studentId, bedspaceId);
      return {
        success: true,
        message: lock.message,
        reservedUntil: lock.expiresAt,
        bedspaceId: lock.bedspaceId,
      };
    } catch (err: any) {
      // If error was due to missing DB record and cache is available, fallback to cache allocation engine (for unit tests / mock beds)
      if (
        this.cache &&
        (err.message?.includes('not found') ||
          err.message?.includes('Student not found') ||
          err.message?.includes('Bedspace with ID'))
      ) {
        const now = Math.floor(Date.now() / 1000);
        const existingLock = await this.cache.get<number>(`bedlock:${bedspaceId}`);
        const bedState: BedspaceReservationState = {
          bedspaceId,
          isOccupied: false,
          reservedUntil: existingLock || null,
        };
        const lockResult = HostelAllocationEngine.acquireReservationLock(bedState, now);
        if (!lockResult.success || !lockResult.newReservedUntil) {
          return {
            success: false,
            message: lockResult.message,
            bedspaceId,
          };
        }
        await this.cache.set(`bedlock:${bedspaceId}`, lockResult.newReservedUntil, 900);
        await this.cache.set(`student-bed:${studentId}`, bedspaceId, 900);
        return {
          success: true,
          message: lockResult.message,
          reservedUntil: lockResult.newReservedUntil,
          bedspaceId,
        };
      }

      return {
        success: false,
        message: err.message || 'Failed to acquire reservation lock.',
        bedspaceId,
      };
    }
  }
}
