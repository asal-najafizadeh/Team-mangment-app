import { useState, useEffect } from 'react';
import { calendarApi } from '../api/calendarApi';
import { authApi } from '../api/authApi';
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatPersianDate, formatPersianDateShort, formatPersianDateWithWeekday } from '../utils/dateUtils';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, leavesRes] = await Promise.all([
        calendarApi.getEvents(),
        calendarApi.getMyLeaves(),
      ]);
      setEvents(eventsRes.data || []);
      setMyLeaves(leavesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError('بارگذاری اطلاعات تقویم با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  // فرمت‌کننده برای استخراج سال/ماه/روز شمسی از Date میلادی
  const persianFormatter = new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
    numberingSystem: 'latn',
  });

  const getPersianParts = (date) => {
    const parts = persianFormatter.formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return {
      year: parseInt(get('year'), 10),
      month: parseInt(get('month'), 10),
      day: parseInt(get('day'), 10),
      weekday: get('weekday'),
    };
  };

  /**
   * بر اساس تاریخ جاری، روزهای همان ماه شمسی را برمی‌گرداند
   * خروجی شامل null برای سلول‌های خالی، و آبجکت { date, persianDay } برای روزهاست
   */
  const getDaysInMonth = (date) => {
    const target = getPersianParts(date);

    // پیدا کردن اولین روز این ماه شمسی
    let firstDayGregorian = new Date(date);
    while (true) {
      const p = getPersianParts(firstDayGregorian);
      if (p.year === target.year && p.month === target.month && p.day === 1) {
        break;
      }
      firstDayGregorian.setDate(firstDayGregorian.getDate() - 1);
    }

    const firstPersian = getPersianParts(firstDayGregorian);
    const weekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const startingDayIndex = weekDays.indexOf(firstPersian.weekday); // 0 = شنبه

    const days = [];

    // سلول‌های خالی قبل از شروع ماه
    for (let i = 0; i < (startingDayIndex < 0 ? 0 : startingDayIndex); i++) {
      days.push(null);
    }

    // افزودن روزهای ماه شمسی
    let cursor = new Date(firstDayGregorian);
    while (true) {
      const p = getPersianParts(cursor);
      if (p.year !== target.year || p.month !== target.month) {
        break;
      }
      days.push({ date: new Date(cursor), persianDay: p.day });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const isHoliday = (date) => {
    if (!date) return false;
    const dateStr = formatDate(date);
    return events.some((event) => event.date === dateStr);
  };

  const isFriday = (date) => {
    if (!date) return false;
    const persianParts = getPersianParts(date);
    return persianParts.weekday === 'جمعه';
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isTomorrow = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === tomorrow.getTime();
  };

  const hasLeaveRequest = (date) => {
    if (!date) return false;
    const dateStr = formatDate(date);
    return myLeaves.some((leave) => leave.date === dateStr);
  };

  const getLeaveStatus = (date) => {
    if (!date) return null;
    const dateStr = formatDate(date);
    const leave = myLeaves.find((l) => l.date === dateStr);
    return leave ? leave.status : null;
  };

  const handleDateClick = (date) => {
    if (!date || isPast(date) || isHoliday(date) || isFriday(date) || isTomorrow(date)) return;
    setSelectedDate(date);
    setLeaveReason('');
    setShowLeaveModal(true);
  };

  const handleSubmitLeave = async () => {
    if (!selectedDate || !leaveReason.trim()) {
      setError('لطفاً دلیل مرخصی را وارد کنید.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await calendarApi.requestLeave({
        date: formatDate(selectedDate),
        reason: leaveReason.trim(),
      });
      setShowLeaveModal(false);
      setSelectedDate(null);
      setLeaveReason('');
      await fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'ارسال درخواست مرخصی با خطا مواجه شد.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const monthNames = [
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

  const weekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  // جابه‌جایی ماه شمسی به ماه قبل
  const goToPreviousMonth = () => {
    // ابتدا به اولین روز ماه فعلی شمسی برو
    let cursor = new Date(currentDate);
    const currentParts = getPersianParts(cursor);
    while (getPersianParts(cursor).day !== 1) {
      cursor.setDate(cursor.getDate() - 1);
    }
    // یک روز به عقب برو تا وارد ماه قبل شمسی شوی
    cursor.setDate(cursor.getDate() - 1);
    const prevParts = getPersianParts(cursor);
    // حالا تا رسیدن به روز اول ماه قبل به عقب برو
    while (true) {
      const p = getPersianParts(cursor);
      if (p.year === prevParts.year && p.month === prevParts.month && p.day === 1) {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    setCurrentDate(cursor);
  };

  // جابه‌جایی ماه شمسی به ماه بعد
  const goToNextMonth = () => {
    // ابتدا به اولین روز ماه فعلی شمسی برو
    let cursor = new Date(currentDate);
    const currentParts = getPersianParts(cursor);
    while (getPersianParts(cursor).day !== 1) {
      cursor.setDate(cursor.getDate() - 1);
    }
    // به جلو حرکت کن تا وارد ماه بعد شمسی شوی
    do {
      cursor.setDate(cursor.getDate() + 1);
    } while (getPersianParts(cursor).month === currentParts.month && getPersianParts(cursor).year === currentParts.year);

    const nextParts = getPersianParts(cursor);
    // حالا تا رسیدن به روز اول ماه بعد به عقب برگرد
    while (true) {
      const p = getPersianParts(cursor);
      if (p.year === nextParts.year && p.month === nextParts.month && p.day === 1) {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    setCurrentDate(cursor);
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری تقویم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تقویم و درخواست مرخصی</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          مشاهده تعطیلات و درخواست مرخصی
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        {/* Today's Date Display */}
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
            <span className="font-bold">امروز:</span> {formatPersianDateWithWeekday(new Date())}
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-400">←</span>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {formatPersianDate(currentDate, { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-400">→</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week Days Header */}
          {weekDays.map((day) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                day === 'جمعه'
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((dayInfo, index) => {
            if (!dayInfo) {
              return <div key={`empty-${index}`} className="h-16"></div>;
            }

            const day = dayInfo.date;
            const persianDay = dayInfo.persianDay;

            const isHolidayDay = isHoliday(day);
            const isFridayDay = isFriday(day);
            const isPastDay = isPast(day);
            const isTomorrowDay = isTomorrow(day);
            const hasLeave = hasLeaveRequest(day);
            const leaveStatus = getLeaveStatus(day);
            const isToday =
              formatDate(day) === formatDate(new Date());

            let bgColor = 'bg-white dark:bg-gray-800';
            let textColor = 'text-gray-900 dark:text-white';
            let borderColor = 'border-gray-200 dark:border-gray-700';

            if (isHolidayDay) {
              bgColor = 'bg-red-100 dark:bg-red-900/30';
              textColor = 'text-red-800 dark:text-red-300';
              borderColor = 'border-red-300 dark:border-red-700';
            } else if (isFridayDay) {
              bgColor = 'bg-orange-50 dark:bg-orange-900/20';
              textColor = 'text-orange-700 dark:text-orange-300';
              borderColor = 'border-orange-300 dark:border-orange-700';
            } else if (isTomorrowDay) {
              bgColor = 'bg-gray-100 dark:bg-gray-700/50';
              textColor = 'text-gray-500 dark:text-gray-400';
              borderColor = 'border-gray-300 dark:border-gray-600';
            } else if (hasLeave) {
              if (leaveStatus === 'accepted') {
                bgColor = 'bg-green-100 dark:bg-green-900/30';
                textColor = 'text-green-800 dark:text-green-300';
                borderColor = 'border-green-300 dark:border-green-700';
              } else if (leaveStatus === 'rejected') {
                bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                textColor = 'text-orange-800 dark:text-orange-300';
                borderColor = 'border-orange-300 dark:border-orange-700';
              } else {
                bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                textColor = 'text-blue-800 dark:text-blue-300';
                borderColor = 'border-blue-300 dark:border-blue-700';
              }
            } else if (isToday) {
              borderColor = 'border-indigo-500 dark:border-indigo-400';
            }

            return (
              <div
                key={formatDate(day)}
                onClick={() => handleDateClick(day)}
                className={`
                  h-16 p-2 border-2 rounded-lg cursor-pointer transition-all
                  ${bgColor} ${textColor} ${borderColor}
                  ${isPastDay || isHolidayDay || isFridayDay || isTomorrowDay ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md hover:scale-105'}
                `}
              >
                <div className="flex flex-col h-full">
                  <span className="text-sm font-medium">{persianDay}</span>
                  {isHolidayDay && (
                    <span className="text-xs mt-1 font-semibold">تعطیل</span>
                  )}
                  {isFridayDay && !isHolidayDay && (
                    <span className="text-xs mt-1 font-semibold text-orange-600 dark:text-orange-400">
                      جمعه
                    </span>
                  )}
                  {isTomorrowDay && !isHolidayDay && !isFridayDay && (
                    <span className="text-xs mt-1 font-semibold text-gray-500 dark:text-gray-400">
                      غیرفعال
                    </span>
                  )}
                  {hasLeave && (
                    <span className="text-xs mt-1">
                      {leaveStatus === 'accepted'
                        ? '✓ تایید'
                        : leaveStatus === 'rejected'
                        ? '✗ رد'
                        : 'در انتظار'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Leave Requests */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          درخواست‌های مرخصی من
        </h2>
        {myLeaves.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            هیچ درخواست مرخصی ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-3">
            {myLeaves.map((leave) => (
              <div
                key={leave.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-reverse space-x-3 mb-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatPersianDate(leave.date)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.status === 'accepted'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : leave.status === 'rejected'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                      >
                        {leave.status === 'accepted'
                          ? 'تایید شده'
                          : leave.status === 'rejected'
                          ? 'رد شده'
                          : 'در انتظار'}
                      </span>
                    </div>
                    {leave.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {leave.reason}
                      </p>
                    )}
                    {leave.rejection_message && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                        پیام مدیر: {leave.rejection_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                درخواست مرخصی
              </h3>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setSelectedDate(null);
                  setLeaveReason('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                تاریخ: {formatPersianDate(selectedDate)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                دلیل مرخصی <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="دلیل درخواست مرخصی را وارد کنید..."
              />
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex space-x-reverse space-x-3">
              <button
                onClick={handleSubmitLeave}
                disabled={submitting || !leaveReason.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'در حال ارسال...' : 'ارسال درخواست'}
              </button>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setSelectedDate(null);
                  setLeaveReason('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;

