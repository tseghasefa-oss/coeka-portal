import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations-drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'mock-account-id',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || 'coeka-d1-prod-001',
    token: process.env.CLOUDFLARE_D1_TOKEN || 'mock-token',
  },
  verbose: true,
  strict: true,
});
