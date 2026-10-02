import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Gets the encryption key from environment variables.
 * Must be exactly 32 bytes (64 hex characters) or a string that will be hashed.
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is not set.');
  }
  // Use SHA-256 to ensure the key is always 32 bytes long, 
  // regardless of what the user put in the .env file.
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

  const cipher = crypto.createCipheriv(ALGORITHM, iv, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();

  // Format: iv(hex):salt(hex):tag(hex):encryptedText(hex)
  const combined = `${iv.toString('hex')}:${salt.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  
  // Convert the combined string to base64 for cleaner storage
  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypts a base64 string encrypted by `encrypt()`.
 * Returns the plain text string.
 */
export function decrypt(encryptedBase64: string): string {
  if (!encryptedBase64) return encryptedBase64;
  
  try {
    const combined = Buffer.from(encryptedBase64, 'base64').toString('utf8');
    const parts = combined.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted payload format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const salt = Buffer.from(parts[1], 'hex'); // Salt is stored but not strictly used if we derive key differently, but good for future KDF
    const tag = Buffer.from(parts[2], 'hex');
    const encryptedText = parts[3];
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, iv, key);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. The ENCRYPTION_KEY might have changed or the data is corrupted.');
  }
}
