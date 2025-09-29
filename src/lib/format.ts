/**
 * Utility functions for formatting display values
 */

/**
 * Returns formatted text only if count is greater than 0, otherwise returns empty string
 * Useful for preventing "0 items" or "0 pending" from showing in the UI
 */
export function visibleCount<T>(count: number | undefined | null, formatter: (count: number) => T): T | string {
  const validCount = count || 0;
  return validCount > 0 ? formatter(validCount) : '';
}

/**
 * Formats currency values, hiding zero amounts
 */
export function visibleCurrency(amountCents: number | undefined | null, currency = 'MYR'): string {
  if (!amountCents || amountCents === 0) return '';
  const amount = amountCents / 100;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Joins non-empty strings with a separator, useful for conditional descriptions
 */
export function joinNonEmpty(items: (string | null | undefined)[], separator = ' • '): string {
  return items.filter(Boolean).join(separator);
}