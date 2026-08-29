import { defineConfig } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

let dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) dbUrl = match[1];
    }
  } catch {}
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
