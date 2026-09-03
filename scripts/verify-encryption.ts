import fs from "fs";
import path from "path";

// Load .env.local for script execution
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, "").trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { db, schema } from "../db";
import { createJournalEntry, upsertCheckIn } from "../lib/db-service";
import { decryptField } from "../lib/encryption";
import { eq } from "drizzle-orm";

async function verifyRawCiphertextInDatabase() {
  console.log("==================================================");
  console.log("ANCHOR DATABASE-LEVEL ENCRYPTION VERIFICATION TEST");
  console.log("==================================================");

  const testSecretText = "CONFIDENTIAL_HEALTH_RECOVERY_NOTE_98765";
  const testUserId = crypto.randomUUID();
  const testCommitmentId = crypto.randomUUID();
  const testDate = "2026-09-03";

  console.log(`1. Creating temporary test user and commitment in database...`);
  const testUser = await db
    .insert(schema.users)
    .values({
      email: `test-encryption-${Date.now()}@anchor.test`,
      passwordHash: "test-hash",
    })
    .returning();

  const testComm = await db
    .insert(schema.commitments)
    .values({
      userId: testUser[0].id,
      name: "Test Recovery Anchor",
    })
    .returning();

  console.log(`2. Creating encrypted check-in with sensitive text: "${testSecretText}"...`);

  // Write check-in through db-service
  const createdCheckIn = await upsertCheckIn({
    userId: testUser[0].id,
    commitmentId: testComm[0].id,
    date: testDate,
    type: "evening",
    reflection: testSecretText,
    intentionNote: "CONFIDENTIAL_MORNING_INTENTION_54321",
    status: "yes",
  });

  // Verify that createdCheckIn returns plaintext transparently
  if (createdCheckIn.reflection !== testSecretText) {
    throw new Error(`Application read layer failed to decrypt! Received: ${createdCheckIn.reflection}`);
  }
  console.log("[✓] Application read layer returned decrypted text transparently.");

  if (db) {
    // 2. Query the raw database row directly without any decryption helper
    console.log("2. Querying raw database table directly...");
    const rawRows = await db
      .select()
      .from(schema.checkIns)
      .where(eq(schema.checkIns.id, createdCheckIn.id))
      .limit(1);

    if (rawRows.length === 0) {
      throw new Error("Could not find inserted test row in raw database!");
    }

    const raw = rawRows[0];
    console.log("Raw check_in record from database:");
    console.log(`  reflection (raw): "${raw.reflection}"`);
    console.log(`  reflection_iv: "${raw.reflectionIv}"`);
    console.log(`  reflection_key_version: "${raw.reflectionKeyVersion}"`);

    // ASSERTION 1: Raw column is NOT plaintext
    if (raw.reflection?.includes(testSecretText)) {
      throw new Error("CRITICAL SECURITY FAILURE: Raw reflection is stored as PLAINTEXT!");
    }
    console.log("[✓] PASS: Raw reflection in database is encrypted ciphertext, NOT plaintext.");

    // ASSERTION 2: IV and KeyVersion are populated
    if (!raw.reflectionIv || raw.reflectionIv.length !== 24) {
      throw new Error(`Invalid IV length: ${raw.reflectionIv}`);
    }
    console.log("[✓] PASS: Valid 12-byte IV (24 hex characters) recorded.");

    if (raw.reflectionKeyVersion !== "v1") {
      throw new Error(`Unexpected key version: ${raw.reflectionKeyVersion}`);
    }
    console.log("[✓] PASS: Key version 'v1' recorded for rotation tracking.");

    // ASSERTION 3: Direct cryptographic decryption recovers plaintext
    const directlyDecrypted = decryptField(
      raw.reflection,
      raw.reflectionIv,
      raw.reflectionKeyVersion
    );

    if (directlyDecrypted !== testSecretText) {
      throw new Error(`Direct cryptographic decryption mismatch! Got: ${directlyDecrypted}`);
    }
    console.log("[✓] PASS: Direct cryptographic decryption cleanly restored the original text.");

    // 3. Test Journal Entry
    console.log("\n3. Testing journal_entries raw encryption...");
    const journal = await createJournalEntry({
      userId: testUser[0].id,
      date: testDate,
      title: "Confidential Entry",
      content: testSecretText,
    });

    const rawJournals = await db
      .select()
      .from(schema.journalEntries)
      .where(eq(schema.journalEntries.id, journal.id))
      .limit(1);

    const rawJ = rawJournals[0];
    console.log(`  content (raw): "${rawJ.content}"`);
    console.log(`  encryption_iv: "${rawJ.encryptionIv}"`);

    if (rawJ.content.includes(testSecretText)) {
      throw new Error("CRITICAL SECURITY FAILURE: Raw journal content is stored as PLAINTEXT!");
    }
    console.log("[✓] PASS: Raw journal content in database is encrypted ciphertext.");

    // Clean up test user (cascades to commitments, check-ins, journal entries)
    await db.delete(schema.users).where(eq(schema.users.id, testUser[0].id));
    console.log("[✓] Test rows cleanly deleted.");
  }

  console.log("==================================================");
  console.log("ALL ENCRYPTION VERIFICATION CHECKS PASSED (100%)");
  console.log("==================================================");
}

verifyRawCiphertextInDatabase().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
