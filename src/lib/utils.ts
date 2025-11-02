import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to Indian format (dd-mm-yyyy)
 */
export function formatIndianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return date.toString(); // Return original if invalid
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format date and time to Indian format (dd-mm-yyyy hh:mm:ss)
 */
export function formatIndianDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return date.toString(); // Return original if invalid
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse Indian date string (dd-mm-yyyy) to Date object
 */
export function parseIndianDate(dateString: string): Date | null {
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Format number to Indian numbering system (lakhs, crores)
 * Examples: 100000 -> "1,00,000", 10000000 -> "1,00,00,000"
 */
export function formatIndianNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(n)) return num.toString();
  
  // Handle negative numbers
  const isNegative = n < 0;
  const absNum = Math.abs(n);
  
  // Convert to string and split by decimal point
  const parts = absNum.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Apply Indian numbering system to integer part
  let formatted = '';
  let count = 0;
  
  // Process from right to left
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      formatted = ',' + formatted;
      count = 0;
    }
    formatted = integerPart[i] + formatted;
    count++;
  }
  
  // Add decimal part if exists
  const result = decimalPart ? formatted + '.' + decimalPart : formatted;
  return isNegative ? '-' + result : result;
}

/**
 * Parse Indian formatted number string to number
 */
export function parseIndianNumber(numString: string): number {
  return parseFloat(numString.replace(/,/g, '')) || 0;
}

/**
 * Format number input value as user types (with Indian formatting)
 */
export function formatNumberInput(value: string): string {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Handle decimal point (only one allowed)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    // Multiple decimal points, keep only first two parts
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Format integer part with Indian numbering
  if (parts[0]) {
    const integerPart = parts[0];
    const formatted = formatIndianNumber(integerPart);
    return parts[1] !== undefined ? formatted + '.' + parts[1] : formatted;
  }
  
  return cleaned;
}

/**
 * Format date input value as user types (dd-mm-yyyy)
 */
export function formatDateInput(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Format as dd-mm-yyyy
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 4) {
    return cleaned.slice(0, 2) + '-' + cleaned.slice(2);
  } else {
    return cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 8);
  }
}
