# COEKA Portal — Cloudflare WAF & Security Specification (WAF_RULES.md)
**Document Version:** 1.0.0  
**Target Environment:** College of Education, Katsina-Ala (COEKA) Production Edge Infrastructure  
**Author:** ICT & Directorate of System Architecture  
**Scope:** Cloudflare WAF, DDoS Mitigation, Bot Management, and Edge Security Headers  

---

## 1. Defense-in-Depth Architectural Matrix

Security is enforced across four distinct computational boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Layer 1: Cloudflare WAF                         │
│   (Rate Limiting, Managed OWASP Ruleset, Bot Scraper Mitigation, Geo)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                 Layer 2: Edge Worker Middleware (Hono)                 │
│   (Strict CSP, HSTS, X-Frame-Options, Nosniff, In-Memory Rate Limit)   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                   Layer 3: Zod Schema Validation                       │
│    (Strict Type Enforcement, SQLi Token Rejection, Body Sanitization)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│             Layer 4: Parameterized D1 Database & KV Sessions           │
│   (Zero Raw String Concatenation, Cryptographic Session Rotation)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cloudflare Dashboard WAF Ruleset Configuration

Configure these rules under **Security → WAF → Custom Rules** and **Rate Limiting Rules** in the Cloudflare Dashboard:

### Rule 1: Login Endpoint Brute-Force Rate Limiting
* **Rule Name:** `COEKA-RL-01: Protect Authentication Gateway`
* **Trigger URI:** `(http.request.uri.path eq "/api/auth/login" and http.request.method eq "POST")`
* **Rate Limit:** **10 requests** per **1 minute** per Client IP
* **Action:** **Managed Challenge** (or Block with HTTP 429)
* **Mitigation Duration:** 10 minutes
* **Description:** Mitigates credential stuffing, password spray, and automated account compromise attacks against student and administrative portals.

### Rule 2: Global API Abuse Mitigation
* **Rule Name:** `COEKA-RL-02: Global API Rate Limiting`
* **Trigger URI:** `(starts_with(http.request.uri.path, "/api/"))`
* **Rate Limit:** **100 requests** per **1 minute** per Client IP
* **Action:** **Managed Challenge**
* **Mitigation Duration:** 5 minutes
* **Description:** Prevents DoS attempts and computational exhaustion of Cloudflare Workers and D1 database instances.

### Rule 3: Anti-Scraping Bot Management on Public Credential Verification
* **Rule Name:** `COEKA-BOT-01: Shield Public Verification from Malicious Scrapers`
* **Trigger URI:** `(starts_with(http.request.uri.path, "/api/registrar/verify/"))`
* **Expression:**
  ```
  (starts_with(http.request.uri.path, "/api/registrar/verify/") and 
   (cf.bot_management.score lt 30 or cf.client.bot) and 
   not cf.bot_management.verified_bot)
  ```
* **Action:** **Block**
* **Description:** While `/api/registrar/verify/:id` is public for legitimate employers and NYSC verifiers, automated scraping bots attempting to mass-harvest graduate identities are blocked.

### Rule 4: Geo-Fencing & High-Risk Administrative Challenge
* **Rule Name:** `COEKA-GEO-01: Challenge Foreign Admin & Bursary Access`
* **Expression:**
  ```
  ((starts_with(http.request.uri.path, "/api/admin") or 
    starts_with(http.request.uri.path, "/api/bursar")) and 
   ip.geoip.country ne "NG" and 
   ip.geoip.country ne "XX" and 
   ip.geoip.country ne "T1")
  ```
* **Action:** **Managed Challenge** (Cloudflare Turnstile)
* **Description:** Any administrative or financial transaction originating from outside Nigeria is presented with a non-intrusive interactive cryptographic challenge, blocking automated overseas botnets.

### Rule 5: Cloudflare Managed Ruleset (OWASP Core Ruleset)
* **Status:** Enabled
* **Ruleset:** Cloudflare Managed Ruleset & Cloudflare OWASP Core Ruleset
* **Paranoia Level:** PL2
* **Anomaly Score Threshold:** 40 (High sensitivity)
* **Action:** Block matching SQL Injection (SQLi), Cross-Site Scripting (XSS), Remote Code Execution (RCE), and Local File Inclusion (LFI).

---

## 3. Edge HTTP Security Headers

Injected globally into all HTTP responses via [`src/api/index.ts`](file:///C:/Users/sefat/.gemini/antigravity/scratch/coeka-portal/src/api/index.ts):

| Header | Production Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents browser MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking and framing attacks |
| `X-XSS-Protection` | `1; mode=block` | Blocks page render on reflected XSS detection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects sensitive URL params from third parties |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Enforces HTTPS exclusively for 1 year |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables invasive browser APIs |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';` | Restricts script execution to approved domains |

---

## 4. Session Rotation on Privilege Escalation

Session rotation prevents Session Hijacking and Privilege Escalation attacks:
1. When a user is promoted (e.g. Lecturer → Dean or Admin), the current session ID in KV is deleted immediately.
2. A new cryptographically secure 192-bit session token (`coeka_sess_<hex>`) is generated with refreshed database permissions.
3. The new token is set via `httpOnly`, `SameSite`, and `Secure` cookies.

---

## 5. Automated Verification Checklist

Run the verification test suite to ensure the shield is active:

```bash
npm test tests/securityHardening.test.ts
```

Verifies:
- [x] Malicious SQL Injection strings (`' OR 1=1 --`, `UNION SELECT`) are caught and blocked with HTTP 400 Bad Request.
- [x] Security headers are present on all API responses (`nosniff`, `DENY`, `CSP`).
- [x] Session rotation regenerates tokens upon promotion in KV.
- [x] Rate limiter throttles excessive consecutive requests.
