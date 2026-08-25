import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Fail fast in local development so authentication can use its local fallback.
export const db = drizzle({
  connection: { connectionString: process.env.DATABASE_URL!, connectionTimeoutMillis: 3500 },
  schema,
});
