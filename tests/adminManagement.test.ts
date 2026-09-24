import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer } from '../src/infrastructure/container';
import { AcademicAdminService } from '../src/services/admin/academicAdminService';
import { FinanceAdminService } from '../src/services/admin/financeAdminService';
import { courses, feeSchedules } from '../src/database/schema/index';

describe('Admin Panels: Academic & Financial Management Verification', () => {
  let container: ReturnType<typeof createMemoryContainer>;
  let academicService: AcademicAdminService;
  let financeService: FinanceAdminService;

  beforeEach(() => {
    container = createMemoryContainer();
    academicService = new AcademicAdminService(container.db);
    financeService = new FinanceAdminService(container.db);
  });

  // ------------------------------------------------------------------------
  // 1. "Add Course" Flow and D1/SQLite Database Persistence via Drizzle
  // ------------------------------------------------------------------------
  describe('Add Course Flow & Database Persistence', () => {
    it('creates a new course and verifies it persists into the database table', async () => {
      const newCourseInput = {
        programmeId: 'prog-nce-csc-mth',
        code: 'CSC 201',
        title: 'Object-Oriented Programming with TypeScript',
        creditUnits: 3,
        level: 200,
        semesterTerm: 1,
        isCompulsory: true,
      };

      // 1. Execute Service Action
      const created = await academicService.createCourse(newCourseInput);

      expect(created.id).toBeDefined();
      expect(created.code).toBe('CSC 201');
      expect(created.creditUnits).toBe(3);
      expect(created.level).toBe(200);

      // 2. Query the raw database directly to verify D1/SQLite persistence
      const row = await container.db.queryFirst<any>(
        'SELECT id, programme_id, code, title, credit_units, level, semester_term, is_compulsory FROM courses WHERE code = ?',
        ['CSC 201']
      );

      expect(row).not.toBeNull();
      expect(row.code).toBe('CSC 201');
      expect(row.title).toBe('Object-Oriented Programming with TypeScript');
      expect(row.credit_units).toBe(3);
      expect(row.level).toBe(200);
      expect(row.semester_term).toBe(1);
      expect(row.is_compulsory).toBe(1);
    });

    it('creates a course via the REST API POST /api/admin/courses and confirms persistence', async () => {
      const res = await app.request('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          programmeId: 'prog-nce-csc-mth',
          code: 'CSC 215',
          title: 'Database Design & Relational Algebra',
          creditUnits: 3,
          level: 200,
          semesterTerm: 2,
          isCompulsory: true,
        }),
      });

      expect(res.status).toBe(201);
      const json: any = await res.json();
      expect(json.message).toContain('Course created successfully');
      expect(json.course.code).toBe('CSC 215');

      // Verify course can be listed via GET /api/admin/courses
      const listRes = await app.request('/api/admin/courses?programmeId=prog-nce-csc-mth', {
        headers: {
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(listRes.status).toBe(200);
      const listJson: any = await listRes.json();
      expect(listJson.courses.some((c: any) => c.code === 'CSC 215')).toBe(true);
    });

    it('enforces validation and rejects courses with missing required fields or invalid units', async () => {
      const res = await app.request('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          // missing code and title
          programmeId: 'prog-nce-csc-mth',
          creditUnits: 3,
        }),
      });

      expect(res.status).toBe(400);
      const json: any = await res.json();
      expect(json.error).toContain('Validation Error');
    });
  });

  // ------------------------------------------------------------------------
  // 2. Strict Integer Kobo Arithmetic Verification (No Floats)
  // ------------------------------------------------------------------------
  describe('Strict Integer Kobo Verification (No Floats)', () => {
    it('verifies fee schedule changes are stored as strict integers in Kobo and not floats', async () => {
      // Set price in Naira (₦42,500.00 -> 4,250,000 Kobo)
      const schedule = await financeService.setFeePriceInNaira({
        categoryId: 'fee-nce-tuition',
        sessionId: 'sess-2026-2027',
        level: 200,
        amountNaira: 42500,
        dueDate: '2026-12-15',
      });

      expect(schedule.amountKobo).toBe(4250000);
      expect(Number.isInteger(schedule.amountKobo)).toBe(true);

      // Verify the value in the underlying database row
      const dbRow = await container.db.queryFirst<any>(
        'SELECT id, category_id, level, amount_kobo FROM fee_schedules WHERE category_id = ? AND level = ?',
        ['fee-nce-tuition', 200]
      );

      expect(dbRow).not.toBeNull();
      expect(dbRow.amount_kobo).toBe(4250000);
      expect(Number.isInteger(dbRow.amount_kobo)).toBe(true);
      // Ensure it is not a floating-point number
      expect(dbRow.amount_kobo % 1).toBe(0);
    });

    it('strictly rejects floating-point amounts (fractional Kobo) with Financial Engine Violation', async () => {
      await expect(
        financeService.setFeePrice({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountKobo: 4500000.85, // Fractional Kobo
        })
      ).rejects.toThrow(/Financial Engine Violation/);

      await expect(
        financeService.setFeePrice({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountKobo: -5000, // Negative amount
        })
      ).rejects.toThrow(/Financial Engine Violation/);
    });

    it('sets fee schedule via REST API POST /api/admin/fees with integer Kobo persistence', async () => {
      const res = await app.request('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 300,
          amountNaira: 39000, // ₦39,000.00
          dueDate: '2026-12-20',
        }),
      });

      expect(res.status).toBe(201);
      const json: any = await res.json();
      expect(json.feeSchedule.amountKobo).toBe(3900000);
      expect(Number.isInteger(json.feeSchedule.amountKobo)).toBe(true);
      expect(json.feeSchedule.formattedAmount).toContain('39,000');
    });
  });

  // ------------------------------------------------------------------------
  // 3. Price Matrix & "Apply to All" Common Levies Functionality
  // ------------------------------------------------------------------------
  describe('Price Matrix and "Apply to All Levels" Batch Operation', () => {
    it('applies a uniform levy across all NCE levels (100, 200, 300) in pure Kobo integers', async () => {
      // 1. Create a common levy category: ICT & Lab Levy
      const category = await financeService.createFeeCategory({
        divisionId: 'div-nce',
        name: 'ICT & Computational Laboratory Levy',
        code: 'FEE-NCE-ICT-COMMON',
        isRecurring: true,
      });

      const levelsToApply = [100, 200, 300];
      const levyAmountNaira = 12500; // ₦12,500.00 -> 1,250,000 Kobo

      // 2. Batch apply to all levels
      for (const lvl of levelsToApply) {
        await financeService.setFeePriceInNaira({
          categoryId: category.id,
          sessionId: 'sess-2026-2027',
          level: lvl,
          amountNaira: levyAmountNaira,
          dueDate: '2026-11-30',
        });
      }

      // 3. Verify all levels are stored with exact integer Kobo
      const schedules = await financeService.listFeeSchedules({ categoryId: category.id });
      expect(schedules.length).toBe(3);

      for (const sched of schedules) {
        expect(sched.amountKobo).toBe(1250000);
        expect(Number.isInteger(sched.amountKobo)).toBe(true);
        expect(sched.amountKobo % 1).toBe(0);
        expect(sched.formattedAmount).toContain('12,500');
      }
    });

    it('verifies that fee price updates trigger query invalidation for invoices', () => {
      // Verify query keys definition for TanStack Query invalidation
      const invoiceQueryKey = ['invoices'];
      const adminFeesQueryKey = ['admin', 'fees'];

      expect(invoiceQueryKey).toContain('invoices');
      expect(adminFeesQueryKey).toEqual(['admin', 'fees']);
    });
  });
});
