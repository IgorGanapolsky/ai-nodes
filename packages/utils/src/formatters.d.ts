export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
}
export interface FormatNumberOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never';
}
export interface FormatDateOptions {
  format?: string;
  locale?: string;
  includeTime?: boolean;
  relative?: boolean;
  distance?: boolean;
}
/**
 * Format currency values
 */
export declare function formatCurrency(amount: number, options?: FormatCurrencyOptions): string;
/**
 * Format cryptocurrency values with appropriate precision
 */
export declare function formatCrypto(amount: number, symbol?: string, decimals?: number): string;
/**
 * Format percentage values
 */
export declare function formatPercentage(value: number, options?: FormatNumberOptions): string;
/**
 * Format percentage change with appropriate styling hints
 */
export declare function formatPercentageChange(value: number): {
  formatted: string;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
};
/**
 * Format large numbers with appropriate suffixes
 */
export declare function formatLargeNumber(value: number, options?: FormatNumberOptions): string;
/**
 * Format numbers with custom suffixes (K, M, B, T)
 */
export declare function formatNumberWithSuffix(value: number, decimals?: number): string;
/**
 * Format date values with various options
 */
export declare function formatDate(
  date: Date | string | number,
  options?: FormatDateOptions,
): string;
/**
 * Format duration in milliseconds to human readable format
 */
export declare function formatDuration(milliseconds: number): string;
/**
 * Format duration in seconds to human readable format
 */
export declare function formatDurationFromSeconds(seconds: number): string;
/**
 * Format file size in bytes to human readable format
 */
export declare function formatFileSize(bytes: number, decimals?: number): string;
/**
 * Format phone number to standard format
 */
export declare function formatPhoneNumber(phoneNumber: string, countryCode?: string): string;
/**
 * Truncate string with ellipsis
 */
export declare function truncateString(str: string, maxLength: number, ellipsis?: string): string;
/**
 * Truncate string in the middle (useful for addresses, hashes)
 */
export declare function truncateMiddle(
  str: string,
  startLength?: number,
  endLength?: number,
  ellipsis?: string,
): string;
/**
 * Format wallet address with truncation
 */
export declare function formatWalletAddress(
  address: string,
  startLength?: number,
  endLength?: number,
): string;
/**
 * Format hash (transaction, block, etc.) with truncation
 */
export declare function formatHash(hash: string, startLength?: number, endLength?: number): string;
/**
 * Format market cap with appropriate suffix
 */
export declare function formatMarketCap(marketCap: number): string;
/**
 * Format trading volume
 */
export declare function formatVolume(volume: number): string;
/**
 * Format API response for consistent structure
 */
export declare function formatApiResponse<T>(
  data: T,
  message?: string,
  success?: boolean,
): {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};
/**
 * Format error response for API
 */
export declare function formatErrorResponse(
  message: string,
  code?: string,
  details?: any,
): {
  success: boolean;
  error: {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
  };
};
/**
 * Format pagination metadata
 */
export declare function formatPaginationMeta(
  page: number,
  limit: number,
  total: number,
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};
/**
 * Format list response with pagination
 */
export declare function formatListResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
): {
  success: boolean;
  message: string;
  data: T[];
  meta: ReturnType<typeof formatPaginationMeta>;
  timestamp: string;
};
//# sourceMappingURL=formatters.d.ts.map
