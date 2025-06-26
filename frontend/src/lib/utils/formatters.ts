/**
 * Utility functions for formatting values
 */

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format weight with grams unit
 */
export function formatWeight(weight: number): string {
  return `${weight}g`;
}

/**
 * Format date in readable format
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date and time in readable format
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format purity (e.g., "22K", "18K")
 */
export function formatPurity(purity: string): string {
  return purity.toUpperCase();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}