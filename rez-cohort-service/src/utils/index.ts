/**
 * Utility functions for cohort analysis
 */

export class DateUtils {
  /**
   * Format a date to YYYY-MM string
   */
  static formatToMonth(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Parse a YYYY-MM string to Date
   */
  static parseMonth(monthStr: string): Date {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  /**
   * Get all months between two dates (inclusive)
   */
  static getMonthsBetween(startMonth: string, endMonth: string): string[] {
    const months: string[] = [];
    const start = this.parseMonth(startMonth);
    const end = this.parseMonth(endMonth);

    const current = new Date(start);
    while (current <= end) {
      months.push(this.formatToMonth(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  /**
   * Add periods to a date
   */
  static addPeriods(date: Date, periods: number, type: 'day' | 'week' | 'month'): Date {
    const result = new Date(date);
    switch (type) {
      case 'day':
        result.setDate(result.getDate() + periods);
        break;
      case 'week':
        result.setDate(result.getDate() + periods * 7);
        break;
      case 'month':
        result.setMonth(result.getMonth() + periods);
        break;
    }
    return result;
  }

  /**
   * Get the start and end of a period
   */
  static getPeriodBounds(date: Date, type: 'day' | 'week' | 'month'): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date);

    switch (type) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Get week number of the year
   */
  static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

export class MathUtils {
  /**
   * Calculate average of numbers
   */
  static average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = this.average(numbers);
    const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  /**
   * Calculate percentiles
   */
  static percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Normalize values to 0-100 scale
   */
  static normalize(values: number[]): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0) return values.map(() => 50);
    return values.map(v => ((v - min) / range) * 100);
  }

  /**
   * Calculate compound growth rate
   */
  static compoundGrowthRate(initialValue: number, finalValue: number, periods: number): number {
    if (initialValue === 0 || periods === 0) return 0;
    return (Math.pow(finalValue / initialValue, 1 / periods) - 1) * 100;
  }
}

export class StringUtils {
  /**
   * Generate a random ID
   */
  static generateId(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Format a number as currency
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format a number with thousands separator
   */
  static formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }
}
