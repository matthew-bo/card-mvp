/**
 * Formats a number as currency (USD)
 * @param value The number to format
 * @param showCents Whether to show cents (defaults to true)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, showCents = true): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0
    }).format(value);
  }
  
  /**
   * Formats a date from timestamp
   * @param timestamp The timestamp to format
   * @returns Formatted date string
   */
  export function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
  
  /**
   * Formats a number with comma separators
   * @param value The number to format
   * @returns Formatted number string
   */
  export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  /**
   * Formats a percentage value
   * @param value The decimal value to format as percentage
   * @param decimals Number of decimal places to show
   * @returns Formatted percentage string
   */
  export function formatPercentage(value: number, decimals = 1): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }
  
  /**
   * Truncates text to a specified length
   * @param text The text to truncate
   * @param maxLength The maximum length before truncating
   * @returns Truncated text with ellipsis if needed
   */
  export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  }