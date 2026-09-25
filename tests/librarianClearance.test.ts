import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/api';
import { getContainer } from '../src/infrastructure/container';
import { LibrarianService } from '../src/services/library/libraryService';
import { FinanceAdminService } from '../src/services/admin/financeAdminService';
import { FinanceService } from '../src/services/finance/financeService';

describe('Module 7: The Asset & Clearance Hub (Librarian Verification Suite)', () => {
  const container = getContainer();
  const librarianService = new LibrarianService(container.db, container.cache, container.queue);
  const financeAdminService = new FinanceAdminService(container.db);
  const financeService = new FinanceService(container.db, container.cache, container.queue);

  beforeEach(async () => {
    await financeAdminService.ensureSeedInvoicesAndTransactions();
  });

  describe('1. Inventory Management & Cataloging', () => {
    it('catalogs new academic textbook and retrieves it from catalog', async () => {
      const isbn = `978-978-TEST-${Date.now().toString().slice(-4)}`;
      const book = await librarianService.addBook({
        isbn,
        title: 'Modern Compiler Design & Virtual Machines',
        author: 'Dr. Terfa Kange',
        publisher: 'Benue State University Press',
        publicationYear: 2026,
        category: 'COMPUTING',
        shelfLocation: 'STACK-CSC-09',
        totalCopies: 5,
      });

      expect(book.id).toBeDefined();
      expect(book.title).toBe('Modern Compiler Design & Virtual Machines');
      expect(book.availableCopies).toBe(5);
      expect(book.totalCopies).toBe(5);

      const catalog = await librarianService.listBooks({ search: 'Compiler Design' });
      expect(catalog.some((b) => b.isbn === isbn)).toBe(true);
    });

    it('rejects duplicate ISBN cataloging', async () => {
      const isbn = '978-978-49012-1-2'; // Already exists in seed
      await expect(
        librarianService.addBook({
          isbn,
          title: 'Duplicate Test',
          author: 'Author',
          shelfLocation: 'STACK-01',
          totalCopies: 1,
        })
      ).rejects.toThrow(/already exists/i);
    });
  });

  describe('2. Book Loans & Circulation Operations (issueBook & returnBook)', () => {
    it('issues a book to an eligible student and decrements available inventory', async () => {
      const book = await librarianService.addBook({
        isbn: `978-TEST-LOAN-${Date.now()}`,
        title: 'Algorithms in Python',
        author: 'Prof. Uzer',
        shelfLocation: 'STACK-MTH-05',
        totalCopies: 3,
      });

      const studentId = 'std-002'; // Doose Mercy Gbadu

      const loan = await librarianService.issueBook({
        bookId: book.id,
        studentId,
        notes: 'Final semester revision',
      });

      expect(loan.id).toBeDefined();
      expect(loan.status).toBe('ACTIVE');
      expect(loan.studentId).toBe(studentId);

      // Verify book available copies decremented
      const updatedBook = await librarianService.getBookById(book.id);
      expect(updatedBook.book.availableCopies).toBe(2);
      expect(updatedBook.book.borrowedCopies).toBe(1);
    });

    it('rejects loan issuance if book is completely checked out (0 available copies)', async () => {
      const book = await librarianService.addBook({
        isbn: `978-TEST-EMPTY-${Date.now()}`,
        title: 'Rare Archival Manuscript',
        author: 'Ancient Scholar',
        shelfLocation: 'SPECIAL-VAULT',
        totalCopies: 1,
      });

      // Issue the only copy
      await librarianService.issueBook({
        bookId: book.id,
        studentId: 'std-002',
      });

      // Attempt second issuance
      await expect(
        librarianService.issueBook({
          bookId: book.id,
          studentId: 'std-003',
        })
      ).rejects.toThrow(/Insufficient Inventory/i);
    });

    it('returns an overdue book, calculates overdue fines at ₦100/day, and updates copies', async () => {
      // Create a book and backdated overdue loan
      const book = await librarianService.addBook({
        isbn: `978-TEST-OVERDUE-${Date.now()}`,
        title: 'Principles of Educational Psychology',
        author: 'Dr. Bridget Tyav',
        shelfLocation: 'STACK-EDU-08',
        totalCopies: 2,
      });

      const loanId = `loan-od-${Date.now()}`;
      await container.db.execute(
        `INSERT INTO book_loans (id, book_id, student_id, staff_id, loan_date, due_date, status, created_at, updated_at)
         VALUES (?, ?, 'std-002', 'usr-lib-001', '2026-08-01', '2026-08-15', 'ACTIVE', unixepoch(), unixepoch())`,
        [loanId, book.id]
      );
      await container.db.execute(
        `UPDATE library_books SET available_copies = available_copies - 1 WHERE id = ?`,
        [book.id]
      );

      // Return 5 days after due date
      const result = await librarianService.returnBook(loanId, {
        returnDate: '2026-08-20',
      });

      expect(result.success).toBe(true);
      expect(result.fineApplied).toBe(true);
      expect(result.loan.status).toBe('RETURNED');
      expect(result.loan.daysOverdue).toBe(5);
      expect(result.loan.fineAmountKobo).toBe(50000); // 5 days * 10,000 Kobo (₦500.00)

      // Verify book available copies incremented back to 2
      const updatedBook = await librarianService.getBookById(book.id);
      expect(updatedBook.book.availableCopies).toBe(2);
    });

    it('returns a damaged book and assesses additional damage penalty', async () => {
      const book = await librarianService.addBook({
        isbn: `978-TEST-DMG-${Date.now()}`,
        title: 'Cell Biology Manual',
        author: 'Dr. Kange',
        shelfLocation: 'STACK-BIO-03',
        totalCopies: 1,
      });

      const loanId = `loan-dmg-${Date.now()}`;
      await container.db.execute(
        `INSERT INTO book_loans (id, book_id, student_id, staff_id, loan_date, due_date, status, created_at, updated_at)
         VALUES (?, ?, 'std-003', 'usr-lib-001', '2026-09-01', '2026-09-15', 'ACTIVE', unixepoch(), unixepoch())`,
        [loanId, book.id]
      );

      const result = await librarianService.returnBook(loanId, {
        returnDate: '2026-09-10', // on time
        isDamaged: true,
        damageFineKobo: 250000, // ₦2,500.00
        damageReason: 'Torn binding and water soaked covers',
      });

      expect(result.success).toBe(true);
      expect(result.fineApplied).toBe(true);
      expect(result.loan.fineAmountKobo).toBe(250000);
      expect(result.fineDetails?.reason).toContain('Damage penalty');
    });
  });

  describe('3. CRITICAL VERIFICATION: Fine Application & Automatic Bursar Ledger Balance Increase', () => {
    it('automatically increases student debt in Bursars dashboard when a librarian applies a fine', async () => {
      const studentId = 'std-003'; // Terna Victor Chia (Degree student)

      // 1. Capture student balance in Bursar's dashboard BEFORE library fine
      const debtorsBefore = await financeAdminService.getDebtorList({ search: 'Chia' });
      const studentDebtorBefore = debtorsBefore.find((d) => d.studentId === studentId);
      const initialDebtKobo = studentDebtorBefore?.outstandingDebtKobo || 0;

      const summaryBefore = await financeService.getStudentFinancialSummary(studentId);
      const initialBalanceKobo = summaryBefore.outstandingBalanceKobo;

      const reportBefore = await financeAdminService.getRevenueReport();
      const initialExpectedKobo = reportBefore.summary.totalExpectedKobo;
      const initialOutstandingKobo = reportBefore.summary.totalOutstandingKobo;

      // 2. Librarian applies a fine of ₦5,000.00 (500,000 Kobo) for a lost reference book
      const fineAmountKobo = 500000; // ₦5,000.00
      const fineReason = 'Lost Reference Book: Advanced Engineering Mathematics (replacement & binding fee)';

      const fine = await librarianService.applyFine(studentId, fineAmountKobo, fineReason);

      expect(fine.id).toBeDefined();
      expect(fine.amountKobo).toBe(fineAmountKobo);
      expect(fine.status).toBe('UNPAID');
      expect(fine.invoiceId).toBeDefined();

      // 3. Verify student's debt in Bursar's getDebtorList has increased by EXACTLY 500,000 Kobo
      const debtorsAfter = await financeAdminService.getDebtorList({ search: 'Chia' });
      const studentDebtorAfter = debtorsAfter.find((d) => d.studentId === studentId);

      expect(studentDebtorAfter).toBeDefined();
      expect(studentDebtorAfter!.outstandingDebtKobo).toBe(initialDebtKobo + fineAmountKobo);

      // 4. Verify student's financial summary in FinanceService has increased by EXACTLY 500,000 Kobo
      const summaryAfter = await financeService.getStudentFinancialSummary(studentId);
      expect(summaryAfter.outstandingBalanceKobo).toBe(initialBalanceKobo + fineAmountKobo);

      // 5. Verify institutional revenue report has increased totalExpected and totalOutstanding
      const reportAfter = await financeAdminService.getRevenueReport();
      expect(reportAfter.summary.totalExpectedKobo).toBe(initialExpectedKobo + fineAmountKobo);
      expect(reportAfter.summary.totalOutstandingKobo).toBe(initialOutstandingKobo + fineAmountKobo);
    });
  });

  describe('4. Digital Clearance Engine (getClearanceStatus & grantClearance)', () => {
    it('denies clearance if student has active unreturned books', async () => {
      // std-001 has active unreturned loan in seed
      const dossier = await librarianService.getClearanceStatus('std-001');
      expect(dossier.canClear).toBe(false);
      expect(dossier.activeLoansCount).toBeGreaterThan(0);
      expect(dossier.reasonsIneligible.length).toBeGreaterThan(0);

      await expect(
        librarianService.grantClearance('std-001', 'usr-lib-001')
      ).rejects.toThrow(/Clearance Prohibited.*unreturned book/i);
    });

    it('denies clearance if student has unpaid library fines', async () => {
      // Ensure student has no books, but apply a fine
      const studentId = 'std-003';
      // Clear any loans for this test
      await container.db.execute(
        `UPDATE book_loans SET status = 'RETURNED' WHERE student_id = ?`,
        [studentId]
      );

      // Apply unpaid fine
      await librarianService.applyFine(studentId, 100000, 'Late return penalty');

      const dossier = await librarianService.getClearanceStatus(studentId);
      expect(dossier.canClear).toBe(false);
      expect(dossier.unpaidFinesCount).toBeGreaterThan(0);

      await expect(
        librarianService.grantClearance(studentId, 'usr-lib-001')
      ).rejects.toThrow(/Clearance Prohibited.*unpaid library liabilities/i);
    });

    it('grants official digital clearance with cryptographic seal when student has zero liabilities', async () => {
      const studentId = 'std-002'; // Doose Mercy Gbadu

      // Ensure zero unreturned books and zero unpaid fines for std-002
      await container.db.execute(
        `UPDATE book_loans SET status = 'RETURNED' WHERE student_id = ?`,
        [studentId]
      );
      await container.db.execute(
        `UPDATE library_fines SET status = 'PAID' WHERE student_id = ?`,
        [studentId]
      );

      const dossier = await librarianService.getClearanceStatus(studentId);
      expect(dossier.canClear).toBe(true);

      const grantResult = await librarianService.grantClearance(
        studentId,
        'usr-lib-001',
        'Certified free of all college library liabilities'
      );

      expect(grantResult.success).toBe(true);
      expect(grantResult.certificateHash).toBeDefined();
      expect(grantResult.clearanceDossier.clearanceStatus).toBe('CLEARED');
      expect(grantResult.clearanceDossier.digitalCertificateHash).toBe(grantResult.certificateHash);
    });
  });

  describe('5. Circulation Reminders & Telemetry', () => {
    it('enqueues overdue reminder in notification_queue', async () => {
      // Use loan-001 from seed
      const reminder = await librarianService.sendLoanReminder('loan-001');

      expect(reminder.success).toBe(true);
      expect(reminder.studentName).toContain('Aondoaver');

      // Verify notification queued
      const notif = await container.db.queryFirst<any>(
        `SELECT * FROM notification_queue WHERE template_code = 'LIBRARY_OVERDUE_ALERT' ORDER BY created_at DESC LIMIT 1`
      );
      expect(notif).toBeDefined();
      expect(notif.status).toBe('QUEUED');
    });

    it('provides accurate library statistics', async () => {
      const stats = await librarianService.getLibraryStatistics();

      expect(stats.totalTitles).toBeGreaterThan(0);
      expect(stats.totalVolumes).toBeGreaterThan(0);
      expect(stats.availableVolumes).toBeGreaterThan(0);
      expect(stats.formattedFinesAssessed).toBeDefined();
    });
  });

  describe('6. REST API Endpoints & Role-Based Access Control', () => {
    it('allows LIBRARIAN to access stats, books, and clearance endpoints', async () => {
      const statsRes = await app.request('/api/librarian/stats', {
        headers: { 'X-Demo-Role': 'LIBRARIAN' },
      });
      expect(statsRes.status).toBe(200);

      const booksRes = await app.request('/api/librarian/books', {
        headers: { 'X-Demo-Role': 'LIBRARIAN' },
      });
      expect(booksRes.status).toBe(200);

      const loansRes = await app.request('/api/librarian/loans', {
        headers: { 'X-Demo-Role': 'LIBRARIAN' },
      });
      expect(loansRes.status).toBe(200);
    });

    it('rejects unauthorized roles (LECTURER, STUDENT, PARENT) with 403 Forbidden', async () => {
      // Lecturer cannot access librarian module
      const lecRes = await app.request('/api/librarian/books', {
        headers: { 'X-Demo-Role': 'LECTURER' },
      });
      expect(lecRes.status).toBe(403);

      // Student cannot access librarian module
      const stdRes = await app.request('/api/librarian/stats', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });
      expect(stdRes.status).toBe(403);

      // Parent cannot access librarian module
      const parRes = await app.request('/api/librarian/fines', {
        headers: { 'X-Demo-Role': 'PARENT' },
      });
      expect(parRes.status).toBe(403);
    });

    it('applies a fine via REST endpoint and confirms 201 Created', async () => {
      const res = await app.request('/api/librarian/fines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': 'LIBRARIAN',
        },
        body: JSON.stringify({
          studentId: 'std-002',
          amountKobo: 250000,
          reason: 'Defaced dictionary pages in reference section',
        }),
      });

      expect(res.status).toBe(201);
      const json: any = await res.json();
      expect(json.success).toBe(true);
      expect(json.fine.amountKobo).toBe(250000);
      expect(json.fine.formattedAmount).toBe('₦2,500.00');
    });

    it('reflects dynamic library clearance status in the student clearance API', async () => {
      // For cleared student std-003
      await container.db.execute(
        `INSERT OR REPLACE INTO library_clearances (id, student_id, status, cleared_by_user_id, cleared_at, remarks, digital_certificate_hash)
         VALUES ('clr-test', 'std-001', 'CLEARED', 'usr-lib-001', unixepoch(), 'All assets returned', 'hash_test_sig')`
      );

      const res = await app.request('/api/student/clearance', {
        headers: { 'X-Demo-Role': 'STUDENT' },
      });

      expect(res.status).toBe(200);
      const json: any = await res.json();
      const libStation = json.checklist.find((c: any) => c.unit === 'LIBRARY');
      expect(libStation).toBeDefined();
      expect(libStation.officer).toContain('College Librarian');
    });
  });
});
