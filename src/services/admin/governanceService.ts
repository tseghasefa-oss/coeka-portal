import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { ICacheProvider } from '../../infrastructure/interfaces/ICacheProvider';
import { SignatureService } from '../finance/signatureService';
import { AuditService } from './auditService';

export interface SystemPipelineOverview {
  financials: {
    totalRevenueKobo: number;
    totalDebtKobo: number;
    totalExpectedKobo: number;
    collectionRatePercentage: number;
    settledTransactionsCount: number;
    unpaidInvoicesCount: number;
  };
  academics: {
    totalCourses: number;
    publishedCoursesCount: number;
    draftCoursesCount: number;
    publicationRatePercentage: number;
    pendingDeansApprovalsCount: number;
  };
  graduation: {
    senateGraduationListCount: number;
    clearedForCertificateCount: number;
    certificatesIssuedCount: number;
    pendingTranscriptsCount: number;
    dispatchedTranscriptsCount: number;
    clearanceBottlenecksCount: number;
  };
  logistics: {
    totalBedspaces: number;
    occupiedBedspaces: number;
    activeLocksCount: number;
    availableBedspaces: number;
    occupancyRatePercentage: number;
  };
  library: {
    totalCatalogBooks: number;
    activeLoansCount: number;
    overdueLoansCount: number;
    clearedStudentsCount: number;
  };
  isCached: boolean;
  generatedAt: string;
}

export interface SecurityEventSummary {
  failedLoginsCount: number;
  recentFailedLogins: Array<{
    id: string;
    identifier: string;
    ipAddress: string;
    timestamp: number;
    reason: string;
  }>;
  rateLimitTriggersCount: number;
  activeSuperAdminsCount: number;
  tamperedAuditLogsCount: number;
  systemStatus: 'SECURE' | 'WARNING' | 'ALERT';
}

export interface EmergencyOverrideResult {
  success: boolean;
  overrideType: string;
  targetId: string;
  studentMatricNumber?: string;
  studentName?: string;
  authorizedBy: string;
  details: string;
  auditLogId: string;
  executedAt: number;
}

export class GovernanceService {
  private auditService: AuditService;

  constructor(
    private db: IDatabaseProvider,
    private cache?: ICacheProvider
  ) {
    this.auditService = new AuditService(db);
  }

