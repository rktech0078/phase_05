import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schemas';

let client: Pool;
let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === 'production') {
  client = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });
} else {
  // In development, use a global client to avoid creating too many connections
  if (!global.dbClient) {
    global.dbClient = new Pool({
      connectionString: process.env.DATABASE_URL!,
    });
  }
  client = global.dbClient;
}

db = drizzle(client, { schema });

export { db };