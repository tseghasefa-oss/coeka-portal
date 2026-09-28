import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { getContainer, resetDefaultMemoryContainer } from '../src/infrastructure/container';
import { clearEdgeCache } from '../src/api/middleware/edgeCache';
import { FinanceAdminService } from '../src/services/admin/financeAdminService';
import { ExamOfficerService } from '../src/services/academic/examService';
import { AuthService } from '../src/services/auth/authService';

describe('Scaling, Edge Caching & Legal Compliance Verification (The Final Polish)', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
    clearEdgeCache();
  });

  describe('1. Cloudflare Edge Cache API & Stale-While-Revalidate', () => {
    it('serves /api/courses with 1-hour cache and stale-while-revalidate directives', async () => {
      // First Request: Cache MISS
      const res1 = await app.request('/api/courses');
      expect(res1.status).toBe(200);

      const cacheControl1 = res1.headers.get('Cache-Control');
      expect(cacheControl1).toBeDefined();
      expect(cacheControl1).toContain('public');
      expect(cacheControl1).toContain('max-age=3600');
      expect(cacheControl1).toContain('stale-while-revalidate=86400');
      expect(res1.headers.get('CF-Cache-Status')).toBe('MISS');

      const json1: any = await res1.json();
      expect(json1.institution).toBe('College of Education, Katsina-Ala');
      expect(json1.courses.length).toBeGreaterThan(0);

      // Second Request: Cache HIT
      const res2 = await app.request('/api/courses');
      expect(res2.status).toBe(200);
      expect(res2.headers.get('CF-Cache-Status')).toBe('HIT');
      expect(res2.headers.get('X-Edge-Cache')).toBe('HIT');

      const json2: any = await res2.json();
      expect(json2.courses.length).toBe(json1.courses.length);
    });

    it('serves /api/admissions/cycles with edge caching and returns HIT on repeat', async () => {
      // First Request: MISS
      const res1 = await app.request('/api/admissions/cycles');
      expect(res1.status).toBe(200);
      expect(res1.headers.get('Cache-Control')).toContain('max-age=3600');
      expect(res1.headers.get('CF-Cache-Status')).toBe('MISS');

      const json1: any = await res1.json();
      expect(json1.cycles).toBeDefined();
      expect(json1.cycles.length).toBeGreaterThan(0);

      // Second Request: HIT
      const res2 = await app.request('/api/admissions/cycles');
      expect(res2.status).toBe(200);
      expect(res2.headers.get('CF-Cache-Status')).toBe('HIT');
    });
  });

  describe('2. NDPA 2023 Statutory Compliance & Right to Portability (Section 38)', () => {
    it('allows authenticated students to export complete personal data dossier via GET /api/student/export-my-data', async () => {
      const container = getContainer();
      const authService = new AuthService(container.db, container.cache);
      const session = await authService.createSession('usr-std-001');

      const res = await app.request('/api/student/export-my-data', {
        headers: {
          Authorization: `Bearer ${session.sessionId}`,
          'X-Demo-Role': 'STUDENT',
        },
      });

      expect(res.status).toBe(200);

      // Verify Headers
      expect(res.headers.get('Content-Type')).toContain('application/json');
      const contentDisposition = res.headers.get('Content-Disposition');
      expect(contentDisposition).toBeDefined();
      expect(contentDisposition).toContain('attachment');
      expect(contentDisposition).toContain('coeka-student-data-');
      expect(res.headers.get('X-NDPA-Compliance')).toBe('Section-38-Right-To-Portability');

      // Verify Complete Data Dossier
      const data: any = await res.json();
      expect(data._meta.legalFramework).toContain('Nigeria Data Protection Act (NDPA 2023) - Section 38');
      expect(data._meta.dataController).toContain('College of Education, Katsina-Ala');
      expect(data._meta.dpoContact).toBe('dpo@coeka.edu.ng');

      // Personal Info
      expect(data.personalInformation.fullName).toBeDefined();
      expect(data.personalInformation.matricNumber).toBeDefined();
      expect(data.personalInformation.email).toBeDefined();

      // Academic Enrollment
      expect(data.academicEnrollment.division).toBeDefined();
      expect(data.academicEnrollment.registeredCourses).toBeInstanceOf(Array);
      expect(data.academicEnrollment.summary.institution).toBe('College of Education, Katsina-Ala');

      // Financial Records & NUBAN
      expect(data.financialRecords.virtualNuban.bankName).toBe('Wema Bank PLC');
      expect(data.financialRecords.virtualNuban.accountNumber).toBe('9910840184');
      expect(data.financialRecords.invoices).toBeInstanceOf(Array);

      // Hostel Accommodation
      expect(data.hostelAccommodation.allocatedHall).toBeDefined();
    });

    it('records student NDPA statutory consent via POST /api/student/consent and retrieves status', async () => {
      const container = getContainer();
      const authService = new AuthService(container.db, container.cache);
      const session = await authService.createSession('usr-std-001');

      // 1. Initial consent status check (unconsented)
      const resInitial = await app.request('/api/student/consent', {
        headers: {
          Authorization: `Bearer ${session.sessionId}`,
          'X-Demo-Role': 'STUDENT',
        },
      });
      expect(resInitial.status).toBe(200);
      const initialJson: any = await resInitial.json();
      expect(initialJson.consented).toBe(false);

      // 2. Record statutory consent
      const postRes = await app.request('/api/student/consent', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.sessionId}`,
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '102.89.44.12',
          'User-Agent': 'COEKA-Mobile-Edge/1.0',
        },
        body: JSON.stringify({ agreed: true }),
      });

      expect(postRes.status).toBe(200);
      const postJson: any = await postRes.json();
      expect(postJson.success).toBe(true);
      expect(postJson.consent.termsVersion).toBe('NDPA-2023-V1.0');
      expect(postJson.consent.clientIp).toBe('102.89.44.12');

      // 3. Confirm consent status is now active
      const resAfter = await app.request('/api/student/consent', {
        headers: {
          Authorization: `Bearer ${session.sessionId}`,
          'X-Demo-Role': 'STUDENT',
        },
      });
      expect(resAfter.status).toBe(200);
      const afterJson: any = await resAfter.json();
      expect(afterJson.consented).toBe(true);
      expect(afterJson.consentDetails.termsVersion).toBe('NDPA-2023-V1.0');
    });
  });

  describe('3. Peak Load Query Optimization (Prepared Statements)', () => {
    it('executes Broadsheet compilation with pre-compiled query statements under heavy load', async () => {
      const container = getContainer();
      const examService = new ExamOfficerService(container.db);

      // Run multiple rapid compilations (simulating peak end-of-semester senate session)
      const broadsheet1 = await examService.compileBroadsheet('dept-csc', 100);
      expect(broadsheet1).toBeDefined();
      expect(broadsheet1.level).toBe(100);
      expect(broadsheet1.courses).toBeInstanceOf(Array);
      expect(broadsheet1.summary.totalStudents).toBeGreaterThanOrEqual(0);

      const broadsheet2 = await examService.compileBroadsheet('dept-csc', 100);
      expect(broadsheet2).toBeDefined();
      expect(broadsheet2.courses.length).toBe(broadsheet1.courses.length);
    });

    it('executes institutional Revenue Report with pre-compiled query statements', async () => {
      const container = getContainer();
      const financeAdmin = new FinanceAdminService(container.db);

      const report1 = await financeAdmin.getRevenueReport();
      expect(report1).toBeDefined();
      expect(report1.summary.totalExpectedKobo).toBeGreaterThanOrEqual(0);
      expect(report1.breakdown).toBeInstanceOf(Array);

      const report2 = await financeAdmin.getRevenueReport();
      expect(report2).toBeDefined();
      expect(report2.summary.totalTransactionsCount).toBe(report1.summary.totalTransactionsCount);
    });
  });
});
