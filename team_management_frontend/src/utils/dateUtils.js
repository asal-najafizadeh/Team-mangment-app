/**
 * Utility functions for date formatting in Persian (Farsi)
 */

/**
 * Format date to Persian (Shamsi) date string
 * @param {string|Date} dateString - Date string or Date object
 * @param {Object} options - Formatting options
 * @returns {string} Formatted Persian date string
 */
export const formatPersianDate = (dateString, options = {}) => {
  if (!dateString) return '—';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return '—';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian',
    numberingSystem: 'latn',
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  return date.toLocaleDateString('fa-IR', formatOptions);
};

/**
 * Format date to Persian (Shamsi) date string (short format)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted Persian date string (e.g., "۱۴۰۳/۰۱/۱۵")
 */
export const formatPersianDateShort = (dateString) => {
  if (!dateString) return '—';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'persian',
  });
};

/**
 * Format date to Persian (Shamsi) date string with weekday
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted Persian date string with weekday
 */
export const formatPersianDateWithWeekday = (dateString) => {
  if (!dateString) return '—';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian',
  });
};

/**
 * Format time to Persian time string
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted Persian time string
 */
export const formatPersianTime = (dateString) => {
  if (!dateString) return '—';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format date and time to Persian string
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted Persian date and time string
 */
export const formatPersianDateTime = (dateString) => {
  if (!dateString) return '—';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'persian',
  });
};

/**
 * Get Persian month names
 */
export const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * Get Persian weekday names
 */
export const persianWeekdays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

