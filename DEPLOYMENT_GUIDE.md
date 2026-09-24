# COEKA ENTERPRISE DIGITAL CAMPUS PORTAL
## CLOUDFLARE EDGE DEPLOYMENT & PRODUCTION RUNBOOK

**Target Environment:** Cloudflare Workers, Pages, D1 SQL, KV, Queues, and R2  
**Domain:** `portal.coekatsinaala.edu.ng` / `api.coekatsinaala.edu.ng`  
**Author:** Fruitfulujah Project Technical Team  

---

## 1. Prerequisites & Tooling

Ensure you have the following installed on your engineering terminal:
* **Node.js:** v20+ or v22+ LTS
* **npm:** v10+
* **Cloudflare Wrangler CLI:** v3.90+ (`npm install -g wrangler` or `npx wrangler`)

Authenticate your Cloudflare account:
```bash
npx wrangler login
```

---

## 2. Cloudflare Service Provisioning

### 2.1 Provision Cloudflare D1 Database
Execute on the terminal to create the serverless SQL database:
```bash
npx wrangler d1 create coeka-production-db
```
*Note the returned `database_id` and update it inside `wrangler.toml`:*
```toml
[[d1_databases]]
binding = "DB"
database_name = "coeka-production-db"
database_id = "<YOUR_PROVISIONED_DATABASE_ID>"
```

### 2.2 Apply D1 Database Migrations
Apply the initial schema and seed data to the remote Cloudflare D1 database:
```bash
# 1. Apply Schema (10 Subsystems DDL)
npx wrangler d1 execute coeka-production-db --remote --file=./src/database/migrations/0001_initial_schema.sql

# 2. Apply Seed Baseline Data (Divisions, Faculties, Programmes, Fee Schedules)
npx wrangler d1 execute coeka-production-db --remote --file=./src/database/migrations/0002_seed_data.sql
```

### 2.3 Provision Cloudflare KV Namespaces
Create the stateful session and sliding-window rate limit stores:
```bash
npx wrangler kv:namespace create SESSION_KV
npx wrangler kv:namespace create RATE_LIMIT_KV
```
Update the returned namespace IDs inside `wrangler.toml`.

### 2.4 Provision Cloudflare R2 Document Lake
Create the S3-compatible document storage bucket:
```bash
npx wrangler r2 bucket create coeka-document-lake
```

### 2.5 Provision Cloudflare Queue
Create the background task broker for asynchronous notifications and financial reconciliations:
```bash
npx wrangler queues create coeka-async-queue
```

---

## 3. Secret Management & Payment Rails Configuration

Set production cryptographic secrets using Wrangler secret commands:

```bash
# Core Security Secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put LEDGER_SIGNING_SECRET

# Payment Gateway Secrets
npx wrangler secret put PAYSTACK_SECRET_KEY
npx wrangler secret put VPAY_API_KEY
npx wrangler secret put VPAY_PUBLIC_KEY
npx wrangler secret put REMITA_MERCHANT_ID
npx wrangler secret put REMITA_API_KEY
npx wrangler secret put REMITA_SERVICE_TYPE_ID

# Communications
npx wrangler secret put TERMII_API_KEY
npx wrangler secret put RESEND_API_KEY
```

---

## 4. Building & Deployment

### 4.1 Build Frontend Assets
Compile the React 19 Single Page Application into the `./dist` directory:
```bash
npm run build
```

### 4.2 Deploy to Cloudflare Edge
Deploy both the Hono REST API Worker and the compiled static assets in a single step:
```bash
npx wrangler deploy
```

---

## 5. Local Development & Testing

### 5.1 Run Local Development Server
To launch Vite with hot-module replacement on port 3000:
```bash
npm run dev
```

### 5.2 Run Local Backend API Server
To run the Hono backend API on Node.js port 8787:
```bash
npm run serve:api
```

### 5.3 Run Vitest Automated Test Suite
To execute all 16 unit tests:
```bash
npm test
```

---

## 6. Verification Checklist Before Go-Live

1. [ ] **Health Endpoint:** Query `https://portal.coekatsinaala.edu.ng/api/health` and verify HTTP 200 `healthy`.
2. [ ] **D1 Integrity:** Query `SELECT count(*) FROM divisions;` and confirm 4 rows (`NCE`, `DEGREE`, `SECONDARY`, `PRIMARY`).
3. [ ] **Virtual Accounts:** Test webhook delivery from VPay sandbox to `/api/webhooks/vpay`.
4. [ ] **Paystack Webhook:** Confirm HMAC-SHA512 verification at `/api/webhooks/paystack`.
5. [ ] **DNS Cutover:** Ensure CNAME for `portal.coekatsinaala.edu.ng` points to Cloudflare Worker route.
