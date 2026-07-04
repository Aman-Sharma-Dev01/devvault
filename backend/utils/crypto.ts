import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Use a fallback key for development, but encourage setting a custom key in env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32)
  : crypto.scryptSync('devvault-default-secret-key-super-secure-32-bytes', 'salt', 32);

const IV_LENGTH = 16;

/**
 * Encrypt a text string using AES-256-CBC
 */
export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return '';
  }
}

/**
 * Decrypt a text string using AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const textParts = encryptedText.split(':');
    const ivHex = textParts.shift();
    if (!ivHex) return '';
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedHex = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Failed - Invalid Key]';
  }
}


