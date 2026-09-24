export interface Env {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  DOCUMENTS_BUCKET: R2Bucket;
  ASYNC_QUEUE: Queue<any>;

  // Secrets & Environment Variables
  JWT_SECRET: string;
  LEDGER_SIGNING_SECRET: string;
  PAYSTACK_SECRET_KEY?: string;
  REMITA_API_KEY?: string;
  REMITA_MERCHANT_ID?: string;
  REMITA_SERVICE_TYPE_ID?: string;
  VPAY_API_KEY?: string;
  VPAY_PUBLIC_KEY?: string;
  PAYVESSEL_API_KEY?: string;
  PAYVESSEL_SECRET?: string;
  TERMII_API_KEY?: string;
  RESEND_API_KEY?: string;
  ENVIRONMENT?: string;
}
