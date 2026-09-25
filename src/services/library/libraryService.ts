import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider';
import { ICacheProvider } from '../../infrastructure/interfaces/ICacheProvider';
import { IQueueProvider } from '../../infrastructure/interfaces/IQueueProvider';
import { LedgerEngine } from '../finance/ledgerEngine';
import { SignatureService } from '../finance/signatureService';

export interface LibraryBookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publicationYear?: number;
  category: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  coverImageUrl?: string;
  createdAt: number;
}

export interface BookLoanItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  shelfLocation: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  divisionName?: string;
  programmeName?: string;
  staffId?: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';
  fineAmountKobo: number;
  formattedFine?: string;
  daysOverdue: number;
  notes?: string;
  createdAt: number;
}

export interface LibraryFineItem {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  loanId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amountKobo: number;
  formattedAmount: string;
  reason: string;
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  issuedByStaffId?: string;
  issuedAt: number;
  paidAt?: number;
}

export interface StudentClearanceDossier {
  studentId: string;
  matricNumber: string;
  studentName: string;
  divisionName: string;
  programmeName: string;
  academicStatus: string;
  activeLoansCount: number;
  activeLoans: BookLoanItem[];
  unpaidFinesCount: number;
  unpaidFinesKobo: number;
  formattedUnpaidFines: string;
  unpaidFines: LibraryFineItem[];
  canClear: boolean;
  clearanceStatus: 'PENDING' | 'CLEARED' | 'DENIED';
  reasonsIneligible: string[];
  clearedAt?: number | null;
  clearedBy?: string | null;
  digitalCertificateHash?: string | null;
  remarks?: string | null;
}

export class LibrarianService {
  constructor(
    private db: IDatabaseProvider,
    private cache?: ICacheProvider,
    private queue?: IQueueProvider
  ) {}

