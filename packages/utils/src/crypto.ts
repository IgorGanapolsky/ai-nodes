import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Generate a random UUID v4
 */
export function generateUuid(): string {
  const bytes = randomBytes(16);

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Generate a random ID with custom prefix and length
 */
export function generateId(prefix: string = '', length: number = 16): string {
  const randomPart = randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);

  return prefix ? `${prefix}_${randomPart}` : randomPart;
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a URL-safe random string
 */
export function generateUrlSafeToken(length: number = 32): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

/**
 * Generate a numeric OTP (One-Time Password)
 */
export function generateOtp(length: number = 6): string {
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  return otp.toString();
}

/**
 * Generate a secure random number within a range
 */
export function generateSecureRandomNumber(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const cutoff = Math.floor((256 ** bytesNeeded) / range) * range;

  let randomNumber: number;
  do {
    const randomBytesBuffer = randomBytes(bytesNeeded);
    randomNumber = randomBytesBuffer.readUIntBE(0, bytesNeeded);
  } while (randomNumber >= cutoff);

  return min + (randomNumber % range);
}

/**
 * Generate a hash of the given data
 */
export function generateHash(data: string, algorithm: string = 'sha256'): string {
  return createHash(algorithm).update(data).digest('hex');
}

/**
 * Generate MD5 hash (for non-security purposes like checksums)
 */
export function generateMd5(data: string): string {
  return generateHash(data, 'md5');
}

/**
 * Generate SHA1 hash
 */
export function generateSha1(data: string): string {
  return generateHash(data, 'sha1');
}

/**
 * Generate SHA256 hash
 */
export function generateSha256(data: string): string {
  return generateHash(data, 'sha256');
}

/**
 * Generate SHA512 hash
 */
export function generateSha512(data: string): string {
  return generateHash(data, 'sha512');
}

/**
 * Hash password with salt using scrypt
 */
export function hashPassword(password: string, salt?: Buffer): {
  hash: string;
  salt: string;
} {
  const saltBuffer = salt || randomBytes(16);
  const hash = scryptSync(password, saltBuffer, 64);

  return {
    hash: hash.toString('hex'),
    salt: saltBuffer.toString('hex'),
  };
}

/**
 * Verify password against hash
 */
export function verifyPassword(
  password: string,
  hashedPassword: string,
  salt: string
): boolean {
  const saltBuffer = Buffer.from(salt, 'hex');
  const hash = scryptSync(password, saltBuffer, 64);
  const hashBuffer = Buffer.from(hashedPassword, 'hex');

  return timingSafeEqual(hash, hashBuffer);
}

/**
 * Generate API key with prefix
 */
export function generateApiKey(prefix: string = 'ak'): string {
  const keyPart = generateToken(32);
  return `${prefix}_${keyPart}`;
}

/**
 * Generate JWT secret
 */
export function generateJwtSecret(length: number = 64): string {
  return randomBytes(length).toString('base64');
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return generateId('sess', 32);
}

/**
 * Generate request ID for tracing
 */
export function generateRequestId(): string {
  return generateId('req', 16);
}

/**
 * Generate transaction ID
 */
export function generateTransactionId(): string {
  return generateId('txn', 20);
}

/**
 * Generate user ID
 */
export function generateUserId(): string {
  return generateId('user', 12);
}

/**
 * Generate organization ID
 */
export function generateOrgId(): string {
  return generateId('org', 12);
}

/**
 * Generate project ID
 */
export function generateProjectId(): string {
  return generateId('proj', 12);
}

/**
 * Generate node ID for DePIN networks
 */
export function generateNodeId(): string {
  return generateId('node', 16);
}

/**
 * Generate device ID
 */
export function generateDeviceId(): string {
  return generateId('dev', 16);
}

/**
 * Generate network ID
 */
export function generateNetworkId(): string {
  return generateId('net', 12);
}

/**
 * Generate contract address (mock)
 */
export function generateContractAddress(): string {
  return '0x' + randomBytes(20).toString('hex');
}

/**
 * Generate wallet address (mock)
 */
export function generateWalletAddress(): string {
  return generateContractAddress();
}

/**
 * Generate a secure filename with timestamp
 */
export function generateSecureFilename(extension?: string): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  const filename = `${timestamp}_${random}`;

  return extension ? `${filename}.${extension}` : filename;
}

/**
 * Generate a short URL-safe ID (for public IDs)
 */
export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = generateSecureRandomNumber(0, chars.length - 1);
    result += chars[randomIndex];
  }

  return result;
}

/**
 * Generate a time-based ID with timestamp prefix
 */
export function generateTimeBasedId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const random = randomBytes(6).toString('hex');
  const id = `${timestamp}_${random}`;

  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a checksum for data integrity
 */
export function generateChecksum(data: string): string {
  return generateHash(data, 'sha256').slice(0, 8);
}

/**
 * Validate checksum
 */
export function validateChecksum(data: string, checksum: string): boolean {
  const calculatedChecksum = generateChecksum(data);
  return timingSafeEqual(
    Buffer.from(calculatedChecksum),
    Buffer.from(checksum)
  );
}

/**
 * Generate a nonce for cryptographic operations
 */
export function generateNonce(length: number = 16): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate entropy for key derivation
 */
export function generateEntropy(bits: number = 256): Buffer {
  return randomBytes(bits / 8);
}

/**
 * Generate a HMAC signature
 */
export function generateHmacSignature(
  data: string,
  secret: string,
  algorithm: string = 'sha256'
): string {
  const hmac = require('crypto').createHmac(algorithm, secret);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmacSignature(
  data: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  const expectedSignature = generateHmacSignature(data, secret, algorithm);
  return timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Generate database-safe ID (alphanumeric only)
 */
export function generateDatabaseId(prefix: string = '', length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = generateSecureRandomNumber(0, chars.length - 1);
    result += chars[randomIndex];
  }

  return prefix ? `${prefix}_${result}` : result;
}

/**
 * Utility type for ID generators
 */
export type IdGenerator = () => string;

/**
 * Create a custom ID generator with prefix and length
 */
export function createIdGenerator(prefix: string, length: number = 16): IdGenerator {
  return () => generateId(prefix, length);
}