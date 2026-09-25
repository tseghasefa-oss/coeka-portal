# COEKA ENTERPRISE DIGITAL CAMPUS PORTAL
## CLOUDFLARE EDGE DEPLOYMENT & PRODUCTION RUNBOOK

**Target Environment:** Cloudflare Workers, Cloudflare Pages, D1 SQL (Drizzle ORM), KV Namespaces, Queues, and R2  
**Domain:** `portal.coekatsinaala.edu.ng` / `api.coekatsinaala.edu.ng`  
**Architecture:** Golden Stack (Hono + Drizzle ORM + D1 + Cloudflare Workers/Pages + React + TanStack Query + Zustand)

---

## Phase 0: Authentication Prerequisite

Before executing any `wrangler` provisioning commands, you must authenticate your terminal with your Cloudflare account.

### Option A: Interactive Browser Login (Recommended)
Run this command in your local PowerShell or bash terminal:
```powershell
npx wrangler login
```
*This opens your default web browser to authorize the Wrangler CLI with your Cloudflare account.*

### Option B: Cloudflare API Token (Non-Interactive / CI/CD)
If deploying via automated script, GitHub Actions, or a non-interactive shell:
1. Go to the [Cloudflare Dashboard $\rightarrow$ API Tokens](https://dash.cloudflare.com/profile/api-tokens).
2. Create a custom token with permissions for:
   * **Account:** `D1:Edit`, `Workers KV Storage:Edit`, `Workers R2 Storage:Edit`, `Workers Queue:Edit`
   * **Zone / User:** `Workers Scripts:Edit`, `Cloudflare Pages:Edit`
3. Set the environment variable in your terminal:
   ```powershell
   # Windows PowerShell
   $env:CLOUDFLARE_API_TOKEN = "your_cloudflare_api_token_here"

   # macOS / Linux / Bash
   export CLOUDFLARE_API_TOKEN="your_cloudflare_api_token_here"
   ```

Verify authentication:
```powershell
npx wrangler whoami
```

---

## Phase 1: Infrastructure Provisioning

Run these commands in your terminal from the project root (`coeka-portal`).

### 1. Create the D1 Database
```powershell
npx wrangler d1 create coeka-production-db
```
*Output will provide your `database_id` (e.g. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Paste it into `wrangler.toml` under `[[d1_databases]]`:*
```toml
[[d1_databases]]
binding = "DB"
database_name = "coeka-production-db"
database_id = "<PASTE_YOUR_DATABASE_ID_HERE>"
migrations_dir = "src/database/migrations-drizzle"
```

### 2. Create the KV Namespaces
```powershell
# Create the Session store
npx wrangler kv:namespace create SESSION_KV

# Create the Rate Limit store
npx wrangler kv:namespace create RATE_LIMIT_KV
```
*Copy the returned IDs and paste them into `wrangler.toml` under `[[kv_namespaces]]`:*
```toml
[[kv_namespaces]]
binding = "SESSION_KV"
id = "<PASTE_SESSION_KV_ID_HERE>"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "<PASTE_RATE_LIMIT_KV_ID_HERE>"
```

### 3. Create the R2 Document Lake
```powershell
npx wrangler r2 bucket create DOCUMENTS_BUCKET
```
*Ensure the bucket name in `wrangler.toml` matches:*
```toml
[[r2_buckets]]
binding = "DOCUMENTS_BUCKET"
bucket_name = "DOCUMENTS_BUCKET"
```

### 4. Create the Asynchronous Processing Queue
```powershell
npx wrangler queues create coeka-async-queue
```

---

## Phase 2: Database Schema & Seeding

Push your type-safe Drizzle migrations and initial institutional baseline data to the live D1 database.

### 1. Apply Drizzle Migrations
```powershell
# Applies all Drizzle migrations from src/database/migrations-drizzle/ to live D1
npx wrangler d1 migrations apply coeka-production-db --remote
```
*(Press `y` when prompted to execute the migration batches on remote).*

### 2. Upload Seed Data
Populate institutional divisions (NCE, Degree, Secondary, Primary), faculties, departments, programmes, fee categories, initial fee schedules, hostel rooms, and seed accounts:
```powershell
npx wrangler d1 execute coeka-production-db --remote --file=src/database/migrations/0002_seed_data.sql
```

---

## Phase 3: Backend API Deployment

The API is built with Hono and deployed as a Cloudflare Worker at the edge.

### 1. Set Production Secrets (Optional but Recommended)
```powershell
npx wrangler secret put JWT_SECRET
npx wrangler secret put LEDGER_SIGNING_SECRET
npx wrangler secret put VPAY_API_KEY
npx wrangler secret put PAYSTACK_SECRET_KEY
```

### 2. Deploy the Worker API
```powershell
npx wrangler deploy
```
*Copy the returned Worker endpoint URL (e.g. `https://coeka-portal.your-account.workers.dev`).*

---

## Phase 4: Frontend Deployment (Cloudflare Pages)

The frontend is a high-performance React SPA.

### 1. Build Production Assets
```powershell
npm run build
```
*This executes `tsc && vite build`, outputting optimized bundles to `./dist`.*

### 2. Deploy to Cloudflare Pages

#### Option A: Direct Deployment via Wrangler CLI
```powershell
npx wrangler pages deploy dist --project-name=coeka-portal
```

#### Option B: GitHub Repository CI/CD Integration
1. Push your code to GitHub.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
3. Select your repository and configure:
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Build Output Directory:** `dist`

### 3. Set the API URL Environment Variable
In Cloudflare Pages Dashboard $\rightarrow$ **Your Project** $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**:
* Add variable: `VITE_API_URL` = `https://coeka-portal.your-account.workers.dev`
*(Redeploy or trigger a new build after setting this variable so the client hooks connect to your live API).*

---

## Phase 5: Final Smoke Test Checklist

Once the production deployment finishes, execute this 5-point verification run:

1. **Authentication Flow:**
   * Navigate to `https://<your-pages-subdomain>.pages.dev/login`.
   * Log in with Super Admin credentials (`founder_tsegha` / `Password123!`).
   * Verify automatic redirect lands on `/admin` with the executive greeting.
2. **Database Connectivity:**
   * Open the **Academic Management** tab.
   * Verify that accredited NCE and Degree courses appear from the remote D1 database.
3. **Financial Integrity & Real-Time Sync:**
   * Go to **Financial Price Setting** in the Admin panel and update an institutional fee schedule.
   * Log in with a student account (`std_iorliam` / `Password123!`).
   * Verify the fee invoice balance updates in real-time.
4. **Storage (R2):**
   * Upload a digital document (student ID or academic record).
   * Verify persistence across page refresh.
5. **RBAC Guard Enforcement:**
   * While logged in as a student, manually enter `/admin` in the browser URL bar.
   * Verify the route guard immediately intercepts access and redirects back to the Student Dashboard (`/sims`).

---

## Troubleshooting Common Live Errors

* **403 Forbidden on API Requests:** Check that `wrangler.toml` bindings (`DB`, `SESSION_KV`, `RATE_LIMIT_KV`, `DOCUMENTS_BUCKET`) match the exact IDs in your Cloudflare dashboard.
* **CORS Blocked Errors:** In `src/api/index.ts`, CORS middleware dynamically allows origin reflection with credentials (`allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`).
* **White Screen on Frontend:** Open browser DevTools Console. If `VITE_API_URL is undefined`, ensure the `VITE_API_URL` environment variable was added in Cloudflare Pages and the frontend was redeployed.
