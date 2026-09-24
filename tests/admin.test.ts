import { describe, it, expect } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer } from '../src/infrastructure/container';
import { FinanceAdminService } from '../src/services/admin/financeAdminService';
import { AcademicAdminService } from '../src/services/admin/academicAdminService';
import { SystemAdminService } from '../src/services/admin/systemAdminService';

describe('Master Admin Area - RBAC, Academic, Finance & System Logic', () => {
  // -------------------------------------------------------------
  // 1. RBAC & Security Enforcement Verification
  // -------------------------------------------------------------
  describe('RBAC Middleware & Super Admin Protection', () => {
    it('blocks unauthenticated requests from accessing admin fee endpoints (401)', async () => {
      const res = await app.request('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountNaira: 50000,
        }),
      });

      expect(res.status).toBe(401);
      const json: any = await res.json();
      expect(json.error).toContain('Unauthorized');
    });

    it('blocks non-admin users (e.g. STUDENT) from changing fee prices (403 Forbidden)', async () => {
      const res = await app.request('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountNaira: 50000,
        }),
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('STUDENT');
    });

    it('blocks STAFF / LECTURER from modifying fee prices (403 Forbidden)', async () => {
      const res = await app.request('/api/admin/fees/fs-101', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STAFF',
        },
        body: JSON.stringify({
          amountNaira: 60000,
        }),
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(json.currentRole).toBe('STAFF');
    });

    it('blocks non-admin from modifying system settings or calendar dates (403 Forbidden)', async () => {
      const res = await app.request('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'STUDENT',
        },
        body: JSON.stringify({
          portalModule: 'admissions',
          isOpen: false,
        }),
      });

      expect(res.status).toBe(403);
    });

    it('allows SUPER_ADMIN to access admin fee endpoints', async () => {
      const res = await app.request('/api/admin/fees', {
        method: 'GET',
        headers: {
          'X-Demo-Role': 'SUPER_ADMIN',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.feeCategories).toBeDefined();
      expect(json.feeSchedules).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 2. Finance Admin Service & Strict Kobo Arithmetic
  // -------------------------------------------------------------
  describe('FinanceAdminService', () => {
    it('enforces strict Kobo-integer arithmetic and rejects floating-point amounts', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      // Attempting to pass fractional Kobo (e.g. 45000.55 Kobo) must throw
      await expect(
        service.setFeePrice({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountKobo: 4500000.75, // Fractional Kobo is invalid
        })
      ).rejects.toThrow(/Financial Engine Violation/);

      // Attempting negative amounts must throw
      await expect(
        service.setFeePrice({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 100,
          amountKobo: -1000,
        })
      ).rejects.toThrow(/Financial Engine Violation/);
    });

    it('sets and updates fee schedule prices with correct Kobo and formatted Naira', async () => {
      const container = createMemoryContainer();
      const service = new FinanceAdminService(container.db);

      // 1. Create a fee category (e.g. ICT Levy)
      const category = await service.createFeeCategory({
        divisionId: 'div-nce',
        name: 'ICT & Computational Laboratory Levy',
        code: 'FEE-NCE-ICT',
        isRecurring: true,
      });
      expect(category.code).toBe('FEE-NCE-ICT');

      // 2. Set price in Naira (₦12,500.00 -> 1,250,000 Kobo)
      const schedule = await service.setFeePriceInNaira({
        categoryId: category.id,
        sessionId: 'sess-2026-2027',
        level: 100,
        amountNaira: 12500,
        dueDate: '2026-11-30',
      });

      expect(schedule.amountKobo).toBe(1250000);
      expect(schedule.formattedAmount).toContain('12,500');

      // 3. Update the fee price to ₦15,000.00
      const updated = await service.updateFeeSchedule(schedule.id, {
        amountNaira: 15000,
      });

      expect(updated.amountKobo).toBe(1500000);
      expect(updated.formattedAmount).toContain('15,000');

      // 4. List fee schedules
      const list = await service.listFeeSchedules({ categoryId: category.id });
      expect(list.length).toBe(1);
      expect(list[0].amountKobo).toBe(1500000);
    });
  });

  // -------------------------------------------------------------
  // 3. Academic Admin Service (Departments, Courses, Allocations)
  // -------------------------------------------------------------
  describe('AcademicAdminService', () => {
    it('creates, updates, and deletes departments', async () => {
      const container = createMemoryContainer();
      const service = new AcademicAdminService(container.db);

      const dept = await service.createDepartment({
        schoolId: 'sch-sci',
        name: 'Department of Agricultural Science Education',
        code: 'AGE',
      });

      expect(dept.id).toBeDefined();
      expect(dept.code).toBe('AGE');

      const updated = await service.updateDepartment(dept.id, {
        name: 'Department of Agricultural & Environmental Science Education',
      });
      expect(updated.name).toBe('Department of Agricultural & Environmental Science Education');

      const list = await service.listDepartments('sch-sci');
      expect(list.some(d => d.id === dept.id)).toBe(true);

      const deleted = await service.deleteDepartment(dept.id);
      expect(deleted).toBe(true);
    });

    it('creates courses and assigns them to faculty members', async () => {
      const container = createMemoryContainer();
      const service = new AcademicAdminService(container.db);

      const course = await service.createCourse({
        programmeId: 'prog-nce-csc-mth',
        code: 'CSC 113',
        title: 'Algorithms and Data Structures I',
        creditUnits: 3,
        level: 100,
        semesterTerm: 1,
        isCompulsory: true,
      });

      expect(course.code).toBe('CSC 113');
      expect(course.creditUnits).toBe(3);

      // Assign to Lecturer
      const allocation = await service.assignCourseToFaculty({
        staffId: 'stf-001',
        courseId: course.id,
        semesterId: 'sem-nce-2026-1',
        role: 'PRIMARY_LECTURER',
      });

      expect(allocation.role).toBe('PRIMARY_LECTURER');

      const allocations = await service.listFacultyCourseAllocations({ courseId: course.id });
      expect(allocations.length).toBe(1);

      await service.removeCourseFromFaculty(allocation.id);
      const afterRemove = await service.listFacultyCourseAllocations({ courseId: course.id });
      expect(afterRemove.length).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 4. System Admin Service (Settings, Portal Controls, Calendar)
  // -------------------------------------------------------------
  describe('SystemAdminService', () => {
    it('manages key-value settings and operational portal toggles', async () => {
      const container = createMemoryContainer();
      const service = new SystemAdminService(container.db);

      // 1. Toggle Admissions Portal
      await service.setPortalStatus('admissions', true, 'super_admin');
      const isOpen = await service.getPortalStatus('admissions');
      expect(isOpen).toBe(true);

      await service.setPortalStatus('admissions', false, 'super_admin');
      const isClosed = await service.getPortalStatus('admissions');
      expect(isClosed).toBe(false);

      // 2. Custom Institutional Key-Value
      await service.setSetting(
        'institution_motto',
        'Knowledge, Character and Excellence',
        'GENERAL',
        'Official motto of COEKA'
      );
      const motto = await service.getSetting('institution_motto');
      expect(motto).toBe('Knowledge, Character and Excellence');

      // 3. Academic Calendar Update
      const cal = await service.setAcademicCalendarDates({
        sessionId: 'sess-2026-2027',
        startDate: '2026-10-01',
        endDate: '2027-07-31',
        updatedBy: 'super_admin',
      });
      expect(cal.startDate).toBe('2026-10-01');
      expect(cal.endDate).toBe('2027-07-31');
    });
  });

  // -------------------------------------------------------------
  // 5. End-to-End Super Admin API Flow
  // -------------------------------------------------------------
  describe('Super Admin End-to-End API Integration', () => {
    it('successfully executes price setting via POST /api/admin/fees with SUPER_ADMIN role', async () => {
      const res = await app.request('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          categoryId: 'fee-nce-tuition',
          sessionId: 'sess-2026-2027',
          level: 200,
          amountNaira: 48000,
          dueDate: '2026-12-31',
        }),
      });

      expect(res.status).toBe(201);
      const json: any = await res.json();
      expect(json.message).toContain('Fee schedule price set successfully');
      expect(json.feeSchedule.amountKobo).toBe(4800000);
      expect(json.feeSchedule.formattedAmount).toContain('48,000');
    });

    it('successfully creates course via POST /api/admin/courses with SUPER_ADMIN role', async () => {
      const res = await app.request('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          programmeId: 'prog-nce-csc-mth',
          code: 'EDU 112',
          title: 'Educational Psychology',
          creditUnits: 2,
          level: 100,
          semesterTerm: 1,
        }),
      });

      expect(res.status).toBe(201);
      const json: any = await res.json();
      expect(json.course.code).toBe('EDU 112');
    });

    it('successfully updates portal settings via PATCH /api/admin/settings with SUPER_ADMIN role', async () => {
      const res = await app.request('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({
          portalModule: 'course_registration',
          isOpen: true,
          key: 'portal_announcement',
          value: 'Welcome to 2026/2027 Academic Session',
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.message).toBe('System settings updated successfully');
      expect(json.updated.portalStatus.isOpen).toBe(true);
      expect(json.updated.setting.value).toBe('Welcome to 2026/2027 Academic Session');
    });
  });
});
