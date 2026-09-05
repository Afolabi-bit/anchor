import { neon } from "@neondatabase/serverless";
import fs from "fs";

const content = fs.readFileSync(".env.local", "utf-8");
const m = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const sql = neon(m[1]);
const users = await sql`SELECT * FROM users`;
console.log("USERS:", JSON.stringify(users, null, 2));
const comms = await sql`SELECT * FROM commitments`;
console.log("COMMITMENTS:", JSON.stringify(comms, null, 2));
