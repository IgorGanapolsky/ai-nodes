import { z, ZodObject } from 'zod';

/**
 * Common validation schemas and utilities
 */

// Basic primitive validators
export const emailSchema = z.string().email('Invalid email address');
export const urlSchema = z.string().url('Invalid URL format');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// Numeric validators
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const nonNegativeNumberSchema = z.number().nonnegative('Must be non-negative');
export const percentageSchema = z.number().min(0, 'Percentage must be >= 0').max(100, 'Percentage must be <= 100');
export const priceSchema = z.number().min(0, 'Price must be non-negative').multipleOf(0.01, 'Price must have at most 2 decimal places');

// String validators
export const nonEmptyStringSchema = z.string().min(1, 'String cannot be empty');
export const alphanumericSchema = z.string().regex(/^[a-zA-Z0-9]+$/, 'Must contain only alphanumeric characters');
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a valid slug (lowercase, hyphens allowed)');

// Date validators
export const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date string');
export const futureDateSchema = z.date().refine((date) => date > new Date(), 'Date must be in the future');
export const pastDateSchema = z.date().refine((date) => date < new Date(), 'Date must be in the past');

// Custom validators for business logic
export const revSharePercentageSchema = z.number()
  .min(0, 'Revenue share percentage must be >= 0')
  .max(1, 'Revenue share percentage must be <= 1');

export const walletAddressSchema = z.string()
  .regex(/^[a-zA-Z0-9]{32,44}$/, 'Invalid wallet address format');

export const tokenSymbolSchema = z.string()
  .min(2, 'Token symbol must be at least 2 characters')
  .max(10, 'Token symbol must be at most 10 characters')
  .regex(/^[A-Z]+$/, 'Token symbol must be uppercase letters only');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be >= 1').default(1),
  limit: z.number().int().min(1, 'Limit must be >= 1').max(100, 'Limit must be <= 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Filter schemas
export const dateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  'Start date must be before or equal to end date'
);

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Validation utility functions
 */

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    urlSchema.parse(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID
 */
export function isValidUuid(uuid: string): boolean {
  try {
    uuidSchema.parse(uuid);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    walletAddressSchema.parse(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate token symbol format
 */
export function isValidTokenSymbol(symbol: string): boolean {
  try {
    tokenSymbolSchema.parse(symbol);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate percentage value (0-100)
 */
export function isValidPercentage(value: number): boolean {
  try {
    percentageSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate price value (non-negative with up to 2 decimal places)
 */
export function isValidPrice(price: number): boolean {
  try {
    priceSchema.parse(price);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate revenue share percentage (0-1)
 */
export function isValidRevSharePercentage(percentage: number): boolean {
  try {
    revSharePercentageSchema.parse(percentage);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate and sanitize email
 */
export function validateAndSanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase();
  emailSchema.parse(sanitized);
  return sanitized;
}

/**
 * Validate and normalize phone number
 */
export function validateAndNormalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  phoneSchema.parse(cleaned);
  return cleaned;
}

/**
 * Create validation middleware for request bodies
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: Record<string, string[]> = {};

        error.issues.forEach((err: any) => {
          const path = err.path.join('.');
          if (!validationErrors[path]) {
            validationErrors[path] = [];
          }
          validationErrors[path].push(err.message);
        });

        return res.status(422).json({
          error: 'Validation Error',
          validationErrors,
          details: error.issues,
        });
      }

      return res.status(400).json({
        error: 'Invalid request body',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function createQueryValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      // Parse numeric query parameters
      const query = { ...req.query };
      Object.keys(query).forEach(key => {
        const value = query[key];
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          query[key] = parseInt(value, 10);
        } else if (typeof value === 'string' && /^\d*\.\d+$/.test(value)) {
          query[key] = parseFloat(value);
        } else if (value === 'true') {
          query[key] = true;
        } else if (value === 'false') {
          query[key] = false;
        }
      });

      req.validatedQuery = schema.parse(query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: Record<string, string[]> = {};

        error.issues.forEach((err: any) => {
          const path = err.path.join('.');
          if (!validationErrors[path]) {
            validationErrors[path] = [];
          }
          validationErrors[path].push(err.message);
        });

        return res.status(422).json({
          error: 'Query Validation Error',
          validationErrors,
          details: error.issues,
        });
      }

      return res.status(400).json({
        error: 'Invalid query parameters',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
    }
  };
}

/**
 * Validate array of items against schema
 */
export function validateArray<T>(items: unknown[], schema: z.ZodSchema<T>): T[] {
  const arraySchema = z.array(schema);
  return arraySchema.parse(items);
}

/**
 * Validate partial object (useful for PATCH operations)
 */
export function validatePartial<T>(data: unknown, schema: ZodObject<any>): Partial<T> {
  const partialSchema = schema.partial();
  return partialSchema.parse(data) as Partial<T>;
}

/**
 * Transform and validate data with custom transformations
 */
export function transformAndValidate<T, U>(
  data: T,
  transformer: (data: T) => unknown,
  schema: z.ZodSchema<U>
): U {
  const transformed = transformer(data);
  return schema.parse(transformed);
}

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
export function safeValidate<T>(data: unknown, schema: z.ZodSchema<T>): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error; // Re-throw non-Zod errors
  }
}