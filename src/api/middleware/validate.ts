import { Context, Next } from 'hono';
import { z, ZodSchema } from 'zod';

/**
 * SQL Injection detection pattern to reject suspicious query payload characters
 * before reaching database queries or ORM layers.
 */
export const SQL_INJECTION_REGEX = /('|"|;|--|\/\*|\*\/|union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+set|\bor\b\s+['"\d\w]+\s*=\s*['"\d\w]+|\band\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i;

/**
 * Zod refinement helper to ensure a string is clean of SQL injection tokens.
 */
export const safeString = (min: number = 1, max: number = 255) =>
  z.string()
    .min(min, `Minimum length is ${min}`)
    .max(max, `Maximum length is ${max}`)
    .refine((val) => !SQL_INJECTION_REGEX.test(val), {
      message: 'Potential SQL injection or unauthorized character sequence detected',
    });

// ─── Institutional Core Validation Schemas ───────────────────────────────────

export const LoginSchema = z
  .object({
    identifier: z.string().max(100).optional(),
    username: z.string().max(100).optional(),
    email: z.string().max(100).optional(),
    password: z.string({ required_error: 'password is required' }).min(1, 'password is required').max(128),
  })
  .refine(
    (data) => {
      const id = data.identifier || data.username || data.email;
      if (!id || id.trim().length < 2) return false;
      return !SQL_INJECTION_REGEX.test(id);
    },
    {
      message: 'Valid username or email is required with no SQL injection tokens',
      path: ['identifier'],
    }
  );

export const PromoteUserSchema = z.object({
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
});

export const ChangeUserRoleSchema = z.object({
  role: z.enum([
    'SUPER_ADMIN',
    'ADMIN',
    'DEAN',
    'HOD',
    'LECTURER',
    'BURSAR',
    'LIBRARIAN',
    'STUDENT',
    'PARENT',
    'REGISTRAR',
    'EXAM_OFFICER',
  ]),
  reason: z.string().max(255).optional(),
});

export const CreateCourseSchema = z.object({
  programmeId: safeString(2, 50),
  code: safeString(2, 20),
  title: safeString(3, 150),
  creditUnits: z.number().int().min(1).max(6),
  departmentId: safeString(2, 50).optional(),
  level: z.number().int().min(100).max(600),
  semesterTerm: z.number().int().min(1).max(2).optional(),
  semester: z.number().int().min(1).max(2).optional(),
  isCompulsory: z.boolean().optional(),
  isElective: z.boolean().optional(),
  prerequisiteCourseId: z.string().max(50).optional(),
});

export const SetFeeScheduleSchema = z
  .object({
    categoryId: safeString(2, 50).optional(),
    divisionId: safeString(2, 50).optional(),
    sessionId: safeString(2, 50).optional(),
    level: z.number().int().min(100).max(600),
    amountKobo: z.number().int().min(0, 'Amount in Kobo cannot be negative').optional(),
    amountNaira: z.number().min(0, 'Amount in Naira cannot be negative').optional(),
    mandatory: z.boolean().optional(),
    description: z.string().max(255).optional(),
  })
  .refine(
    (data) => data.amountKobo !== undefined || data.amountNaira !== undefined,
    {
      message: 'Either amountKobo or amountNaira must be provided',
      path: ['amountKobo'],
    }
  );

export const ReconcilePaymentSchema = z.object({
  transactionId: safeString(3, 100),
  studentId: safeString(3, 100),
  amountKobo: z.number().int().min(0).optional(),
  invoiceId: safeString(3, 100).optional(),
  notes: z.string().max(500).optional(),
});

export const IssueCertificateSchema = z.object({
  studentId: safeString(3, 100),
  confermentDate: z.string().max(50).optional(),
  qualification: safeString(2, 100).optional(),
});

export const CertifyBroadsheetSchema = z.object({
  broadsheetId: safeString(3, 100),
});

// ─── Middleware Factory ──────────────────────────────────────────────────────

/**
 * Validates request body with strict Zod schema.
 * Rejects malformed JSON or unvalidated data with HTTP 400 Bad Request.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          error: 'Malformed JSON payload: Request body must be valid JSON',
        },
        400
      );
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      const errorDetails = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      const detailSummary = errorDetails.map((e) => e.message).join('; ');
      return c.json(
        {
          success: false,
          error: `Validation Error: Input Validation Failed. ${detailSummary}`,
          details: errorDetails,
        },
        400
      );
    }

    // Attach validated and sanitized data to context
    c.set('validBody', result.data);
    await next();
  };
}
