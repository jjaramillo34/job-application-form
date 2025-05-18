import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('Please add your encryption key to .env.local');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export function encryptData(text: string): string {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Generate a key using PBKDF2
    const key = crypto.pbkdf2Sync(
      ENCRYPTION_KEY,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    // Get the auth tag
    const tag = cipher.getAuthTag();
    
    // Combine all components
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ]);
    
    // Return as base64 string
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
}

export function decryptData(encryptedData: string): string {
  try {
    // If the data isn't encrypted (no base64), return as is
    if (!encryptedData || !encryptedData.match(/^[A-Za-z0-9+/=]+$/)) {
      return encryptedData;
    }

    // Convert from base64
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Check if buffer is long enough to contain all components
    if (buffer.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
      return encryptedData;
    }
    
    // Extract components
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Generate key using PBKDF2
    const key = crypto.pbkdf2Sync(
      ENCRYPTION_KEY,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the text
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return original data if decryption fails
  }
} 