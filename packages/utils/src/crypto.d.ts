/**
 * Generate a random UUID v4
 */
export declare function generateUuid(): string;
/**
 * Generate a random ID with custom prefix and length
 */
export declare function generateId(prefix?: string, length?: number): string;
/**
 * Generate a secure random token
 */
export declare function generateToken(length?: number): string;
/**
 * Generate a URL-safe random string
 */
export declare function generateUrlSafeToken(length?: number): string;
/**
 * Generate a numeric OTP (One-Time Password)
 */
export declare function generateOtp(length?: number): string;
/**
 * Generate a secure random number within a range
 */
export declare function generateSecureRandomNumber(min: number, max: number): number;
/**
 * Generate a hash of the given data
 */
export declare function generateHash(data: string, algorithm?: string): string;
/**
 * Generate MD5 hash (for non-security purposes like checksums)
 */
export declare function generateMd5(data: string): string;
/**
 * Generate SHA1 hash
 */
export declare function generateSha1(data: string): string;
/**
 * Generate SHA256 hash
 */
export declare function generateSha256(data: string): string;
/**
 * Generate SHA512 hash
 */
export declare function generateSha512(data: string): string;
/**
 * Hash password with salt using scrypt
 */
export declare function hashPassword(
  password: string,
  salt?: Buffer,
): {
  hash: string;
  salt: string;
};
/**
 * Verify password against hash
 */
export declare function verifyPassword(
  password: string,
  hashedPassword: string,
  salt: string,
): boolean;
/**
 * Generate API key with prefix
 */
export declare function generateApiKey(prefix?: string): string;
/**
 * Generate JWT secret
 */
export declare function generateJwtSecret(length?: number): string;
/**
 * Generate session ID
 */
export declare function generateSessionId(): string;
/**
 * Generate request ID for tracing
 */
export declare function generateRequestId(): string;
/**
 * Generate transaction ID
 */
export declare function generateTransactionId(): string;
/**
 * Generate user ID
 */
export declare function generateUserId(): string;
/**
 * Generate organization ID
 */
export declare function generateOrgId(): string;
/**
 * Generate project ID
 */
export declare function generateProjectId(): string;
/**
 * Generate node ID for DePIN networks
 */
export declare function generateNodeId(): string;
/**
 * Generate device ID
 */
export declare function generateDeviceId(): string;
/**
 * Generate network ID
 */
export declare function generateNetworkId(): string;
/**
 * Generate contract address (mock)
 */
export declare function generateContractAddress(): string;
/**
 * Generate wallet address (mock)
 */
export declare function generateWalletAddress(): string;
/**
 * Generate a secure filename with timestamp
 */
export declare function generateSecureFilename(extension?: string): string;
/**
 * Generate a short URL-safe ID (for public IDs)
 */
export declare function generateShortId(length?: number): string;
/**
 * Generate a time-based ID with timestamp prefix
 */
export declare function generateTimeBasedId(prefix?: string): string;
/**
 * Generate a checksum for data integrity
 */
export declare function generateChecksum(data: string): string;
/**
 * Validate checksum
 */
export declare function validateChecksum(data: string, checksum: string): boolean;
/**
 * Generate a nonce for cryptographic operations
 */
export declare function generateNonce(length?: number): string;
/**
 * Generate entropy for key derivation
 */
export declare function generateEntropy(bits?: number): Buffer;
/**
 * Generate a HMAC signature
 */
export declare function generateHmacSignature(
  data: string,
  secret: string,
  algorithm?: string,
): string;
/**
 * Verify HMAC signature
 */
export declare function verifyHmacSignature(
  data: string,
  signature: string,
  secret: string,
  algorithm?: string,
): boolean;
/**
 * Generate database-safe ID (alphanumeric only)
 */
export declare function generateDatabaseId(prefix?: string, length?: number): string;
/**
 * Utility type for ID generators
 */
export type IdGenerator = () => string;
/**
 * Create a custom ID generator with prefix and length
 */
export declare function createIdGenerator(prefix: string, length?: number): IdGenerator;
//# sourceMappingURL=crypto.d.ts.map
