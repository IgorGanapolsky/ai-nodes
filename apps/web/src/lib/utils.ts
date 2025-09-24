import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = 'tokens', decimals = 4): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0.0000 tokens';
  }

  if (currency === 'tokens') {
    return `${amount.toFixed(decimals)} tokens`;
  }

  // For actual currency formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format a percentage with optional sign
 */
export function formatPercentage(value: number, showSign = false, decimals = 1): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0.0%';
  }

  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a date in a user-friendly way
 */
export function formatDate(dateInput: string | Date): string {
  try {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    // Less than 1 hour ago
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    }

    // Less than 24 hours ago
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    // Less than 7 days ago
    if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }

    // More than 7 days ago - show actual date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date for display in tables
 */
export function formatTableDate(dateInput: string | Date): string {
  try {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting table date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a number with appropriate units (K, M, B)
 */
export function formatNumber(num: number, decimals = 1): string {
  if (isNaN(num) || num === null || num === undefined) {
    return '0';
  }

  if (Math.abs(num) < 1000) {
    return num.toString();
  }

  const units = ['', 'K', 'M', 'B', 'T'];
  const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaledNum = num / Math.pow(1000, unitIndex);

  return `${scaledNum.toFixed(decimals)}${units[unitIndex]}`;
}

/**
 * Calculate if an owner is "on-pace" to meet their earnings target
 */
export interface OnPaceCalculation {
  isOnPace: boolean;
  percentage: number;
  status: 'excellent' | 'on-pace' | 'behind' | 'critical';
  message: string;
}

export function calculateOnPaceStatus(
  actualEarnings: number,
  targetEarnings: number,
  periodProgress?: number // 0-1, how much of the period has elapsed
): OnPaceCalculation {
  if (targetEarnings <= 0) {
    return {
      isOnPace: false,
      percentage: 0,
      status: 'critical',
      message: 'No target set',
    };
  }

  const percentage = (actualEarnings / targetEarnings) * 100;

  // If we don't have period progress, use simple percentage thresholds
  if (periodProgress === undefined) {
    if (percentage >= 100) {
      return {
        isOnPace: true,
        percentage,
        status: 'excellent',
        message: 'Target exceeded',
      };
    } else if (percentage >= 95) {
      return {
        isOnPace: true,
        percentage,
        status: 'on-pace',
        message: 'On track to meet target',
      };
    } else if (percentage >= 75) {
      return {
        isOnPace: false,
        percentage,
        status: 'behind',
        message: 'Behind target',
      };
    } else {
      return {
        isOnPace: false,
        percentage,
        status: 'critical',
        message: 'Significantly behind target',
      };
    }
  }

  // With period progress, we can be more sophisticated
  const expectedPercentage = periodProgress * 100;
  const performanceRatio = percentage / expectedPercentage;

  if (performanceRatio >= 1.1) {
    return {
      isOnPace: true,
      percentage,
      status: 'excellent',
      message: 'Ahead of schedule',
    };
  } else if (performanceRatio >= 0.95) {
    return {
      isOnPace: true,
      percentage,
      status: 'on-pace',
      message: 'On track',
    };
  } else if (performanceRatio >= 0.8) {
    return {
      isOnPace: false,
      percentage,
      status: 'behind',
      message: 'Slightly behind',
    };
  } else {
    return {
      isOnPace: false,
      percentage,
      status: 'critical',
      message: 'Significantly behind',
    };
  }
}

/**
 * Get badge classes for on-pace status
 */
export function getOnPaceBadgeClasses(status: OnPaceCalculation['status']): string {
  switch (status) {
    case 'excellent':
      return 'badge-on-pace';
    case 'on-pace':
      return 'badge-on-pace';
    case 'behind':
      return 'badge-behind-target';
    case 'critical':
      return 'badge-critical';
    default:
      return '';
  }
}

/**
 * Format uptime percentage with status color
 */
export function getUptimeStatus(uptime: number): {
  status: 'excellent' | 'good' | 'poor' | 'critical';
  colorClass: string;
} {
  if (uptime >= 99) {
    return { status: 'excellent', colorClass: 'text-green-600 dark:text-green-400' };
  } else if (uptime >= 95) {
    return { status: 'good', colorClass: 'text-green-600 dark:text-green-400' };
  } else if (uptime >= 85) {
    return { status: 'poor', colorClass: 'text-yellow-600 dark:text-yellow-400' };
  } else {
    return { status: 'critical', colorClass: 'text-red-600 dark:text-red-400' };
  }
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitFor: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => func(...args), waitFor);
  };
}

/**
 * Generate a random ID for components
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T = any>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, etc.)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate text to a specified length
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}