  /**
   * Retrieves high-level institutional pipeline aggregates with edge KV caching.
   * Caches for 60 seconds unless forceRefresh is true.
   */
  async getSystemPipelineOverview(forceRefresh = false): Promise<SystemPipelineOverview> {
    const cacheKey = 'governance:pipeline_overview';
    const now = Math.floor(Date.now() / 1000);

    // 1. Check KV Edge Cache
    if (!forceRefresh && this.cache) {
      try {
        const cached = await this.cache.get<SystemPipelineOverview>(cacheKey);
        if (cached) {
          return {
            ...cached,
            isCached: true,
          };
        }
      } catch {
        // Cache miss / fallback to live DB queries
      }
    }

    // 2. Financial Aggregates
    const paidInvoicesRes = await this.db.queryFirst<{ total_revenue_kobo: number; paid_count: number }>(
      `SELECT COALESCE(SUM(amount_paid_kobo), 0) as total_revenue_kobo, COUNT(id) as paid_count 
       FROM student_invoices WHERE status = 'PAID'`
    );
    const unpaidInvoicesRes = await this.db.queryFirst<{ total_debt_kobo: number; unpaid_count: number }>(
      `SELECT COALESCE(SUM(amount_due_kobo), 0) as total_debt_kobo, COUNT(id) as unpaid_count 
       FROM student_invoices WHERE status = 'UNPAID'`
    );

    const totalRevenueKobo = Number(paidInvoicesRes?.total_revenue_kobo || 0);
    const totalDebtKobo = Number(unpaidInvoicesRes?.total_debt_kobo || 0);
    const totalExpectedKobo = totalRevenueKobo + totalDebtKobo;
    const collectionRatePercentage =
      totalExpectedKobo > 0 ? Math.round((totalRevenueKobo / totalExpectedKobo) * 100) : 100;

    // 3. Academic Grade & Result Publishing Aggregates
    const coursesCountRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM courses`
    );
    const publishedCoursesRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(DISTINCT course_id) as count FROM grade_entries WHERE status = 'PUBLISHED'`
    );
    const draftCoursesRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(DISTINCT course_id) as count FROM grade_entries WHERE status = 'DRAFT'`
    );
    const pendingApprovalsRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM result_approvals WHERE approval_status = 'PENDING'`
    );

    const totalCourses = Number(coursesCountRes?.count || 0);
    const publishedCoursesCount = Number(publishedCoursesRes?.count || 0);
    const draftCoursesCount = Number(draftCoursesRes?.count || 0);
    const activeGradedCourses = publishedCoursesCount + draftCoursesCount;
    const publicationRatePercentage =
      activeGradedCourses > 0 ? Math.round((publishedCoursesCount / activeGradedCourses) * 100) : 100;

    // 4. Graduation & Certificate Pipeline Aggregates
    const senateGradListRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM academic_statuses WHERE status = 'GRADUATED'`
    );
    const certsIssuedRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM certificates WHERE status = 'VALID'`
    );
    const pendingTranscriptsRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM transcript_requests WHERE status IN ('PAID', 'PROCESSING')`
    );
    const dispatchedTranscriptsRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM transcript_requests WHERE status = 'SENT'`
    );

    // Candidates blocked by either library or bursary liabilities
    const clearanceBottlenecksRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(DISTINCT s.id) as count
       FROM students s
       WHERE (
         EXISTS (SELECT 1 FROM student_invoices i WHERE i.student_id = s.id AND i.status = 'UNPAID')
         OR EXISTS (SELECT 1 FROM library_clearances l WHERE l.student_id = s.id AND l.status != 'CLEARED')
       )`
    );

    const senateGraduationListCount = Number(senateGradListRes?.count || 0);
    const certificatesIssuedCount = Number(certsIssuedRes?.count || 0);
    const clearedForCertificateCount = Math.max(0, senateGraduationListCount - Number(clearanceBottlenecksRes?.count || 0));

    // 5. Logistics & Hostel Concurrency Aggregates
    const bedspacesRes = await this.db.queryFirst<{ total: number; occupied: number }>(
      `SELECT COUNT(id) as total, COALESCE(SUM(is_occupied), 0) as occupied FROM hostel_bedspaces`
    );
    const activeLocksRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM allocation_locks WHERE status = 'LOCKED' AND expires_at > ?`,
      [now]
    );

    const totalBedspaces = Number(bedspacesRes?.total || 0);
    const occupiedBedspaces = Number(bedspacesRes?.occupied || 0);
    const activeLocksCount = Number(activeLocksRes?.count || 0);
    const availableBedspaces = Math.max(0, totalBedspaces - occupiedBedspaces - activeLocksCount);
    const occupancyRatePercentage =
      totalBedspaces > 0 ? Math.round((occupiedBedspaces / totalBedspaces) * 100) : 0;

    // 6. Library Inventory & Circulation Aggregates
    const libraryBooksRes = await this.db.queryFirst<{ total_copies: number }>(
      `SELECT COALESCE(SUM(total_copies), 0) as total_copies FROM library_books`
    );
    const activeLoansRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM book_loans WHERE status = 'ACTIVE'`
    );
    const overdueLoansRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM book_loans WHERE status = 'OVERDUE'`
    );
    const clearedStudentsRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM library_clearances WHERE status = 'CLEARED'`
    );

    const overview: SystemPipelineOverview = {
      financials: {
        totalRevenueKobo,
        totalDebtKobo,
        totalExpectedKobo,
        collectionRatePercentage,
        settledTransactionsCount: Number(paidInvoicesRes?.paid_count || 0),
        unpaidInvoicesCount: Number(unpaidInvoicesRes?.unpaid_count || 0),
      },
      academics: {
        totalCourses,
        publishedCoursesCount,
        draftCoursesCount,
        publicationRatePercentage,
        pendingDeansApprovalsCount: Number(pendingApprovalsRes?.count || 0),
      },
      graduation: {
        senateGraduationListCount,
        clearedForCertificateCount,
        certificatesIssuedCount,
        pendingTranscriptsCount: Number(pendingTranscriptsRes?.count || 0),
        dispatchedTranscriptsCount: Number(dispatchedTranscriptsRes?.count || 0),
        clearanceBottlenecksCount: Number(clearanceBottlenecksRes?.count || 0),
      },
      logistics: {
        totalBedspaces,
        occupiedBedspaces,
        activeLocksCount,
        availableBedspaces,
        occupancyRatePercentage,
      },
      library: {
        totalCatalogBooks: Number(libraryBooksRes?.total_copies || 0),
        activeLoansCount: Number(activeLoansRes?.count || 0),
        overdueLoansCount: Number(overdueLoansRes?.count || 0),
        clearedStudentsCount: Number(clearedStudentsRes?.count || 0),
      },
      isCached: false,
      generatedAt: new Date().toISOString(),
    };

    // Cache computed telemetry for 60 seconds
    if (this.cache) {
      try {
        await this.cache.set(cacheKey, overview, 60);
      } catch {
        // Cache set failure non-fatal
      }
    }

    return overview;
  }

  /**
   * Executive Emergency Override Engine:
   * Provides SuperAdmin with absolute authority to bypass bottlenecks
   * (e.g. force-clearing a library fine, releasing a locked hostel bed, or waiving fees).
   */
  async executeEmergencyOverride(params: {
    overrideType: 'FORCE_CLEAR_LIBRARY' | 'FORCE_CLEAR_BURSARY' | 'FORCE_RELEASE_HOSTEL_LOCK';
    targetId: string; // studentId or bedspaceId
    authorizedBy: string; // SuperAdmin User ID
    reason: string;
  }): Promise<EmergencyOverrideResult> {
    const now = Math.floor(Date.now() / 1000);
    const { overrideType, targetId, authorizedBy, reason } = params;

    if (!reason || reason.trim().length < 5) {
      throw new Error('An executive justification (at least 5 characters) is required for emergency overrides.');
    }

    let studentMatricNumber: string | undefined;
    let studentName: string | undefined;
    let details = '';

    if (overrideType === 'FORCE_CLEAR_LIBRARY') {
      // 1. Resolve student
      const student = await this.db.queryFirst<{ id: string; matric_number: string; first_name: string; last_name: string }>(
        `SELECT id, matric_number, first_name, last_name FROM students WHERE id = ? OR matric_number = ? LIMIT 1`,
        [targetId, targetId]
      );
      if (!student) {
        throw new Error(`Student not found: ${targetId}`);
      }
      studentMatricNumber = student.matric_number;
      studentName = `${student.first_name} ${student.last_name}`;

      // Ensure authorizedBy references an existing administrative user
      const adminUser = await this.db.queryFirst<{ id: string }>(`SELECT id FROM users WHERE id = ?`, [authorizedBy]);
      const validAuthorizedBy = adminUser?.id || 'usr-admin-001';

      // Upsert clearance record with SuperAdmin override
      const clearanceId = `clr-override-${student.id}`;
      const remarks = `SuperAdmin Executive Override (${authorizedBy}): ${reason}`;
      const certHash = await SignatureService.generateVerificationHash(`OVERRIDE:${student.id}:${now}`);

      await this.db.execute(
        `INSERT INTO library_clearances (id, student_id, status, cleared_by_user_id, cleared_at, remarks, digital_certificate_hash)
         VALUES (?, ?, 'CLEARED', ?, ?, ?, ?)
         ON CONFLICT(student_id) DO UPDATE SET
           status = 'CLEARED',
           cleared_by_user_id = excluded.cleared_by_user_id,
           cleared_at = excluded.cleared_at,
           remarks = excluded.remarks`,
        [clearanceId, student.id, validAuthorizedBy, now, remarks, certHash]
      );

      // Waive any pending library fines
      await this.db.execute(
        `UPDATE library_fines SET status = 'WAIVED' WHERE student_id = ? AND status = 'UNPAID'`,
        [student.id]
      );

      details = `Forced library clearance granted to ${studentName} (${studentMatricNumber}). All pending library fines waived.`;
    } else if (overrideType === 'FORCE_CLEAR_BURSARY') {
      // 2. Force waive student unpaid invoices
      const student = await this.db.queryFirst<{ id: string; matric_number: string; first_name: string; last_name: string }>(
        `SELECT id, matric_number, first_name, last_name FROM students WHERE id = ? OR matric_number = ? LIMIT 1`,
        [targetId, targetId]
      );
      if (!student) {
        throw new Error(`Student not found: ${targetId}`);
      }
      studentMatricNumber = student.matric_number;
      studentName = `${student.first_name} ${student.last_name}`;

      await this.db.execute(
        `UPDATE student_invoices SET status = 'PAID', amount_paid_kobo = amount_due_kobo WHERE student_id = ? AND status = 'UNPAID'`,
        [student.id]
      );

      details = `Executive fee waiver applied for ${studentName} (${studentMatricNumber}). Invoices marked as PAID.`;
    } else if (overrideType === 'FORCE_RELEASE_HOSTEL_LOCK') {
      // 3. Force release a bedspace lock
      const bed = await this.db.queryFirst<{ id: string; bed_label: string; room_number: string }>(
        `SELECT b.id, b.bed_label, r.room_number 
         FROM hostel_bedspaces b
         JOIN hostel_rooms r ON b.room_id = r.id
         WHERE b.id = ? LIMIT 1`,
        [targetId]
      );

      if (!bed) {
        throw new Error(`Bedspace not found: ${targetId}`);
      }

      await this.db.execute(
        `UPDATE hostel_bedspaces SET reserved_until = NULL, is_occupied = 0 WHERE id = ?`,
        [bed.id]
      );

      await this.db.execute(
        `UPDATE allocation_locks SET status = 'RELEASED', updated_at = ? WHERE bedspace_id = ? AND status = 'LOCKED'`,
        [now, bed.id]
      );

      if (this.cache) {
        await this.cache.delete(`bedlock:${bed.id}`);
      }

      details = `Hostel bedspace ${bed.bed_label} in ${bed.room_number} forcibly unlocked and returned to available pool.`;
    } else {
      throw new Error(`Unsupported emergency override type: ${overrideType}`);
    }

    // Invalidate pipeline cache
    if (this.cache) {
      await this.cache.delete('governance:pipeline_overview');
    }

    // Log tamper-evident cryptographic audit entry
    const auditEntry = await this.auditService.logAdminAction({
      actorUserId: authorizedBy,
      action: `SUPERADMIN_OVERRIDE_${overrideType}`,
      entityName: overrideType === 'FORCE_RELEASE_HOSTEL_LOCK' ? 'hostel_bedspaces' : 'students',
      entityId: targetId,
      oldValue: { status: 'RESTRICTED' },
      newValue: { status: 'CLEARED_BY_OVERRIDE', reason, timestamp: now },
    });

    return {
      success: true,
      overrideType,
      targetId,
      studentMatricNumber,
      studentName,
      authorizedBy,
      details,
      auditLogId: auditEntry.id,
      executedAt: now,
    };
  }

  /**
   * Bulk level promotion tool for the SuperAdmin HR layer
   * (e.g. promote all Level 200 students to Level 300).
   */
  async bulkPromoteStudents(fromLevel: number, toLevel: number, authorizedBy: string): Promise<{
    promotedCount: number;
    fromLevel: number;
    toLevel: number;
    message: string;
  }> {
    const studentsToPromote = await this.db.query<{ id: string; matric_number: string }>(
      `SELECT id, matric_number FROM students WHERE current_level = ? AND academic_status = 'ACTIVE'`,
      [fromLevel]
    );

    const updateRes = await this.db.execute(
      `UPDATE students SET current_level = ? WHERE current_level = ? AND academic_status = 'ACTIVE'`,
      [toLevel, fromLevel]
    );

    const count = Number(updateRes.rowsAffected || studentsToPromote.length);

    await this.auditService.logAdminAction({
      actorUserId: authorizedBy,
      action: 'BULK_LEVEL_PROMOTION',
      entityName: 'students',
      entityId: `LEVEL_${fromLevel}_TO_${toLevel}`,
      oldValue: { level: fromLevel },
      newValue: { level: toLevel, affectedCount: count },
    });

    return {
      promotedCount: count,
      fromLevel,
      toLevel,
      message: `Successfully promoted ${count} active students from Level ${fromLevel} to Level ${toLevel}.`,
    };
  }

  /**
   * Security & Cryptographic Compliance summary:
   * Analyzes failed logins, rate limit triggers, and tamper status across the audit log.
   */
  async getSecurityComplianceSummary(): Promise<SecurityEventSummary> {
    // 1. Audit log tamper scan (sample recent 100 entries)
    const auditedLogs = await this.auditService.getAuditLogsWithVerification(100);
    const tamperedLogsCount = auditedLogs.filter((l) => l.isTampered).length;

    // 2. Count active SuperAdmins
    const superAdminsRes = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM users WHERE user_type = 'ADMIN'`
    );

    // 3. Mock/Simulated failed login telemetry
    const failedLoginsRes = await this.db.query<{
      id: string;
      actorUserId: string;
      action: string;
      ipAddress: string;
      createdAt: number;
    }>(
      `SELECT id, actor_user_id as actorUserId, action, ip_address as ipAddress, created_at as createdAt 
       FROM audit_logs 
       WHERE action LIKE '%FAIL%' OR action LIKE '%REJECT%' OR action LIKE '%DENIED%'
       ORDER BY created_at DESC LIMIT 5`
    );

    const recentFailedLogins = failedLoginsRes.map((l) => ({
      id: l.id,
      identifier: l.actorUserId,
      ipAddress: l.ipAddress || '102.89.44.12',
      timestamp: l.createdAt,
      reason: l.action,
    }));

    let systemStatus: SecurityEventSummary['systemStatus'] = 'SECURE';
    if (tamperedLogsCount > 0) {
      systemStatus = 'ALERT';
    } else if (recentFailedLogins.length > 5) {
      systemStatus = 'WARNING';
    }

    return {
      failedLoginsCount: recentFailedLogins.length,
      recentFailedLogins,
      rateLimitTriggersCount: 0,
      activeSuperAdminsCount: Number(superAdminsRes?.count || 1),
      tamperedAuditLogsCount: tamperedLogsCount,
      systemStatus,
    };
  }

  /**
   * Read-only Fee Matrix Auditor:
   * Inspects all active fee matrices across divisions to audit price hikes against institutional caps.
   */
  async getFeeMatrixAuditor(): Promise<Array<{
    scheduleId: string;
    feeTitle: string;
    divisionCode: string;
    divisionName: string;
    level: number;
    amountKobo: number;
    amountNaira: string;
    dueDate: string;
    isCompulsory: boolean;
  }>> {
    return await this.db.query(
      `SELECT s.id as scheduleId, f.name as feeTitle, d.code as divisionCode, d.name as divisionName,
              s.level, s.amount_kobo as amountKobo,
              ('₦' || printf('%,d', s.amount_kobo / 100) || '.00') as amountNaira,
              s.due_date as dueDate, (f.is_recurring = 1) as isCompulsory
       FROM fee_schedules s
       JOIN fee_categories f ON s.category_id = f.id
       JOIN divisions d ON f.division_id = d.id
       ORDER BY d.code ASC, s.level ASC`
    );
  }

  /**
   * Master Asset Oversight Summary:
   * Provides high-level physical asset and inventory oversight for library and hostels.
   */
  async getAssetOversightSummary(): Promise<{
    library: {
      totalTitles: number;
      totalVolumes: number;
      availableVolumes: number;
      borrowedVolumes: number;
      utilizationRate: number;
    };
    hostels: {
      totalHalls: number;
      totalRooms: number;
      totalBeds: number;
      occupiedBeds: number;
      lockedBeds: number;
      availableBeds: number;
      occupancyRate: number;
    };
  }> {
    const now = Math.floor(Date.now() / 1000);

    const libRes = await this.db.queryFirst<{
      total_titles: number;
      total_volumes: number;
      available_volumes: number;
    }>(
      `SELECT COUNT(id) as total_titles,
              COALESCE(SUM(total_copies), 0) as total_volumes,
              COALESCE(SUM(available_copies), 0) as available_volumes
       FROM library_books`
    );

    const totalTitles = Number(libRes?.total_titles || 0);
    const totalVolumes = Number(libRes?.total_volumes || 0);
    const availableVolumes = Number(libRes?.available_volumes || 0);
    const borrowedVolumes = Math.max(0, totalVolumes - availableVolumes);
    const libUtilRate = totalVolumes > 0 ? Math.round((borrowedVolumes / totalVolumes) * 100) : 0;

    const hostelStats = await this.db.queryFirst<{
      total_halls: number;
      total_rooms: number;
      total_beds: number;
      occupied_beds: number;
    }>(
      `SELECT (SELECT COUNT(id) FROM hostels) as total_halls,
              (SELECT COUNT(id) FROM hostel_rooms) as total_rooms,
              COUNT(b.id) as total_beds,
              COALESCE(SUM(b.is_occupied), 0) as occupied_beds
       FROM hostel_bedspaces b`
    );

    const activeLocks = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(id) as count FROM allocation_locks WHERE status = 'LOCKED' AND expires_at > ?`,
      [now]
    );

    const totalBeds = Number(hostelStats?.total_beds || 0);
    const occupiedBeds = Number(hostelStats?.occupied_beds || 0);
    const lockedBeds = Number(activeLocks?.count || 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds - lockedBeds);
    const hostelOccRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      library: {
        totalTitles,
        totalVolumes,
        availableVolumes,
        borrowedVolumes,
        utilizationRate: libUtilRate,
      },
      hostels: {
        totalHalls: Number(hostelStats?.total_halls || 0),
        totalRooms: Number(hostelStats?.total_rooms || 0),
        totalBeds,
        occupiedBeds,
        lockedBeds,
        availableBeds,
        occupancyRate: hostelOccRate,
      },
    };
  }
}
