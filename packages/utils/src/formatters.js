import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';
/**
 * Format currency values
 */
export function formatCurrency(amount, options = {}) {
  const {
    currency = 'USD',
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    notation = 'standard',
  } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
  }).format(amount);
}
/**
 * Format cryptocurrency values with appropriate precision
 */
export function formatCrypto(amount, symbol = '', decimals = 8) {
  // For very small amounts, show more decimals
  let displayDecimals = decimals;
  if (amount > 0 && amount < 0.01) {
    displayDecimals = Math.max(decimals, 8);
  } else if (amount >= 0.01 && amount < 1) {
    displayDecimals = Math.max(4, decimals);
  } else if (amount >= 1 && amount < 1000) {
    displayDecimals = Math.min(4, decimals);
  } else {
    displayDecimals = Math.min(2, decimals);
  }
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  }).format(amount);
  return symbol ? `${formatted} ${symbol}` : formatted;
}
/**
 * Format percentage values
 */
export function formatPercentage(value, options = {}) {
  const {
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    signDisplay = 'auto',
  } = options;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay,
  }).format(value);
}
/**
 * Format percentage change with appropriate styling hints
 */
export function formatPercentageChange(value) {
  const formatted = formatPercentage(value, { signDisplay: 'always' });
  return {
    formatted,
    isPositive: value > 0,
    isNegative: value < 0,
    isNeutral: value === 0,
  };
}
/**
 * Format large numbers with appropriate suffixes
 */
export function formatLargeNumber(value, options = {}) {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    notation = 'compact',
  } = options;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
  }).format(value);
}
/**
 * Format numbers with custom suffixes (K, M, B, T)
 */
export function formatNumberWithSuffix(value, decimals = 2) {
  if (value === 0) return '0';
  const suffixes = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
  if (tier === 0) return value.toFixed(decimals);
  const suffix = suffixes[tier] || `e${tier * 3}`;
  const scaled = value / Math.pow(1000, tier);
  return scaled.toFixed(decimals) + suffix;
}
/**
 * Format date values with various options
 */
export function formatDate(date, options = {}) {
  const {
    format: formatString = 'PPP',
    includeTime = false,
    relative = false,
    distance = false,
  } = options;
  let dateObj;
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) {
    return 'Invalid Date';
  }
  if (relative) {
    return formatRelative(dateObj, new Date());
  }
  if (distance) {
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  }
  const finalFormat = includeTime && formatString === 'PPP' ? 'PPP p' : formatString;
  return format(dateObj, finalFormat);
}
/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  if (seconds > 0) {
    return `${seconds}s`;
  }
  return `${milliseconds}ms`;
}
/**
 * Format duration in seconds to human readable format
 */
export function formatDurationFromSeconds(seconds) {
  return formatDuration(seconds * 1000);
}
/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formatted = (bytes / Math.pow(1024, i)).toFixed(decimals);
  return `${formatted} ${sizes[i]}`;
}
/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phoneNumber, countryCode = 'US') {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  // US phone number formatting
  if (countryCode === 'US' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  // US phone number with country code
  if (countryCode === 'US' && cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.slice(1);
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  // International format (basic)
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  return phoneNumber; // Return original if can't format
}
/**
 * Truncate string with ellipsis
 */
export function truncateString(str, maxLength, ellipsis = '...') {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}
/**
 * Truncate string in the middle (useful for addresses, hashes)
 */
export function truncateMiddle(str, startLength = 6, endLength = 4, ellipsis = '...') {
  if (str.length <= startLength + endLength + ellipsis.length) return str;
  return str.slice(0, startLength) + ellipsis + str.slice(-endLength);
}
/**
 * Format wallet address with truncation
 */
export function formatWalletAddress(address, startLength = 6, endLength = 4) {
  return truncateMiddle(address, startLength, endLength);
}
/**
 * Format hash (transaction, block, etc.) with truncation
 */
export function formatHash(hash, startLength = 8, endLength = 6) {
  return truncateMiddle(hash, startLength, endLength);
}
/**
 * Format market cap with appropriate suffix
 */
export function formatMarketCap(marketCap) {
  if (marketCap >= 1_000_000_000_000) {
    return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  }
  if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  }
  if (marketCap >= 1_000) {
    return `$${(marketCap / 1_000).toFixed(2)}K`;
  }
  return formatCurrency(marketCap);
}
/**
 * Format trading volume
 */
export function formatVolume(volume) {
  return formatMarketCap(volume); // Same logic as market cap
}
/**
 * Format API response for consistent structure
 */
export function formatApiResponse(data, message = 'Success', success = true) {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}
/**
 * Format error response for API
 */
export function formatErrorResponse(message, code, details) {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}
/**
 * Format pagination metadata
 */
export function formatPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
/**
 * Format list response with pagination
 */
export function formatListResponse(items, page, limit, total, message = 'Success') {
  return {
    success: true,
    message,
    data: items,
    meta: formatPaginationMeta(page, limit, total),
    timestamp: new Date().toISOString(),
  };
}