  /**
   * Validate that monetary fine amounts are strictly positive integer Kobo
   */
  private validateKoboAmount(amountKobo: number): void {
    if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
      throw new Error(
        `Financial Engine Violation: Fine amounts must be strictly positive integers in Kobo. Received: ${amountKobo}`
      );
    }
  }

  /**
   * Helper to resolve student by ID, matric number, or username
   */
  private async resolveStudent(studentIdOrMatric: string): Promise<any> {
    const student = await this.db.queryFirst<any>(
      `SELECT s.*, u.email, u.phone_number as phoneNumber, u.username,
              d.name as divisionName, p.name as programmeName
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN divisions d ON s.division_id = d.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       WHERE s.id = ? OR s.matric_number = ? OR u.username = ? OR s.user_id = ?`,
      [studentIdOrMatric, studentIdOrMatric, studentIdOrMatric, studentIdOrMatric]
    );

    if (!student) {
      throw new Error(`Student Not Found: Identifier '${studentIdOrMatric}' does not match any enrolled student record.`);
    }

    return student;
  }

  // =========================================================================
  // 1. INVENTORY MANAGEMENT (Library Books Catalog)
  // =========================================================================

  /**
   * List catalog books with optional filters
   */
  async listBooks(filters?: {
    search?: string;
    category?: string;
    availableOnly?: boolean;
  }): Promise<LibraryBookItem[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.category && filters.category !== 'ALL') {
      conditions.push('category = ?');
      params.push(filters.category.toUpperCase());
    }

    if (filters?.availableOnly) {
      conditions.push('available_copies > 0');
    }

    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push('(LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(isbn) LIKE ? OR LOWER(shelf_location) LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM library_books ${whereClause} ORDER BY title ASC`;
    const rows = await this.db.query<any>(sql, params);

    return rows.map((r) => {
      const total = Number(r.total_copies || 1);
      const avail = Number(r.available_copies || 0);
      return {
        id: r.id,
        isbn: r.isbn,
        title: r.title,
        author: r.author,
        publisher: r.publisher,
        publicationYear: r.publication_year ? Number(r.publication_year) : undefined,
        category: r.category || 'GENERAL',
        shelfLocation: r.shelf_location,
        totalCopies: total,
        availableCopies: avail,
        borrowedCopies: Math.max(0, total - avail),
        coverImageUrl: r.cover_image_url,
        createdAt: Number(r.created_at),
      };
    });
  }

  /**
   * Get single book details including its active loans
   */
  async getBookById(bookId: string): Promise<{
    book: LibraryBookItem;
    activeLoans: BookLoanItem[];
  }> {
    const r = await this.db.queryFirst<any>(
      `SELECT * FROM library_books WHERE id = ? OR isbn = ?`,
      [bookId, bookId]
    );

    if (!r) {
      throw new Error(`Inventory Error: Book with identifier '${bookId}' does not exist.`);
    }

    const total = Number(r.total_copies || 1);
    const avail = Number(r.available_copies || 0);
    const book: LibraryBookItem = {
      id: r.id,
      isbn: r.isbn,
      title: r.title,
      author: r.author,
      publisher: r.publisher,
      publicationYear: r.publication_year ? Number(r.publication_year) : undefined,
      category: r.category || 'GENERAL',
      shelfLocation: r.shelf_location,
      totalCopies: total,
      availableCopies: avail,
      borrowedCopies: Math.max(0, total - avail),
      coverImageUrl: r.cover_image_url,
      createdAt: Number(r.created_at),
    };

    const loans = await this.listLoans({ bookId: book.id, status: 'ACTIVE' });
    return { book, activeLoans: loans };
  }

  /**
   * Add a new book title to the library catalog
   */
  async addBook(data: {
    isbn: string;
    title: string;
    author: string;
    publisher?: string;
    publicationYear?: number;
    category?: string;
    shelfLocation: string;
    totalCopies?: number;
    coverImageUrl?: string;
  }): Promise<LibraryBookItem> {
    if (!data.title || !data.author || !data.isbn || !data.shelfLocation) {
      throw new Error('Validation Error: ISBN, title, author, and shelf location are required.');
    }

    const existing = await this.db.queryFirst<any>(
      `SELECT id FROM library_books WHERE isbn = ?`,
      [data.isbn.trim()]
    );

    if (existing) {
      throw new Error(`Inventory Error: A book with ISBN '${data.isbn}' already exists in the catalog.`);
    }

    const id = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const copies = Math.max(1, data.totalCopies || 1);
    const now = Math.floor(Date.now() / 1000);

    await this.db.execute(
      `INSERT INTO library_books (id, isbn, title, author, publisher, publication_year, category, shelf_location, total_copies, available_copies, cover_image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.isbn.trim(),
        data.title.trim(),
        data.author.trim(),
        data.publisher?.trim() || null,
        data.publicationYear || new Date().getFullYear(),
        (data.category || 'GENERAL').toUpperCase(),
        data.shelfLocation.trim(),
        copies,
        copies,
        data.coverImageUrl || null,
        now,
        now,
      ]
    );

    return {
      id,
      isbn: data.isbn.trim(),
      title: data.title.trim(),
      author: data.author.trim(),
      publisher: data.publisher?.trim(),
      publicationYear: data.publicationYear || new Date().getFullYear(),
      category: (data.category || 'GENERAL').toUpperCase(),
      shelfLocation: data.shelfLocation.trim(),
      totalCopies: copies,
      availableCopies: copies,
      borrowedCopies: 0,
      coverImageUrl: data.coverImageUrl,
      createdAt: now,
    };
  }

  // =========================================================================
  // 2. LOAN ENGINE (issueBook & returnBook)
  // =========================================================================

  /**
   * Record a book loan and set a return date
   */
  async issueBook(data: {
    bookId: string;
    studentId: string;
    dueDate?: string;
    staffId?: string;
    notes?: string;
  }): Promise<BookLoanItem> {
    const { bookId, studentId, staffId = 'usr-lib-001', notes } = data;

    // 1. Resolve Book
    const book = await this.db.queryFirst<any>(
      `SELECT * FROM library_books WHERE id = ? OR isbn = ?`,
      [bookId, bookId]
    );

    if (!book) {
      throw new Error(`Loan Error: Book '${bookId}' does not exist.`);
    }

    if (Number(book.available_copies) <= 0) {
      throw new Error(
        `Insufficient Inventory: All copies of '${book.title}' are currently checked out.`
      );
    }

    // 2. Resolve Student
    const student = await this.resolveStudent(studentId);

    // 3. Verify Student Borrowing Limits & Standing
    const activeLoans = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM book_loans WHERE student_id = ? AND status = 'ACTIVE'`,
      [student.id]
    );

    if (Number(activeLoans?.count || 0) >= 3) {
      throw new Error(
        `Borrowing Limit Exceeded: Student '${student.matric_number}' already has 3 active loans. Maximum allowable concurrent loans is 3.`
      );
    }

    // Check if student has overdue loans
    const overdueCount = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM book_loans WHERE student_id = ? AND status = 'ACTIVE' AND due_date < date('now')`,
      [student.id]
    );

    if (Number(overdueCount?.count || 0) > 0) {
      throw new Error(
        `Borrowing Suspended: Student '${student.matric_number}' has unreturned overdue books. Overdue items must be returned and liabilities cleared.`
      );
    }

    // Check if student has unpaid fines
    const unpaidFines = await this.db.queryFirst<{ count: number; totalKobo: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount_kobo), 0) as totalKobo 
       FROM library_fines WHERE student_id = ? AND status = 'UNPAID'`,
      [student.id]
    );

    if (Number(unpaidFines?.totalKobo || 0) > 0) {
      throw new Error(
        `Borrowing Suspended: Student has outstanding unpaid library fines (${LedgerEngine.koboToNaira(Number(unpaidFines?.totalKobo))}).`
      );
    }

    // 4. Calculate Loan & Due Dates (Default: 14 days)
    const today = new Date().toISOString().split('T')[0];
    let effectiveDueDate = data.dueDate;
    if (!effectiveDueDate) {
      const due = new Date();
      due.setDate(due.getDate() + 14);
      effectiveDueDate = due.toISOString().split('T')[0];
    }

    const loanId = `loan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = Math.floor(Date.now() / 1000);

    // 5. Persist Loan Record
    await this.db.execute(
      `INSERT INTO book_loans (id, book_id, student_id, staff_id, loan_date, due_date, return_date, status, fine_amount_kobo, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 'ACTIVE', 0, ?, ?, ?)`,
      [loanId, book.id, student.id, staffId, today, effectiveDueDate, notes || null, now, now]
    );

    // 6. Decrement Book Available Copies
    await this.db.execute(
      `UPDATE library_books 
       SET available_copies = available_copies - 1, updated_at = ?
       WHERE id = ?`,
      [now, book.id]
    );

    // 7. Reset Clearance to PENDING if student previously had CLEARED stamp
    await this.db.execute(
      `UPDATE library_clearances 
       SET status = 'PENDING', remarks = 'Active library book loan initiated', updated_at = ?
       WHERE student_id = ? AND status = 'CLEARED'`,
      [now, student.id]
    );

    return {
      id: loanId,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookIsbn: book.isbn,
      shelfLocation: book.shelf_location,
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      matricNumber: student.matric_number,
      divisionName: student.divisionName,
      programmeName: student.programmeName,
      staffId,
      loanDate: today,
      dueDate: effectiveDueDate,
      returnDate: null,
      status: 'ACTIVE',
      fineAmountKobo: 0,
      formattedFine: '₦0.00',
      daysOverdue: 0,
      notes: notes || undefined,
      createdAt: now,
    };
  }

  /**
   * Mark a book as returned and calculate fines if overdue or damaged
   */
  async returnBook(
    loanId: string,
    data?: {
      returnDate?: string;
      staffId?: string;
      isDamaged?: boolean;
      damageFineKobo?: number;
      damageReason?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    loan: BookLoanItem;
    fineApplied: boolean;
    fineDetails?: LibraryFineItem;
  }> {
    // 1. Fetch Loan Record
    const loan = await this.db.queryFirst<any>(
      `SELECT l.*, b.id as bookId, b.title as bookTitle, b.author as bookAuthor, b.isbn as bookIsbn,
              b.shelf_location as shelfLocation, s.id as studentId, s.first_name as firstName,
              s.last_name as lastName, s.matric_number as matricNumber, d.name as divisionName,
              p.name as programmeName
       FROM book_loans l
       JOIN library_books b ON l.book_id = b.id
       JOIN students s ON l.student_id = s.id
       LEFT JOIN divisions d ON s.division_id = d.id
       LEFT JOIN programmes p ON s.programme_id = p.id
       WHERE l.id = ?`,
      [loanId]
    );

    if (!loan) {
      throw new Error(`Return Error: Loan record '${loanId}' not found.`);
    }

    if (loan.status === 'RETURNED') {
      throw new Error(`Return Error: Loan '${loanId}' has already been marked as returned on ${loan.return_date}.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const returnDate = data?.returnDate || todayStr;
    const now = Math.floor(Date.now() / 1000);

    // 2. Overdue Calculation (₦100.00 = 10,000 Kobo per day)
    let daysOverdue = 0;
    let overdueFineKobo = 0;

    const returnTime = new Date(returnDate).getTime();
    const dueTime = new Date(loan.due_date).getTime();

    if (returnTime > dueTime) {
      const diffMs = returnTime - dueTime;
      daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      overdueFineKobo = daysOverdue * 10000; // ₦100 / day
    }

    const damageFineKobo = data?.isDamaged && data?.damageFineKobo ? Number(data.damageFineKobo) : 0;
    const totalFineKobo = overdueFineKobo + damageFineKobo;

    // 3. Mark Loan as RETURNED and increment available copies
    await this.db.execute(
      `UPDATE book_loans 
       SET return_date = ?, status = 'RETURNED', fine_amount_kobo = ?, updated_at = ?
       WHERE id = ?`,
      [returnDate, totalFineKobo, now, loan.id]
    );

    await this.db.execute(
      `UPDATE library_books 
       SET available_copies = available_copies + 1, updated_at = ?
       WHERE id = ?`,
      [now, loan.bookId]
    );

    // 4. If fine applies, automatically push fine to student account and Bursar ledger
    let fineItem: LibraryFineItem | undefined;
    if (totalFineKobo > 0) {
      const reasonParts: string[] = [];
      if (overdueFineKobo > 0) {
        reasonParts.push(`Overdue fine: ${daysOverdue} day(s) overdue for '${loan.bookTitle}'`);
      }
      if (damageFineKobo > 0) {
        reasonParts.push(`Damage penalty: ${data?.damageReason || 'Physical book damage reported'}`);
      }

      fineItem = await this.applyFine(
        loan.studentId,
        totalFineKobo,
        reasonParts.join('; '),
        loan.id,
        data?.staffId || 'usr-lib-001'
      );
    }

    const formattedLoan: BookLoanItem = {
      id: loan.id,
      bookId: loan.bookId,
      bookTitle: loan.bookTitle,
      bookAuthor: loan.bookAuthor,
      bookIsbn: loan.bookIsbn,
      shelfLocation: loan.shelfLocation,
      studentId: loan.studentId,
      studentName: `${loan.firstName} ${loan.lastName}`,
      matricNumber: loan.matricNumber,
      divisionName: loan.divisionName,
      programmeName: loan.programmeName,
      staffId: data?.staffId || loan.staff_id,
      loanDate: loan.loan_date,
      dueDate: loan.due_date,
      returnDate,
      status: 'RETURNED',
      fineAmountKobo: totalFineKobo,
      formattedFine: LedgerEngine.koboToNaira(totalFineKobo),
      daysOverdue,
      notes: loan.notes,
      createdAt: Number(loan.created_at),
    };

    return {
      success: true,
      message: totalFineKobo > 0
        ? `Book returned successfully. Overdue fine of ${LedgerEngine.koboToNaira(totalFineKobo)} has been charged and added to student invoice.`
        : `Book '${loan.bookTitle}' returned in good condition. Zero outstanding penalties.`,
      loan: formattedLoan,
      fineApplied: totalFineKobo > 0,
      fineDetails: fineItem,
    };
  }

  // =========================================================================
  // 3. FINE & BURSAR INTEGRATION ENGINE (applyFine)
  // =========================================================================

  /**
   * Push a library fine to the Finance Engine so it appears on the student's invoice
   * and automatically increases the student's balance in the Bursar's dashboard
   */
  async applyFine(
    studentIdOrMatric: string,
    amountKobo: number,
    reason: string,
    loanId?: string,
    staffId: string = 'usr-lib-001'
  ): Promise<LibraryFineItem> {
    this.validateKoboAmount(amountKobo);

    // 1. Resolve Student
    const student = await this.resolveStudent(studentIdOrMatric);

    // 2. Resolve or Create Fee Schedule for Library Penalties
    let feeSchedule = await this.db.queryFirst<any>(
      `SELECT id FROM fee_schedules WHERE category_id = 'cat-lib-fine' LIMIT 1`
    );

    if (!feeSchedule) {
      // Find active session
      const session = await this.db.queryFirst<any>(
        `SELECT id FROM academic_sessions WHERE is_current = 1 LIMIT 1`
      );
      const sessionId = session?.id || 'sess-2026-2027';

      // Ensure category exists
      await this.db.execute(
        `INSERT OR IGNORE INTO fee_categories (id, division_id, name, code, is_recurring)
         VALUES ('cat-lib-fine', ?, 'Library Overdue & Damage Penalties', 'LIB-FINE', 0)`,
        [student.division_id || 'div-nce']
      );

      const schedId = 'sched-lib-fine-default';
      await this.db.execute(
        `INSERT OR IGNORE INTO fee_schedules (id, category_id, session_id, level, amount_kobo)
         VALUES (?, 'cat-lib-fine', ?, ?, ?)`,
        [schedId, sessionId, student.current_level || 100, amountKobo]
      );
      feeSchedule = { id: schedId };
    }

    // 3. Generate Student Invoice for Bursary Ledger
    const invoiceId = `inv-fine-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = `INV-LIB-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Math.floor(Date.now() / 1000);

    // Insert student invoice with status UNPAID and amount_due_kobo = amountKobo
    await this.db.execute(
      `INSERT INTO student_invoices (id, student_id, fee_schedule_id, invoice_number, amount_due_kobo, amount_paid_kobo, status, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 'UNPAID', ?)`,
      [invoiceId, student.id, feeSchedule.id, invoiceNumber, amountKobo, now]
    );

    // 4. Create Library Fine Record
    const fineId = `fine-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await this.db.execute(
      `INSERT INTO library_fines (id, student_id, loan_id, invoice_id, amount_kobo, reason, status, issued_by_staff_id, issued_at)
       VALUES (?, ?, ?, ?, ?, ?, 'UNPAID', ?, ?)`,
      [fineId, student.id, loanId || null, invoiceId, amountKobo, reason, staffId, now]
    );

    // 5. Invalidate Financial Cache so Bursar Dashboard & Student Portal update immediately
    if (this.cache) {
      await this.cache.delete(`invoices:${student.id}`);
      await this.cache.delete(`invoices:${student.matric_number}`);
    }

    // 6. Invalidate Clearance
    await this.db.execute(
      `UPDATE library_clearances 
       SET status = 'PENDING', remarks = ?, updated_at = ?
       WHERE student_id = ? AND status = 'CLEARED'`,
      [`Pending unpaid library fine: ${LedgerEngine.koboToNaira(amountKobo)}`, now, student.id]
    );

    return {
      id: fineId,
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      matricNumber: student.matric_number,
      loanId: loanId || undefined,
      invoiceId,
      invoiceNumber,
      amountKobo,
      formattedAmount: LedgerEngine.koboToNaira(amountKobo),
      reason,
      status: 'UNPAID',
      issuedByStaffId: staffId,
      issuedAt: now,
    };
  }

  /**
   * List library fines with optional filters
   */
  async listFines(filters?: {
    studentId?: string;
    status?: string;
    search?: string;
  }): Promise<LibraryFineItem[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.studentId) {
      conditions.push('f.student_id = ?');
      params.push(filters.studentId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push('f.status = ?');
      params.push(filters.status.toUpperCase());
    }

    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push('(LOWER(s.matric_number) LIKE ? OR LOWER(s.first_name) LIKE ? OR LOWER(s.last_name) LIKE ? OR LOWER(f.reason) LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT f.*, s.first_name as firstName, s.last_name as lastName, s.matric_number as matricNumber,
             inv.invoice_number as invoiceNumber
      FROM library_fines f
      JOIN students s ON f.student_id = s.id
      LEFT JOIN student_invoices inv ON f.invoice_id = inv.id
      ${whereClause}
      ORDER BY f.issued_at DESC
    `;

    const rows = await this.db.query<any>(sql, params);
    return rows.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: `${r.firstName} ${r.lastName}`,
      matricNumber: r.matricNumber,
      loanId: r.loan_id,
      invoiceId: r.invoice_id,
      invoiceNumber: r.invoiceNumber,
      amountKobo: Number(r.amount_kobo),
      formattedAmount: LedgerEngine.koboToNaira(Number(r.amount_kobo)),
      reason: r.reason,
      status: r.status,
      issuedByStaffId: r.issued_by_staff_id,
      issuedAt: Number(r.issued_at),
      paidAt: r.paid_at ? Number(r.paid_at) : undefined,
    }));
  }

  // =========================================================================
  // 4. LOAN TRACKER (listLoans, sendReminder)
  // =========================================================================

  /**
   * List all book loans with dynamically calculated overdue status
   */
  async listLoans(filters?: {
    status?: string;
    studentId?: string;
    bookId?: string;
    search?: string;
  }): Promise<BookLoanItem[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.studentId) {
      conditions.push('l.student_id = ?');
      params.push(filters.studentId);
    }

    if (filters?.bookId) {
      conditions.push('l.book_id = ?');
      params.push(filters.bookId);
    }

    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push('(LOWER(b.title) LIKE ? OR LOWER(b.isbn) LIKE ? OR LOWER(s.matric_number) LIKE ? OR LOWER(s.first_name) LIKE ? OR LOWER(s.last_name) LIKE ?)');
      params.push(term, term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT l.*, b.title as bookTitle, b.author as bookAuthor, b.isbn as bookIsbn,
             b.shelf_location as shelfLocation, s.first_name as firstName, s.last_name as lastName,
             s.matric_number as matricNumber, d.name as divisionName, p.name as programmeName
      FROM book_loans l
      JOIN library_books b ON l.book_id = b.id
      JOIN students s ON l.student_id = s.id
      LEFT JOIN divisions d ON s.division_id = d.id
      LEFT JOIN programmes p ON s.programme_id = p.id
      ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const rows = await this.db.query<any>(sql, params);
    const today = new Date().toISOString().split('T')[0];

    const allLoans = rows.map((r) => {
      let status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST' = r.status as any;
      let daysOverdue = 0;

      if (status !== 'RETURNED') {
        if (today > r.due_date) {
          status = 'OVERDUE';
          const diff = new Date(today).getTime() - new Date(r.due_date).getTime();
          daysOverdue = Math.ceil(diff / (1000 * 60 * 60 * 24));
        } else {
          status = 'ACTIVE';
        }
      }

      return {
        id: r.id,
        bookId: r.book_id,
        bookTitle: r.bookTitle,
        bookAuthor: r.bookAuthor,
        bookIsbn: r.bookIsbn,
        shelfLocation: r.shelfLocation,
        studentId: r.student_id,
        studentName: `${r.firstName} ${r.lastName}`,
        matricNumber: r.matricNumber,
        divisionName: r.divisionName,
        programmeName: r.programmeName,
        staffId: r.staff_id,
        loanDate: r.loan_date,
        dueDate: r.due_date,
        returnDate: r.return_date,
        status,
        fineAmountKobo: Number(r.fine_amount_kobo || 0),
        formattedFine: LedgerEngine.koboToNaira(Number(r.fine_amount_kobo || 0)),
        daysOverdue,
        notes: r.notes || undefined,
        createdAt: Number(r.created_at),
      };
    });

    if (filters?.status && filters.status !== 'ALL') {
      return allLoans.filter((l) => l.status === filters.status);
    }

    return allLoans;
  }

  /**
   * Send an electronic reminder to a student with an overdue or active loan
   */
  async sendLoanReminder(loanId: string): Promise<{
    success: boolean;
    message: string;
    studentName: string;
    matricNumber: string;
    bookTitle: string;
    channel: string;
    dueDate: string;
  }> {
    const loan = await this.db.queryFirst<any>(
      `SELECT l.*, b.title as bookTitle, s.first_name as firstName, s.last_name as lastName,
              s.matric_number as matricNumber, u.email, u.phone_number as phoneNumber
       FROM book_loans l
       JOIN library_books b ON l.book_id = b.id
       JOIN students s ON l.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE l.id = ?`,
      [loanId]
    );

    if (!loan) {
      throw new Error(`Loan record '${loanId}' not found.`);
    }

    const recipient = loan.email || loan.phoneNumber;
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Ensure notification_queue exists
    await this.db.execute(
      `CREATE TABLE IF NOT EXISTS notification_queue (
        id text PRIMARY KEY NOT NULL,
        channel text NOT NULL,
        recipient text NOT NULL,
        template_code text NOT NULL,
        payload_json text NOT NULL,
        status text DEFAULT 'QUEUED' NOT NULL,
        retry_count integer DEFAULT 0 NOT NULL,
        created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
      )`
    );

    // Queue notification
    await this.db.execute(
      `INSERT INTO notification_queue (id, channel, recipient, template_code, payload_json, status, created_at)
       VALUES (?, 'EMAIL', ?, 'LIBRARY_OVERDUE_ALERT', ?, 'QUEUED', (strftime('%s', 'now')))`,
      [
        notificationId,
        recipient,
        JSON.stringify({
          studentName: `${loan.firstName} ${loan.lastName}`,
          matricNumber: loan.matricNumber,
          bookTitle: loan.bookTitle,
          dueDate: loan.due_date,
        }),
      ]
    );

    return {
      success: true,
      message: `Overdue return reminder transmitted to ${loan.firstName} ${loan.lastName} (${loan.matricNumber}).`,
      studentName: `${loan.firstName} ${loan.lastName}`,
      matricNumber: loan.matricNumber,
      bookTitle: loan.bookTitle,
      channel: loan.email ? 'EMAIL' : 'SMS',
      dueDate: loan.due_date,
    };
  }

  // =========================================================================
  // 5. DIGITAL CLEARANCE DESK (getClearanceStatus & grantClearance)
  // =========================================================================

  /**
   * Inspect a student's library standing, unreturned assets, and fine liabilities
   */
  async getClearanceStatus(studentIdOrMatric: string): Promise<StudentClearanceDossier> {
    const student = await this.resolveStudent(studentIdOrMatric);

    // 1. Fetch unreturned loans
    const activeLoans = await this.listLoans({ studentId: student.id });
    const unreturnedLoans = activeLoans.filter((l) => l.status !== 'RETURNED');

    // 2. Fetch unpaid library fines
    const fines = await this.listFines({ studentId: student.id, status: 'UNPAID' });
    const unpaidFinesKobo = fines.reduce((acc, f) => acc + f.amountKobo, 0);

    // 3. Fetch existing clearance record if any
    const clearanceRow = await this.db.queryFirst<any>(
      `SELECT * FROM library_clearances WHERE student_id = ?`,
      [student.id]
    );

    const reasonsIneligible: string[] = [];
    if (unreturnedLoans.length > 0) {
      reasonsIneligible.push(`${unreturnedLoans.length} unreturned library book(s) in custody`);
    }
    if (unpaidFinesKobo > 0) {
      reasonsIneligible.push(`Unpaid library fine liability of ${LedgerEngine.koboToNaira(unpaidFinesKobo)}`);
    }

    const canClear = unreturnedLoans.length === 0 && unpaidFinesKobo === 0;

    let clearanceStatus: 'PENDING' | 'CLEARED' | 'DENIED' = 'PENDING';
    if (clearanceRow) {
      if (canClear && clearanceRow.status === 'CLEARED') {
        clearanceStatus = 'CLEARED';
      } else if (!canClear) {
        clearanceStatus = 'PENDING';
      } else {
        clearanceStatus = clearanceRow.status as any;
      }
    }

    return {
      studentId: student.id,
      matricNumber: student.matric_number,
      studentName: `${student.first_name} ${student.last_name}`,
      divisionName: student.divisionName || 'NCE',
      programmeName: student.programmeName || 'Academic Programme',
      academicStatus: student.academic_status || 'ACTIVE',
      activeLoansCount: unreturnedLoans.length,
      activeLoans: unreturnedLoans,
      unpaidFinesCount: fines.length,
      unpaidFinesKobo,
      formattedUnpaidFines: LedgerEngine.koboToNaira(unpaidFinesKobo),
      unpaidFines: fines,
      canClear,
      clearanceStatus,
      reasonsIneligible,
      clearedAt: clearanceRow?.cleared_at ? Number(clearanceRow.cleared_at) : null,
      clearedBy: clearanceRow?.cleared_by_user_id || null,
      digitalCertificateHash: clearanceRow?.digital_certificate_hash || null,
      remarks: clearanceRow?.remarks || null,
    };
  }

  /**
   * Mark a student as "Cleared" in the Digital Clearance system
   * Strictly enforces zero unreturned books and zero outstanding fines
   */
  async grantClearance(
    studentIdOrMatric: string,
    officerUserId: string = 'usr-lib-001',
    remarks?: string
  ): Promise<{
    success: boolean;
    message: string;
    clearanceDossier: StudentClearanceDossier;
    certificateHash: string;
  }> {
    const student = await this.resolveStudent(studentIdOrMatric);

    // 1. Verify Active Unreturned Books
    const activeLoans = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM book_loans WHERE student_id = ? AND status != 'RETURNED'`,
      [student.id]
    );

    if (Number(activeLoans?.count || 0) > 0) {
      throw new Error(
        `Clearance Prohibited: Student '${student.matric_number}' has ${activeLoans?.count} unreturned book(s). All borrowed materials must be returned before clearance.`
      );
    }

    // 2. Verify Unpaid Library Fines
    const unpaidFines = await this.db.queryFirst<{ count: number; totalKobo: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount_kobo), 0) as totalKobo 
       FROM library_fines WHERE student_id = ? AND status = 'UNPAID'`,
      [student.id]
    );

    if (Number(unpaidFines?.totalKobo || 0) > 0) {
      throw new Error(
        `Clearance Prohibited: Student '${student.matric_number}' has unpaid library liabilities of ${LedgerEngine.koboToNaira(Number(unpaidFines?.totalKobo))}. Fines must be settled at the Bursary prior to clearance.`
      );
    }

    // 3. Generate Cryptographic Certificate Hash
    const now = Math.floor(Date.now() / 1000);
    const rawPayload = `${student.id}:${student.matric_number}:LIBRARY_CLEARANCE_PASSED:${officerUserId}:${now}`;
    const certificateHash = await SignatureService.generateVerificationHash(rawPayload);

    // 4. Upsert Clearance Record
    const clearanceId = `clr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const effectiveRemarks = remarks || 'All borrowed books returned and zero outstanding liabilities confirmed by College Librarian.';

    const existing = await this.db.queryFirst<any>(
      `SELECT id FROM library_clearances WHERE student_id = ?`,
      [student.id]
    );

    if (existing) {
      await this.db.execute(
        `UPDATE library_clearances 
         SET status = 'CLEARED', cleared_by_user_id = ?, cleared_at = ?, remarks = ?, digital_certificate_hash = ?, updated_at = ?
         WHERE student_id = ?`,
        [officerUserId, now, effectiveRemarks, certificateHash, now, student.id]
      );
    } else {
      await this.db.execute(
        `INSERT INTO library_clearances (id, student_id, status, cleared_by_user_id, cleared_at, remarks, digital_certificate_hash, updated_at)
         VALUES (?, ?, 'CLEARED', ?, ?, ?, ?, ?)`,
        [clearanceId, student.id, officerUserId, now, effectiveRemarks, certificateHash, now]
      );
    }

    const updatedDossier = await this.getClearanceStatus(student.id);

    return {
      success: true,
      message: `Library Digital Clearance successfully stamped and granted for ${student.first_name} ${student.last_name} (${student.matric_number}).`,
      clearanceDossier: updatedDossier,
      certificateHash,
    };
  }

  // =========================================================================
  // 6. DASHBOARD TELEMETRY (getLibraryStatistics)
  // =========================================================================

  /**
   * High-level library dashboard metrics
   */
  async getLibraryStatistics(): Promise<{
    totalTitles: number;
    totalVolumes: number;
    availableVolumes: number;
    activeLoans: number;
    overdueLoans: number;
    totalFinesCount: number;
    totalFinesAssessedKobo: number;
    formattedFinesAssessed: string;
    totalStudentsCleared: number;
  }> {
    const titlesRow = await this.db.queryFirst<{ count: number; totalCopies: number; availableCopies: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_copies), 0) as totalCopies, COALESCE(SUM(available_copies), 0) as availableCopies FROM library_books`
    );

    const loans = await this.listLoans();
    const active = loans.filter((l) => l.status === 'ACTIVE').length;
    const overdue = loans.filter((l) => l.status === 'OVERDUE').length;

    const finesRow = await this.db.queryFirst<{ count: number; totalKobo: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount_kobo), 0) as totalKobo FROM library_fines`
    );

    const clearedRow = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM library_clearances WHERE status = 'CLEARED'`
    );

    const totalFines = Number(finesRow?.totalKobo || 0);

    return {
      totalTitles: titlesRow?.count || 0,
      totalVolumes: Number(titlesRow?.totalCopies || 0),
      availableVolumes: Number(titlesRow?.availableCopies || 0),
      activeLoans: active,
      overdueLoans: overdue,
      totalFinesCount: finesRow?.count || 0,
      totalFinesAssessedKobo: totalFines,
      formattedFinesAssessed: LedgerEngine.koboToNaira(totalFines),
      totalStudentsCleared: clearedRow?.count || 0,
    };
  }
}
