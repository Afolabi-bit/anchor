import fs from "fs";
import path from "path";
import { db, schema } from "../db";
import { encryptField } from "../lib/encryption";
import { isNull, eq } from "drizzle-orm";

async function runEncryptionMigration() {
  console.log("=== ANCHOR FIELD-LEVEL ENCRYPTION MIGRATION ===");
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = Date.now();
  const backupPath = path.join(backupDir, `backup-before-encryption-${timestamp}.json`);

  let checkInsMigrated = 0;
  let journalEntriesMigrated = 0;

  if (db) {
    console.log("Connecting to Neon Postgres...");
    // 1. Fetch all check-ins and journal entries for backup
    const allCheckIns = await db.select().from(schema.checkIns);
    const allJournals = await db.select().from(schema.journalEntries);

    // Save backup before any write
    fs.writeFileSync(
      backupPath,
      JSON.stringify({ checkIns: allCheckIns, journalEntries: allJournals }, null, 2),
      "utf-8"
    );
    console.log(`[✓] Pre-migration backup created at: ${backupPath}`);

    // 2. Migrate check_ins in place
    for (const row of allCheckIns) {
      let needsUpdate = false;
      const updates: any = {};

      // Migrate reflection if not already encrypted (reflectionIv is null)
      if (row.reflection && !row.reflectionIv) {
        const encrypted = encryptField(row.reflection);
        if (encrypted) {
          updates.reflection = encrypted.ciphertext;
          updates.reflectionIv = encrypted.iv;
          updates.reflectionKeyVersion = encrypted.keyVersion;
          needsUpdate = true;
        }
      }

      // Migrate intentionNote if not already encrypted (intentionNoteIv is null)
      if (row.intentionNote && !row.intentionNoteIv) {
        const encrypted = encryptField(row.intentionNote);
        if (encrypted) {
          updates.intentionNote = encrypted.ciphertext;
          updates.intentionNoteIv = encrypted.iv;
          updates.intentionNoteKeyVersion = encrypted.keyVersion;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await db
          .update(schema.checkIns)
          .set(updates)
          .where(eq(schema.checkIns.id, row.id));
        checkInsMigrated++;
      }
    }

    // 3. Migrate journal_entries in place
    for (const row of allJournals) {
      // If content is not null and encryptionIv is null
      if (row.content && !row.encryptionIv) {
        const encrypted = encryptField(row.content);
        if (encrypted) {
          await db
            .update(schema.journalEntries)
            .set({
              content: encrypted.ciphertext,
              encryptionIv: encrypted.iv,
              encryptionKeyVersion: encrypted.keyVersion,
            })
            .where(eq(schema.journalEntries.id, row.id));
          journalEntriesMigrated++;
        }
      }
    }
  }

  // Also migrate local store file if it exists
  const localStorePath = path.join(process.cwd(), ".local-db-store.json");
  if (fs.existsSync(localStorePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(localStorePath, "utf-8"));
      fs.writeFileSync(
        path.join(backupDir, `backup-local-store-${timestamp}.json`),
        JSON.stringify(data, null, 2),
        "utf-8"
      );

      let localCheckIns = 0;
      let localJournals = 0;

      if (Array.isArray(data.checkIns)) {
        for (const row of data.checkIns) {
          if (row.reflection && !row.reflectionIv) {
            const enc = encryptField(row.reflection);
            if (enc) {
              row.reflection = enc.ciphertext;
              row.reflectionIv = enc.iv;
              row.reflectionKeyVersion = enc.keyVersion;
              localCheckIns++;
            }
          }
          if (row.intentionNote && !row.intentionNoteIv) {
            const enc = encryptField(row.intentionNote);
            if (enc) {
              row.intentionNote = enc.ciphertext;
              row.intentionNoteIv = enc.iv;
              row.intentionNoteKeyVersion = enc.keyVersion;
              localCheckIns++;
            }
          }
        }
      }

      if (Array.isArray(data.journalEntries)) {
        for (const row of data.journalEntries) {
          if (row.content && !row.encryptionIv) {
            const enc = encryptField(row.content);
            if (enc) {
              row.content = enc.ciphertext;
              row.encryptionIv = enc.iv;
              row.encryptionKeyVersion = enc.keyVersion;
              localJournals++;
            }
          }
        }
      }

      fs.writeFileSync(localStorePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`[✓] Local store migrated: ${localCheckIns} check-in fields, ${localJournals} journal entries.`);
    } catch (e) {
      console.error("Local store migration warning:", e);
    }
  }

  console.log("=== MIGRATION SUMMARY ===");
  console.log(`Check-in records encrypted: ${checkInsMigrated}`);
  console.log(`Journal entry records encrypted: ${journalEntriesMigrated}`);
  console.log(`Backup preserved safely at: ${backupPath}`);
  console.log("=== MIGRATION COMPLETE ===");
}

runEncryptionMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
