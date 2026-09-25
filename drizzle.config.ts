import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations-drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '2505509c9d45ab58888c430de12d58c8',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || '52040074-37c6-4b74-9b05-e873fe5e181d',
    token: process.env.CLOUDFLARE_D1_TOKEN || 'mock-token',
  },
  verbose: true,
  strict: true,
});
