import { z } from 'zod';
/**
 * Common validation schemas and utilities
 */
export declare const emailSchema: any;
export declare const urlSchema: any;
export declare const uuidSchema: any;
export declare const phoneSchema: any;
export declare const positiveNumberSchema: any;
export declare const nonNegativeNumberSchema: any;
export declare const percentageSchema: any;
export declare const priceSchema: any;
export declare const nonEmptyStringSchema: any;
export declare const alphanumericSchema: any;
export declare const slugSchema: any;
export declare const dateStringSchema: any;
export declare const futureDateSchema: any;
export declare const pastDateSchema: any;
export declare const revSharePercentageSchema: any;
export declare const walletAddressSchema: any;
export declare const tokenSymbolSchema: any;
export declare const paginationSchema: any;
export type PaginationParams = z.infer<typeof paginationSchema>;
export declare const dateRangeSchema: any;
export type DateRange = z.infer<typeof dateRangeSchema>;
/**
 * Validation utility functions
 */
/**
 * Validate email address
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate URL
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Validate UUID
 */
export declare function isValidUuid(uuid: string): boolean;
/**
 * Validate phone number (international format)
 */
export declare function isValidPhoneNumber(phone: string): boolean;
/**
 * Validate wallet address format
 */
export declare function isValidWalletAddress(address: string): boolean;
/**
 * Validate token symbol format
 */
export declare function isValidTokenSymbol(symbol: string): boolean;
/**
 * Validate percentage value (0-100)
 */
export declare function isValidPercentage(value: number): boolean;
/**
 * Validate price value (non-negative with up to 2 decimal places)
 */
export declare function isValidPrice(price: number): boolean;
/**
 * Validate revenue share percentage (0-1)
 */
export declare function isValidRevSharePercentage(percentage: number): boolean;
/**
 * Sanitize string input
 */
export declare function sanitizeString(input: string): string;
/**
 * Validate and sanitize email
 */
export declare function validateAndSanitizeEmail(email: string): string;
/**
 * Validate and normalize phone number
 */
export declare function validateAndNormalizePhone(phone: string): string;
/**
 * Create validation middleware for request bodies
 */
export declare function createValidationMiddleware<T>(schema: z.ZodSchema<T>): (req: any, res: any, next: any) => any;
/**
 * Create validation middleware for query parameters
 */
export declare function createQueryValidationMiddleware<T>(schema: z.ZodSchema<T>): (req: any, res: any, next: any) => any;
/**
 * Validate array of items against schema
 */
export declare function validateArray<T>(items: unknown[], schema: z.ZodSchema<T>): T[];
/**
 * Validate partial object (useful for PATCH operations)
 */
export declare function validatePartial<T>(data: unknown, schema: z.ZodSchema<T>): Partial<T>;
/**
 * Transform and validate data with custom transformations
 */
export declare function transformAndValidate<T, U>(data: T, transformer: (data: T) => unknown, schema: z.ZodSchema<U>): U;
export type ValidationResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    errors: z.ZodError;
};
/**
 * Safe validation that returns result instead of throwing
 */
export declare function safeValidate<T>(data: unknown, schema: z.ZodSchema<T>): ValidationResult<T>;
//# sourceMappingURL=validators.d.ts.map