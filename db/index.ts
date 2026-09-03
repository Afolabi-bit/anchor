import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

import fs from "fs";
import path from "path";

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) connectionString = match[1];
    }
  } catch {}
}

// If DATABASE_URL is provided, initialize Neon serverless drizzle instance
export const db = connectionString
  ? drizzleNeon(neon(connectionString), { schema })
  : (null as any);

export { schema };
