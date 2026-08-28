import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// If DATABASE_URL is provided, initialize Neon serverless drizzle instance
export const db = connectionString
  ? drizzleNeon(neon(connectionString), { schema })
  : (null as any);

export { schema };
