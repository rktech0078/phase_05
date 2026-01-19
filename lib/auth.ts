import { betterAuth } from 'better-auth';
import { db } from './db';
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../schemas";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
});