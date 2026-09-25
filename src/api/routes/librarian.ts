import { Hono } from 'hono';
import { Env } from '../../types/env';
import { getContainer } from '../../infrastructure/container';
import { requireAuth, requireRole } from '../middleware/rbac';
import { LibrarianService } from '../../services/library/libraryService';

export const librarianRoutes = new Hono<{ Bindings: Env }>();

// All librarian routes require authentication and LIBRARIAN, SUPER_ADMIN, or ADMIN role
librarianRoutes.use('*', requireAuth, requireRole(['LIBRARIAN', 'SUPER_ADMIN', 'ADMIN']));

/**
 * GET /api/librarian/stats
 * Telemetry on total titles, volumes, active & overdue loans, and clearances
 */
librarianRoutes.get('/stats', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);

  try {
    const stats = await service.getLibraryStatistics();
    return c.json({ stats });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch library statistics' }, 500);
  }
});

/**
 * GET /api/librarian/books
 * Searchable catalog of library assets
 */
librarianRoutes.get('/books', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);

  const search = c.req.query('search');
  const category = c.req.query('category');
  const availableOnly = c.req.query('availableOnly') === 'true';

  try {
    const books = await service.listBooks({ search, category, availableOnly });
    return c.json({ books, count: books.length });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch library books' }, 500);
  }
});

/**
 * GET /api/librarian/books/:id
 * Retrieve details of a specific book and its active loans
 */
librarianRoutes.get('/books/:id', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);
  const id = c.req.param('id');

  try {
    const details = await service.getBookById(id);
    return c.json(details);
  } catch (error: any) {
    return c.json({ error: error.message || 'Book not found' }, 404);
  }
});

/**
 * POST /api/librarian/books
 * Add a new book title to inventory
 */
librarianRoutes.post('/books', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);

  try {
    const body = await c.req.json();
    const book = await service.addBook(body);
    return c.json({ success: true, message: 'Book cataloged successfully', book }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to catalog book' }, 400);
  }
});

/**
 * GET /api/librarian/loans
 * List loans (Active, Overdue, Returned)
 */
librarianRoutes.get('/loans', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);

  const status = c.req.query('status');
  const studentId = c.req.query('studentId');
  const bookId = c.req.query('bookId');
  const search = c.req.query('search');

  try {
    const loans = await service.listLoans({ status, studentId, bookId, search });
    return c.json({ loans, count: loans.length });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch loans' }, 500);
  }
});

/**
 * POST /api/librarian/loans/issue
 * Issue a book to a student
 */
librarianRoutes.post('/loans/issue', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { bookId, studentId, dueDate, notes } = body;

    if (!bookId || !studentId) {
      return c.json({ error: 'Validation Error: bookId and studentId are required to issue a loan.' }, 400);
    }

    const loan = await service.issueBook({
      bookId,
      studentId,
      dueDate,
      staffId: user?.userId || 'usr-lib-001',
      notes,
    });

    return c.json({ success: true, message: 'Book issued successfully', loan }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to issue book' }, 400);
  }
});

/**
 * POST /api/librarian/loans/:id/return
 * Mark book returned and calculate overdue/damage fines
 */
librarianRoutes.post('/loans/:id/return', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await service.returnBook(id, {
      ...body,
      staffId: user?.userId || 'usr-lib-001',
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to process return' }, 400);
  }
});

/**
 * POST /api/librarian/loans/:id/remind
 * Transmit overdue reminder notification to borrower
 */
librarianRoutes.post('/loans/:id/remind', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);
  const id = c.req.param('id');

  try {
    const result = await service.sendLoanReminder(id);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to transmit reminder' }, 400);
  }
});

/**
 * GET /api/librarian/fines
 * List and filter library fines
 */
librarianRoutes.get('/fines', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);

  const studentId = c.req.query('studentId');
  const status = c.req.query('status');
  const search = c.req.query('search');

  try {
    const fines = await service.listFines({ studentId, status, search });
    return c.json({ fines, count: fines.length });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch library fines' }, 500);
  }
});

/**
 * POST /api/librarian/fines
 * Apply fine to student account (automatically creates invoice in Bursar ledger)
 */
librarianRoutes.post('/fines', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { studentId, amountKobo, reason, loanId } = body;

    if (!studentId || amountKobo === undefined || !reason) {
      return c.json({ error: 'Validation Error: studentId, amountKobo, and reason are required.' }, 400);
    }

    const fine = await service.applyFine(
      studentId,
      Number(amountKobo),
      reason,
      loanId,
      user?.userId || 'usr-lib-001'
    );

    return c.json({
      success: true,
      message: 'Library fine applied and invoice pushed to Bursary ledger successfully.',
      fine,
    }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to apply library fine' }, 400);
  }
});

/**
 * GET /api/librarian/clearance/check/:studentId
 * Check student clearance eligibility & liabilities
 */
librarianRoutes.get('/clearance/check/:studentId', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);
  const studentId = c.req.param('studentId');

  try {
    const dossier = await service.getClearanceStatus(studentId);
    return c.json({ dossier });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to inspect clearance status' }, 400);
  }
});

/**
 * POST /api/librarian/clearance/grant
 * Officially grant library clearance stamp
 */
librarianRoutes.post('/clearance/grant', async (c) => {
  const container = getContainer(c.env);
  const service = new LibrarianService(container.db, container.cache, container.queue);
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { studentId, remarks } = body;

    if (!studentId) {
      return c.json({ error: 'Validation Error: studentId is required to grant clearance.' }, 400);
    }

    const result = await service.grantClearance(
      studentId,
      user?.userId || 'usr-lib-001',
      remarks
    );

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message || 'Clearance could not be granted' }, 400);
  }
});
