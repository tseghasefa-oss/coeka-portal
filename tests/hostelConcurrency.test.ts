import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDatabaseAdapter, MemoryCacheAdapter } from '../src/infrastructure/adapters/memory/index';
import { HostelService } from '../src/services/hostels/hostelService';
import { HostelAllocationEngine } from '../src/services/hostels/allocationEngine';

describe('Module 11: High-Concurrency Hostel Allocation Engine', () => {
  let db: MemoryDatabaseAdapter;
  let cache: MemoryCacheAdapter;
  let service: HostelService;

  beforeEach(async () => {
    db = new MemoryDatabaseAdapter();
    cache = new MemoryCacheAdapter();
    service = new HostelService(db, cache);

    // Seed 10 distinct female students for concurrent race test
    for (let i = 1; i <= 10; i++) {
      const num = i.toString().padStart(2, '0');
      const userId = `usr-h-fem-${num}`;
      const studentId = `stu-h-fem-${num}`;
      const matric = `COEKA/2026/FEM/${num}`;

      // Insert user
      await db.execute(
        `INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type)
         VALUES (?, ?, ?, ?, ?, 'STUDENT')`,
        [userId, `femstudent${num}`, `fem${num}@coeka.edu.ng`, `080300000${num}`, 'hash_pwd']
      );

      // Insert student
      await db.execute(
        `INSERT OR IGNORE INTO students (
           id, user_id, division_id, programme_id, current_level, matric_number, admission_year,
           first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin,
           contact_address, passport_photo_url, qr_code_signature, academic_status
         ) VALUES (
           ?, ?, 'div-nce', 'prog-nce-csc-mth', 100, ?, 2026,
           'Amina', 'Student${num}', 'FEMALE', '2005-04-12', 'Benue', 'Katsina-Ala',
           'Hostel Road, Katsina-Ala', 'https://r2.coeka.edu.ng/photo.jpg', 'qr_hash_${num}', 'ACTIVE'
         )`,
        [studentId, userId, matric]
      );
    }

    // Seed 1 male student for gender constraint test
    await db.execute(
      `INSERT OR IGNORE INTO users (id, username, email, phone_number, password_hash, user_type)
       VALUES ('usr-h-male-01', 'malestudent01', 'male01@coeka.edu.ng', '08031111101', 'hash_pwd', 'STUDENT')`
    );
    await db.execute(
      `INSERT OR IGNORE INTO students (
         id, user_id, division_id, programme_id, current_level, matric_number, admission_year,
         first_name, last_name, gender, date_of_birth, state_of_origin, lga_of_origin,
         contact_address, passport_photo_url, qr_code_signature, academic_status
       ) VALUES (
         'stu-h-male-01', 'usr-h-male-01', 'div-nce', 'prog-nce-csc-mth', 100, 'COEKA/2026/MALE/01', 2026,
         'Terver', 'MaleStudent', 'MALE', '2005-01-10', 'Benue', 'Gboko',
         'Gboko Road', 'https://r2.coeka.edu.ng/male.jpg', 'qr_male_01', 'ACTIVE'
       )`
    );

    // Reset bedspace bed-a101-1 to ensure completely clean state
    await db.execute(`UPDATE hostel_bedspaces SET is_occupied = 0, reserved_until = NULL WHERE id = 'bed-a101-1'`);
    await db.execute(`DELETE FROM allocation_locks WHERE bedspace_id = 'bed-a101-1'`);
    await db.execute(`DELETE FROM hostel_allocations WHERE bedspace_id = 'bed-a101-1'`);
  });

  it('ensures ZERO double-bookings when 10 students hit the same bed simultaneously via Promise.all', async () => {
    const targetBedspaceId = 'bed-a101-1';
    const studentIds = Array.from({ length: 10 }, (_, i) => `stu-h-fem-${(i + 1).toString().padStart(2, '0')}`);

    // Fire 10 simultaneous reservation requests at the exact same millisecond
    const results = await Promise.allSettled(
      studentIds.map((studentId) => service.acquireBedLock(studentId, targetBedspaceId))
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    // Strict Concurrency Assertions
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(9);

    const winner = fulfilled[0].value;
    expect(winner.success).toBe(true);
    expect(winner.bedspaceId).toBe(targetBedspaceId);
    expect(winner.remainingSeconds).toBe(900);
    expect(winner.feeKobo).toBe(2000000); // ₦20,000.00
    expect(winner.message).toContain('Bedspace lock acquired successfully');

    // All 9 rejected attempts must report that the bed is already held/occupied
    for (const rej of rejected) {
      expect(rej.reason.message).toMatch(/occupied or locked by another student/i);
    }

    // Verify database state: exactly 1 ACTIVE lock in allocation_locks
    const locks = await db.query(
      `SELECT * FROM allocation_locks WHERE bedspace_id = ? AND status = 'LOCKED'`,
      [targetBedspaceId]
    );
    expect(locks.length).toBe(1);
    expect(locks[0].student_id).toBe(winner.studentId);

    // Verify bedspace reserved_until is set to exactly ~900s in future
    const bed = await db.queryFirst<{ is_occupied: number; reserved_until: number }>(
      `SELECT is_occupied, reserved_until FROM hostel_bedspaces WHERE id = ?`,
      [targetBedspaceId]
    );
    expect(bed?.is_occupied).toBe(0);
    expect(bed?.reserved_until).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('releases expired locks older than 15 minutes and permits subsequent reservations', async () => {
    const targetBedspace = 'bed-a101-1';
    const student1 = 'stu-h-fem-01';
    const student2 = 'stu-h-fem-02';

    // 1. Student 1 secures lock
    const lock1 = await service.acquireBedLock(student1, targetBedspace);
    expect(lock1.success).toBe(true);

    // 2. Student 2 cannot reserve because lock is active
    await expect(service.acquireBedLock(student2, targetBedspace)).rejects.toThrow(
      /occupied or locked by another student/i
    );

    // 3. Fast-forward lock into the past (expired 10 seconds ago)
    const pastTime = Math.floor(Date.now() / 1000) - 10;
    await db.execute(`UPDATE allocation_locks SET expires_at = ? WHERE id = ?`, [pastTime, lock1.lockId]);
    await db.execute(`UPDATE hostel_bedspaces SET reserved_until = ? WHERE id = ?`, [pastTime, targetBedspace]);

    // 4. Run releaseExpiredLocks worker sweep
    const sweepResult = await service.releaseExpiredLocks();
    expect(sweepResult.expiredCount).toBeGreaterThanOrEqual(1);
    expect(sweepResult.freedBedspaces).toContain(targetBedspace);

    // Verify bedspace reserved_until is now NULL
    const updatedBed = await db.queryFirst<{ reserved_until: number | null }>(
      `SELECT reserved_until FROM hostel_bedspaces WHERE id = ?`,
      [targetBedspace]
    );
    expect(updatedBed?.reserved_until).toBeNull();

    // 5. Student 2 can now successfully reserve the freed bedspace
    const lock2 = await service.acquireBedLock(student2, targetBedspace);
    expect(lock2.success).toBe(true);
    expect(lock2.studentId).toBe(student2);
  });

  it('converts an active lock into a permanent allocation upon verified fee payment', async () => {
    const targetBedspace = 'bed-a101-1';
    const student = 'stu-h-fem-03';

    // 1. Acquire 15-minute lock
    const lock = await service.acquireBedLock(student, targetBedspace);
    expect(lock.success).toBe(true);

    // 2. Confirm allocation with payment reference
    const paymentRef = 'PAY-HST-TEST-998822';
    const allocResult = await service.confirmAllocation(student, targetBedspace, paymentRef);

    expect(allocResult.success).toBe(true);
    expect(allocResult.bedspaceId).toBe(targetBedspace);
    expect(allocResult.paymentReference).toBe(paymentRef);
    expect(allocResult.status).toBe('ACTIVE');

    // 3. Verify database state
    const bed = await db.queryFirst<{ is_occupied: number; reserved_until: number | null }>(
      `SELECT is_occupied, reserved_until FROM hostel_bedspaces WHERE id = ?`,
      [targetBedspace]
    );
    expect(bed?.is_occupied).toBe(1);
    expect(bed?.reserved_until).toBeNull();

    const lockRow = await db.queryFirst<{ status: string; payment_reference: string }>(
      `SELECT status, payment_reference FROM allocation_locks WHERE id = ?`,
      [lock.lockId]
    );
    expect(lockRow?.status).toBe('CONFIRMED');
    expect(lockRow?.payment_reference).toBe(paymentRef);

    // 4. Another student cannot lock or occupy this permanently allocated bed
    await expect(service.acquireBedLock('stu-h-fem-04', targetBedspace)).rejects.toThrow(
      /already permanently occupied/i
    );
  });

  it('enforces gender restrictions: rejects male student from female hostel', async () => {
    const maleStudent = 'stu-h-male-01';
    const femaleBedspace = 'bed-a101-1'; // Hall A is Queen Amina Hall (Female)

    await expect(service.acquireBedLock(maleStudent, femaleBedspace)).rejects.toThrow(
      /Gender restriction violation: MALE students cannot reserve bedspaces in FEMALE hostels/i
    );
  });

  it('generates an accurate occupant roster for the Hostel Warden', async () => {
    // Allocate bed-a101-1 to stu-h-fem-01
    await service.acquireBedLock('stu-h-fem-01', 'bed-a101-1');
    await service.confirmAllocation('stu-h-fem-01', 'bed-a101-1', 'PAY-WAR-ROSTER-01');

    // Lock bed-a101-2 for stu-h-fem-02 (pending payment)
    await service.acquireBedLock('stu-h-fem-02', 'bed-a101-2');

    // Generate room list for Warden
    const roster = await service.generateRoomList('Room 101', 'hostel-a-fem');

    expect(roster.roomNumber).toBe('Room 101');
    expect(roster.hostelName).toContain('Queen Amina');
    expect(roster.occupiedCount).toBe(1);
    expect(roster.lockedCount).toBe(1);
    expect(roster.availableCount).toBe(2); // 4 - 1 occupied - 1 locked

    // Check occupant details
    const bed1 = roster.occupants.find((o) => o.bedspaceId === 'bed-a101-1');
    expect(bed1?.status).toBe('OCCUPIED');
    expect(bed1?.matricNumber).toBe('COEKA/2026/FEM/01');
    expect(bed1?.studentName).toContain('Amina Student01');
    expect(bed1?.phoneNumber).toBe('08030000001');

    const bed2 = roster.occupants.find((o) => o.bedspaceId === 'bed-a101-2');
    expect(bed2?.status).toBe('LOCKED');
    expect(bed2?.matricNumber).toBe('COEKA/2026/FEM/02');
  });

  it('supports Warden relocation of an occupant to an available bedspace and revocation', async () => {
    const studentId = 'stu-h-fem-01';
    const oldBed = 'bed-a101-1';
    const targetBed = 'bed-a101-3'; // Unoccupied bed in Room 101
    const wardenStaffId = 'stf-warden-99';

    // 1. Initial permanent allocation on old bed
    await service.acquireBedLock(studentId, oldBed);
    const alloc = await service.confirmAllocation(studentId, oldBed, 'PAY-REALLOC-01');

    // 2. Warden relocates student to targetBed
    const reassignResult = await service.reassignStudentBed(
      studentId,
      targetBed,
      wardenStaffId,
      'Relocated due to window repair'
    );

    expect(reassignResult.success).toBe(true);
    expect(reassignResult.oldBedspaceId).toBe(oldBed);
    expect(reassignResult.newBedspaceId).toBe(targetBed);

    // Old bed must be free
    const oldBedState = await db.queryFirst<{ is_occupied: number }>(
      `SELECT is_occupied FROM hostel_bedspaces WHERE id = ?`,
      [oldBed]
    );
    expect(oldBedState?.is_occupied).toBe(0);

    // Target bed must be occupied
    const targetBedState = await db.queryFirst<{ is_occupied: number }>(
      `SELECT is_occupied FROM hostel_bedspaces WHERE id = ?`,
      [targetBed]
    );
    expect(targetBedState?.is_occupied).toBe(1);

    // 3. Warden revokes allocation
    const revokeResult = await service.revokeAllocation(
      alloc.allocationId,
      wardenStaffId,
      'Disciplinary expulsion from hall'
    );

    expect(revokeResult.success).toBe(true);
    expect(revokeResult.freedBedspaceId).toBe(targetBed);

    // Target bed must now be freed
    const vacatedBedState = await db.queryFirst<{ is_occupied: number }>(
      `SELECT is_occupied FROM hostel_bedspaces WHERE id = ?`,
      [targetBed]
    );
    expect(vacatedBedState?.is_occupied).toBe(0);
  });
});
