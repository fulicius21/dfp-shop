/**
 * Drizzle Kit Konfiguration für Datenbankmigrationen
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Environment Variables laden
dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  },
  verbose: true,
  strict: true,
} satisfies Config;
