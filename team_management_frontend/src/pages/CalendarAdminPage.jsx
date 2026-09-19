import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calendarApi } from '../api/calendarApi';
import { authApi } from '../api/authApi';
import LeaveReviewModal from '../components/LeaveReviewModal';
import { formatPersianDate, formatPersianDateShort } from '../utils/dateUtils';
import {
  CalendarIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const CalendarAdminPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal states
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayMessage, setHolidayMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAdminAndFetchData();
  }, [currentDate]);

  const checkAdminAndFetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const userResponse = await authApi.getCurrentUser();
      const isCurrentUserAdmin =
        userResponse.data.is_superuser ||
        userResponse.data.role === 1 ||
        userResponse.data.is_staff;
      setIsAdmin(isCurrentUserAdmin);

      if (!isCurrentUserAdmin) {
        setError('شما اجازه دسترسی به این صفحه را ندارید.');
        setLoading(false);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error('Failed to check admin status:', err);
      setError('بارگذاری اطلاعات با خطا مواجه شد.');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [eventsRes, leavesRes] = await Promise.all([
        calendarApi.getEvents(),
        calendarApi.getAllLeaves(),
      ]);
      setEvents(eventsRes.data || []);
      setAllLeaves(leavesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError('بارگذاری اطلاعات تقویم با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const saturdayFirstDay = (startingDayOfWeek + 1) % 7;

    const days = [];
    for (let i = 0; i < saturdayFirstDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
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
    // In JavaScript, getDay() returns 0 for Sunday, 5 for Friday
    return date.getDay() === 5;
  };

  const getHolidayEvent = (date) => {
    if (!date) return null;
    const dateStr = formatDate(date);
    return events.find((event) => event.date === dateStr);
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleAddHoliday = async () => {
    if (!holidayDate || !holidayMessage.trim()) {
      setError('لطفاً تاریخ و پیام تعطیلی را وارد کنید.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await calendarApi.createEvent({
        date: holidayDate,
        message: holidayMessage.trim(),
      });
      setSuccess('روز تعطیل با موفقیت اضافه شد.');
      setShowAddHolidayModal(false);
      setHolidayDate('');
      setHolidayMessage('');
      await fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'افزودن روز تعطیل با خطا مواجه شد.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!selectedEvent) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await calendarApi.deleteEvent(selectedEvent.id);
      setSuccess('روز تعطیل با موفقیت حذف شد.');
      setShowDeleteConfirm(false);
      setSelectedEvent(null);
      await fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'حذف روز تعطیل با خطا مواجه شد.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveReview = (leave) => {
    setSelectedLeave(leave);
    setShowLeaveModal(true);
  };

  const handleLeaveHandle = async (leaveId, handleData) => {
    await calendarApi.handleLeave(leaveId, handleData);
    setSuccess('درخواست مرخصی با موفقیت به‌روزرسانی شد.');
    await fetchData();
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

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          دسترسی غیرمجاز
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          شما اجازه دسترسی به این صفحه را ندارید.
        </p>
        <button
          onClick={() => navigate('/calendar')}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
        >
          بازگشت به تقویم
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            مدیریت تقویم و مرخصی
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            مدیریت تعطیلات و درخواست‌های مرخصی
          </p>
        </div>
        <button
          onClick={() => setShowAddHolidayModal(true)}
          className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>افزودن روز تعطیل</span>
        </button>
      </div>

      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
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

        <div className="grid grid-cols-7 gap-2">
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

          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-16"></div>;
            }

            const isHolidayDay = isHoliday(day);
            const isFridayDay = isFriday(day);
            const holidayEvent = getHolidayEvent(day);
            const isPastDay = isPast(day);
            const isToday = formatDate(day) === formatDate(new Date());

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
            } else if (isToday) {
              borderColor = 'border-indigo-500 dark:border-indigo-400';
            }

            return (
              <div
                key={formatDate(day)}
                className={`
                  h-16 p-2 border-2 rounded-lg relative
                  ${bgColor} ${textColor} ${borderColor}
                  ${isHolidayDay ? 'cursor-pointer hover:shadow-md' : ''}
                `}
                onClick={() => {
                  if (isHolidayDay && holidayEvent) {
                    setSelectedEvent(holidayEvent);
                    setShowDeleteConfirm(true);
                  }
                }}
              >
                <div className="flex flex-col h-full">
                  <span className="text-sm font-medium">{day.getDate()}</span>
                  {isHolidayDay && (
                    <>
                      <span className="text-xs mt-1 font-semibold">تعطیل</span>
                      <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400 absolute top-1 left-1" />
                    </>
                  )}
                  {isFridayDay && !isHolidayDay && (
                    <span className="text-xs mt-1 font-semibold text-orange-600 dark:text-orange-400">
                      جمعه
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Leave Requests Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          همه درخواست‌های مرخصی
        </h2>
        {allLeaves.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            هیچ درخواست مرخصی ثبت نشده است.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    کاربر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    تاریخ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    دلیل
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {allLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/60">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {leave.user?.username || 'نامشخص'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatPersianDate(leave.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {leave.reason || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
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
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleLeaveReview(leave)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        بررسی
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Holiday Modal */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                افزودن روز تعطیل
              </h3>
              <button
                onClick={() => {
                  setShowAddHolidayModal(false);
                  setHolidayDate('');
                  setHolidayMessage('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاریخ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  پیام تعطیلی <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={holidayMessage}
                  onChange={(e) => setHolidayMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="پیام تعطیلی را وارد کنید..."
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="flex space-x-reverse space-x-3">
                <button
                  onClick={handleAddHoliday}
                  disabled={submitting || !holidayDate || !holidayMessage.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'در حال افزودن...' : 'افزودن'}
                </button>
                <button
                  onClick={() => {
                    setShowAddHolidayModal(false);
                    setHolidayDate('');
                    setHolidayMessage('');
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
                >
                  لغو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Holiday Confirmation Modal */}
      {showDeleteConfirm && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                حذف روز تعطیل
              </h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedEvent(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                آیا از حذف روز تعطیل{' '}
                <span className="font-medium">
                  {formatPersianDate(selectedEvent.date)}
                </span>{' '}
                مطمئن هستید؟
              </p>
              {selectedEvent.message && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  پیام: {selectedEvent.message}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex space-x-reverse space-x-3">
              <button
                onClick={handleDeleteHoliday}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'در حال حذف...' : 'حذف'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      {showLeaveModal && selectedLeave && (
        <LeaveReviewModal
          leave={selectedLeave}
          onClose={() => {
            setShowLeaveModal(false);
            setSelectedLeave(null);
            setError('');
          }}
          onHandle={handleLeaveHandle}
        />
      )}
    </div>
  );
};

export default CalendarAdminPage;

