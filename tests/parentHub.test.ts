import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api/index';
import { createMemoryContainer, resetDefaultMemoryContainer, getContainer } from '../src/infrastructure/container';
import { ParentService } from '../src/services/parent/parentService';
import { useAppStore } from '../src/web/stores/useAppStore';

describe('Module 4: The Parent/Guardian Hub (Monitoring, Multi-Child Management & Payments)', () => {
  beforeEach(() => {
    resetDefaultMemoryContainer();
    useAppStore.setState({
      activeWardId: 'std-001',
      activeTab: 'parent',
    });
  });

  describe('1. Parent Service Layer & Security Boundary', () => {
    it('retrieves parent profile and multi-tier wards across NCE, Secondary, and Primary', async () => {
      const container = createMemoryContainer();
      const parentService = new ParentService(container.db, container.cache);

      const result = await parentService.getParentWithWards('prt-001');

      expect(result.parent).toBeDefined();
      expect(result.parent.fullName).toBeDefined();
      expect(result.wards).toHaveLength(3);

      const nceWard = result.wards.find((w) => w.studentId === 'std-001');
      const secWard = result.wards.find((w) => w.studentId === 'std-002');
      const priWard = result.wards.find((w) => w.studentId === 'std-003');

      expect(nceWard).toBeDefined();
      expect(nceWard?.division).toBe('NCE');
      expect(nceWard?.currentGPA).toBe(4.83);
      expect(nceWard?.feeStatus).toBe('UNPAID');
      expect(nceWard?.outstandingKobo).toBe(4500000);

      expect(secWard).toBeDefined();
      expect(secWard?.division).toBe('SECONDARY');
      expect(secWard?.terminalAverage).toBe('82.5%');
      expect(secWard?.feeStatus).toBe('PAID');

      expect(priWard).toBeDefined();
      expect(priWard?.division).toBe('PRIMARY');
      expect(priWard?.terminalPosition).toBe('1st of 32');
    });

    it('strictly verifies guardian ward ownership (permits legitimate wards, blocks foreign students)', async () => {
      const container = createMemoryContainer();
      const parentService = new ParentService(container.db, container.cache);

      // Legitimate wards
      const ownsMoses = await parentService.verifyWardOwnership('prt-001', 'std-001');
      const ownsBlessing = await parentService.verifyWardOwnership('prt-001', 'std-002');
      const ownsKelvin = await parentService.verifyWardOwnership('prt-001', 'std-003');

      expect(ownsMoses).toBe(true);
      expect(ownsBlessing).toBe(true);
      expect(ownsKelvin).toBe(true);

      // Foreign student not assigned to this parent
      const ownsForeign = await parentService.verifyWardOwnership('prt-001', 'std-unauthorized-999');
      expect(ownsForeign).toBe(false);
    });

    it('generates academic performance dossier for Tertiary student (NCE GPA & course grades)', async () => {
      const container = createMemoryContainer();
      const parentService = new ParentService(container.db, container.cache);

      const perf = await parentService.getChildPerformance('std-001');

      expect(perf.studentId).toBe('std-001');
      expect(perf.division).toContain('NCE');
      expect(perf.attendance.attendanceRate).toBeGreaterThanOrEqual(75);
      expect(perf.attendance.isExamEligible).toBe(true);
      expect(perf.summaryMetrics.gpaOrAverage).toBe(4.83);
      expect(perf.subjectsOrCourses.length).toBeGreaterThan(0);

      const csc111 = perf.subjectsOrCourses.find((c) => c.codeOrName === 'CSC 111');
      expect(csc111).toBeDefined();
      expect(csc111?.total).toBe(86);
      expect(csc111?.grade).toBe('A');
    });

    it('generates academic performance dossier for Basic Education student (Term average & affective traits)', async () => {
      const container = createMemoryContainer();
      const parentService = new ParentService(container.db, container.cache);

      const perf = await parentService.getChildPerformance('std-002');

      expect(perf.studentId).toBe('std-002');
      expect(perf.division).toBe('Demonstration Secondary');
      expect(perf.summaryMetrics.gpaOrAverage).toBe(82.5);
      expect(perf.summaryMetrics.classPosition).toContain('2nd of 42');
      expect(perf.affectiveTraits).toBeInstanceOf(Array);
      expect(perf.affectiveTraits?.length).toBeGreaterThan(0);
      expect(perf.remarks.principalOrDeanRemark).toBeDefined();
    });

    it('calculates consolidated multi-child cart payment with transparent gateway surcharge', async () => {
      const container = createMemoryContainer();
      const parentService = new ParentService(container.db, container.cache);

      const payment = await parentService.payConsolidated({
        parentId: 'prt-001',
        parentName: 'Mr. Joshua T. Tsegha',
        parentEmail: 'j.tsegha@gmail.com',
        items: [
          {
            childId: 'std-001',
            childName: 'Aondoaver Moses',
            invoiceId: 'inv-001',
            feeTitle: 'NCE Tuition Fee',
            amountKobo: 4500000, // ₦45,000
          },
          {
            childId: 'std-002',
            childName: 'Ngodoo Blessing',
            invoiceId: 'inv-dss-002',
            feeTitle: 'Demonstration Secondary Advance Tuition',
            amountKobo: 2500000, // ₦25,000
          },
        ],
        gateway: 'PAYSTACK',
      });

      expect(payment.reference).toBeDefined();
      expect(payment.totalBaseAmountKobo).toBe(7000000); // ₦70,000
      expect(payment.gatewayChargeKobo).toBeGreaterThan(0);
      expect(payment.totalPayableKobo).toBe(payment.totalBaseAmountKobo + payment.gatewayChargeKobo);
      expect(payment.formattedTotalBase).toBe('₦70,000.00');
      expect(payment.paymentUrl).toBeDefined();
    });
  });

  describe('2. Parent REST API & Strict RBAC Isolation', () => {
    it('allows PARENT role to access /api/parent/wards and retrieve all monitored children', async () => {
      const res = await app.request('/api/parent/wards', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.parent).toBeDefined();
      expect(json.wards).toBeInstanceOf(Array);
      expect(json.wards).toHaveLength(3);
    });

    it('returns detailed performance dossier for an authorized ward via GET /api/parent/wards/:id/performance', async () => {
      const res = await app.request('/api/parent/wards/std-001/performance', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.performance.studentId).toBe('std-001');
      expect(json.performance.attendance).toBeDefined();
      expect(json.performance.progressHistory).toHaveLength(2);
    });

    it('STRICTLY BLOCKS performance query for foreign/unauthorized student with HTTP 403 Forbidden', async () => {
      const res = await app.request('/api/parent/wards/std-unauthorized-999/performance', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('returns ward invoices and dedicated virtual account via GET /api/parent/wards/:id/invoices', async () => {
      const res = await app.request('/api/parent/wards/std-001/invoices', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.invoices).toBeDefined();
      expect(json.summary.hasOutstandingDebt).toBe(true);
      expect(json.virtualAccount.accountNumber).toBe('9910840184');
    });

    it('STRICTLY BLOCKS invoice query for foreign/unauthorized student with HTTP 403 Forbidden', async () => {
      const res = await app.request('/api/parent/wards/std-unauthorized-999/invoices', {
        headers: {
          'X-Demo-Role': 'PARENT',
        },
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('executes multi-child consolidated checkout via POST /api/parent/pay', async () => {
      const res = await app.request('/api/parent/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'PARENT',
        },
        body: JSON.stringify({
          items: [
            {
              childId: 'std-001',
              childName: 'Aondoaver Moses',
              invoiceId: 'inv-001',
              feeTitle: 'NCE Tuition',
              amountKobo: 4500000,
            },
            {
              childId: 'std-002',
              childName: 'Ngodoo Blessing',
              invoiceId: 'inv-dss-002',
              feeTitle: 'Secondary Tuition',
              amountKobo: 2500000,
            },
          ],
          gateway: 'VPAY',
        }),
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.payment.reference).toBeDefined();
      expect(json.payment.totalBaseAmountKobo).toBe(7000000);
      expect(json.payment.totalPayableKobo).toBeGreaterThan(7000000);
    });

    it('REJECTS payment if ANY requested child is not an authorized ward of the parent with HTTP 403', async () => {
      const res = await app.request('/api/parent/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'PARENT',
        },
        body: JSON.stringify({
          items: [
            {
              childId: 'std-001',
              childName: 'Aondoaver Moses',
              invoiceId: 'inv-001',
              amountKobo: 4500000,
            },
            {
              childId: 'std-stranger-888', // Unauthorized child!
              childName: 'Foreign Child',
              invoiceId: 'inv-999',
              amountKobo: 3000000,
            },
          ],
        }),
      });

      expect(res.status).toBe(403);
      const json: any = await res.json();
      expect(json.error).toContain('Forbidden');
    });

    it('denies unauthenticated requests to /api/parent/* with HTTP 401', async () => {
      const res = await app.request('/api/parent/wards');
      expect(res.status).toBe(401);
    });

    it('denies non-parent roles (e.g. STUDENT) from accessing /api/parent/* with HTTP 403', async () => {
      const res = await app.request('/api/parent/wards', {
        headers: {
          'X-Demo-Role': 'STUDENT',
        },
      });
      expect(res.status).toBe(403);
    });
  });

  describe('3. Crucial Verification: Zustand Store Ward Switching & Telemetry Reactivity', () => {
    it('switches active ward in Zustand store and immediately queries different division performance and financial records', async () => {
      // INITIAL STATE: Ward std-001 (Tertiary NCE)
      expect(useAppStore.getState().activeWardId).toBe('std-001');

      const resWard1 = await app.request('/api/parent/wards/std-001/performance', {
        headers: { 'X-Demo-Role': 'PARENT' },
      });
      const dataWard1: any = await resWard1.json();

      expect(dataWard1.performance.studentId).toBe('std-001');
      expect(dataWard1.performance.division).toContain('NCE');
      expect(dataWard1.performance.summaryMetrics.gpaOrAverage).toBe(4.83); // 4.83 GPA

      // Check Invoices for Ward 1
      const resInv1 = await app.request('/api/parent/wards/std-001/invoices', {
        headers: { 'X-Demo-Role': 'PARENT' },
      });
      const invData1: any = await resInv1.json();
      expect(invData1.summary.hasOutstandingDebt).toBe(true);
      expect(invData1.summary.outstandingBalanceKobo).toBe(4500000); // ₦45,000 due

      // REACTIVE SWITCH IN ZUSTAND: Switch active ward to std-002 (Demonstration Secondary)
      useAppStore.getState().setActiveWardId('std-002');
      expect(useAppStore.getState().activeWardId).toBe('std-002');

      const resWard2 = await app.request(`/api/parent/wards/${useAppStore.getState().activeWardId}/performance`, {
        headers: { 'X-Demo-Role': 'PARENT' },
      });
      const dataWard2: any = await resWard2.json();

      expect(dataWard2.performance.studentId).toBe('std-002');
      expect(dataWard2.performance.division).toBe('Demonstration Secondary');
      expect(dataWard2.performance.summaryMetrics.gpaOrAverage).toBe(82.5); // 82.5% Average
      expect(dataWard2.performance.summaryMetrics.classPosition).toContain('2nd of 42');

      // Check Invoices for Ward 2
      const resInv2 = await app.request(`/api/parent/wards/${useAppStore.getState().activeWardId}/invoices`, {
        headers: { 'X-Demo-Role': 'PARENT' },
      });
      const invData2: any = await resInv2.json();
      expect(invData2.summary.hasOutstandingDebt).toBe(false);
      expect(invData2.summary.outstandingBalanceKobo).toBe(0); // Fees Paid

      // REACTIVE SWITCH IN ZUSTAND AGAIN: Switch to std-003 (Staff Primary School)
      useAppStore.getState().setActiveWardId('std-003');
      expect(useAppStore.getState().activeWardId).toBe('std-003');

      const resWard3 = await app.request(`/api/parent/wards/${useAppStore.getState().activeWardId}/performance`, {
        headers: { 'X-Demo-Role': 'PARENT' },
      });
      const dataWard3: any = await resWard3.json();

      expect(dataWard3.performance.studentId).toBe('std-003');
      expect(dataWard3.performance.division).toBe('Staff Primary School');
      expect(dataWard3.performance.summaryMetrics.classPosition).toContain('1st of 32');
    });
  });
});
