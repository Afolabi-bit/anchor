import crypto from "crypto";

const CURRENT_KEY_VERSION = process.env.ANCHOR_KEY_VERSION || "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits

export interface EncryptedFieldResult {
  ciphertext: string;
  iv: string;
  keyVersion: string;
}

/**
 * Abstracted Key Management Provider.
 * Currently reads from environment variable ANCHOR_ENCRYPTION_KEY,
 * structured so this single function can be swapped for an external
 * KMS call (e.g. AWS KMS GenerateDataKey / Decrypt) without touching calling code.
 */
export function getEncryptionKey(version: string = CURRENT_KEY_VERSION): {
  key: Buffer;
  version: string;
} {
  const secret = process.env.ANCHOR_ENCRYPTION_KEY || process.env.DATABASE_URL;

  if (!secret) {
    throw new Error(
      "Missing encryption secret: ANCHOR_ENCRYPTION_KEY must be set in your environment or .env.local file."
    );
  }

  // Derive a deterministic 256-bit (32-byte) key using SHA-256
  const key = crypto
    .createHash("sha256")
    .update(`${secret}:${version}`)
    .digest();

  return { key, version };
}

/**
 * Encrypts a single sensitive free-text field using AES-256-GCM.
 * Only intended for sensitive text: check_ins.reflection, check_ins.intention_note, journal_entries.content.
 */
export function encryptField(
  plaintext: string | null | undefined,
): EncryptedFieldResult | null {
  if (!plaintext || typeof plaintext !== "string" || !plaintext.trim()) {
    return null;
  }

  const { key, version } = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine ciphertext and auth tag into single base64 payload
  const combinedPayload = Buffer.concat([encrypted, authTag]).toString(
    "base64",
  );

  return {
    ciphertext: combinedPayload,
    iv: iv.toString("hex"),
    keyVersion: version,
  };
}

/**
 * Decrypts an encrypted field payload using AES-256-GCM.
 * Gracefully handles legacy plaintext or missing IVs during migration transitions.
 */
export function decryptField(
  ciphertext: string | null | undefined,
  iv: string | null | undefined,
  keyVersion: string | null | undefined = CURRENT_KEY_VERSION,
): string | null {
  if (!ciphertext || typeof ciphertext !== "string") {
    return null;
  }

  // If no IV is present, this is legacy plaintext stored prior to encryption migration
  if (!iv) {
    return ciphertext;
  }

  try {
    const { key } = getEncryptionKey(keyVersion || CURRENT_KEY_VERSION);
    const ivBuffer = Buffer.from(iv, "hex");
    const combinedBuffer = Buffer.from(ciphertext, "base64");

    if (combinedBuffer.length < AUTH_TAG_LENGTH_BYTES) {
      return ciphertext; // Fallback to raw value if malformed
    }

    const authTag = combinedBuffer.subarray(
      combinedBuffer.length - AUTH_TAG_LENGTH_BYTES,
    );
    const encryptedText = combinedBuffer.subarray(
      0,
      combinedBuffer.length - AUTH_TAG_LENGTH_BYTES,
    );

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    // If decryption fails (e.g. key mismatch or raw unmigrated text), return raw text safely
    console.warn(
      "Field decryption failed, falling back to stored value:",
      error,
    );
    return ciphertext;
  }
}
