import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Gets the encryption key from environment variables.
 * Uses SHA-256 to guarantee a 32-byte key for AES-256-GCM.
 */
function getKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'aacomsoft-default-aes256-vault-secret-2026';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Returns a base64 string containing: iv:salt:tag:encryptedData
 */
export function encrypt(text: string): string {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: iv(hex):salt(hex):tag(hex):encryptedText(hex)
  const combined = `${iv.toString('hex')}:${salt.toString('hex')}:${tag.toString('hex')}:${encrypted}`;

  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypts a string encrypted by `encrypt()`.
 * Returns the plain text string, or empty string if decryption fails.
 */
export function decrypt(encryptedBase64: string): string {
  if (!encryptedBase64) return encryptedBase64;

  try {
    const key = getKey();

    // Support direct 3-part hex format (iv:tag:encrypted) if present
    if (encryptedBase64.includes(':') && encryptedBase64.split(':').length === 3) {
      const [ivHex, tagHex, encryptedText] = encryptedBase64.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    const combined = Buffer.from(encryptedBase64, 'base64').toString('utf8');
    const parts = combined.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted payload format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encryptedText = parts[3];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}
