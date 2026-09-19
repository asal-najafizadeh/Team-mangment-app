import { useState, useEffect, useRef } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { formatPersianDateShort } from '../utils/dateUtils';
import * as jalaali from 'jalaali-js';

/**
 * Convert Persian (Jalali) date to Gregorian date
 */
const persianToGregorian = (year, month, day) => {
  try {
    const gregorian = jalaali.toGregorian(year, month, day);
    return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
  } catch (e) {
    return new Date();
  }
};

/**
 * Convert Gregorian date to Persian (Jalali) date
 */
const gregorianToPersian = (date) => {
  if (!date || isNaN(date.getTime())) {
    const today = new Date();
    const jalali = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return { year: jalali.jy, month: jalali.jm, day: jalali.jd };
  }
  
  const jalali = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { year: jalali.jy, month: jalali.jm, day: jalali.jd };
};

const PersianDatePicker = ({ value, onChange, placeholder = 'انتخاب تاریخ' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [persianDate, setPersianDate] = useState({ year: 1403, month: 1, day: 1 });
  const [selectedDate, setSelectedDate] = useState(null);
  const wrapperRef = useRef(null);

  const persianMonths = [
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

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  useEffect(() => {
    try {
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const persian = gregorianToPersian(date);
          setPersianDate(persian);
          setSelectedDate(date);
        } else {
          // Invalid date, use today
          const today = new Date();
          const persian = gregorianToPersian(today);
          setPersianDate(persian);
        }
      } else {
        const today = new Date();
        const persian = gregorianToPersian(today);
        setPersianDate(persian);
      }
    } catch (error) {
      console.error('Error in PersianDatePicker useEffect:', error);
      // Fallback to today's date
      const today = new Date();
      const persian = gregorianToPersian(today);
      setPersianDate(persian);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (year, month) => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    // Check if it's a leap year using jalaali-js
    try {
      // Try to get the last day of month 12
      if (jalaali.isValidJalaaliDate(year, 12, 30)) {
        return 30;
      }
      return 29;
    } catch {
      return 29;
    }
  };

  const getFirstDayOfMonth = (year, month) => {
    try {
      // Convert first day of Persian month to Gregorian
      const gregorian = jalaali.toGregorian(year, month, 1);
      const date = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
      // Get day of week (0 = Sunday, 6 = Saturday)
      // Convert to Persian week (0 = Saturday)
      const dayOfWeek = date.getDay();
      return (dayOfWeek + 1) % 7; // Saturday = 0
    } catch {
      return 0;
    }
  };

  const handleDateSelect = (day) => {
    const newPersianDate = { ...persianDate, day };
    setPersianDate(newPersianDate);
    
    // Convert to Gregorian
    const gregorianDate = persianToGregorian(newPersianDate.year, newPersianDate.month, newPersianDate.day);
    setSelectedDate(gregorianDate);
    
    // Format as YYYY-MM-DD for input
    const formattedDate = gregorianDate.toISOString().split('T')[0];
    onChange({ target: { name: 'report_date', value: formattedDate } });
    
    setIsOpen(false);
  };

  const handleMonthChange = (direction) => {
    setPersianDate((prev) => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
      
      return { ...prev, month: newMonth, year: newYear };
    });
  };

  const daysInMonth = getDaysInMonth(persianDate.year, persianDate.month);
  const firstDay = getFirstDayOfMonth(persianDate.year, persianDate.month);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const displayValue = selectedDate
    ? `${persianDate.year}/${String(persianDate.month).padStart(2, '0')}/${String(persianDate.day).padStart(2, '0')}`
    : '';

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center justify-between"
      >
        <span className={displayValue ? '' : 'text-gray-500 dark:text-gray-400'}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="w-5 h-5 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <span className="text-gray-600 dark:text-gray-400">←</span>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {persianMonths[persianDate.month - 1]} {persianDate.year}
            </h3>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <span className="text-gray-600 dark:text-gray-400">→</span>
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-8"></div>;
              }

              const isSelected =
                selectedDate &&
                persianDate.year === gregorianToPersian(selectedDate).year &&
                persianDate.month === gregorianToPersian(selectedDate).month &&
                day === gregorianToPersian(selectedDate).day;

              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    h-8 w-8 rounded text-sm transition-colors
                    ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setSelectedDate(null);
                onChange({ target: { name: 'report_date', value: '' } });
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              پاک کردن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersianDatePicker;

