import { useState, useEffect } from 'react';
import { attendanceApi } from '../api/attendanceApi';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [weekAttendance, setWeekAttendance] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Fetch today's attendance
      try {
        const todayResponse = await attendanceApi.getTodayAttendance();
        // Backend returns {} if no attendance exists (200 OK)
        // If response.data is empty or doesn't have id, it means no attendance record exists
        if (todayResponse.data && todayResponse.data.id) {
          setTodayAttendance(todayResponse.data);
        } else {
          setTodayAttendance(null);
        }
      } catch (error) {
        // Fallback for any other errors
        console.error('Failed to fetch today attendance:', error);
        setTodayAttendance(null);
      }

      // Fetch past week attendance
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      const weekResponse = await attendanceApi.getMyAttendance({
        date_from: weekAgo.toISOString().split('T')[0],
        date_to: today.toISOString().split('T')[0],
      });
      
      setWeekAttendance(weekResponse.data.results || weekResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await attendanceApi.checkIn();
      setTodayAttendance(response.data);
      // Refresh data
      await fetchAttendanceData();
    } catch (error) {
      alert(error.response?.data?.detail || 'ورود با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance?.id) return;
    
    setCheckingOut(true);
    try {
      const response = await attendanceApi.checkOut();
      setTodayAttendance(response.data);
      // Refresh data
      await fetchAttendanceData();
    } catch (error) {
      alert(error.response?.data?.detail || 'خروج با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '—';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours} ساعت و ${diffMinutes} دقیقه`;
  };

  // محاسبه مجموع ساعات از اول هفته تا امروز (شنبه = اولین روز هفته)
  const calculateCurrentWeekHours = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // پیدا کردن شنبه هفته (اول هفته)
    // در JavaScript: getDay() برمی‌گرداند: 0 = یکشنبه, 1 = دوشنبه, ..., 6 = شنبه
    const dayOfWeek = today.getDay(); // 0 = یکشنبه, 6 = شنبه
    // محاسبه تعداد روزهای لازم برای برگشت به شنبه
    // شنبه (6) = 0 روز، یکشنبه (0) = 6 روز، دوشنبه (1) = 5 روز، ...
    const daysToSaturday = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - daysToSaturday);
    saturday.setHours(0, 0, 0, 0);
    
    // محاسبه مجموع ساعات از شنبه تا امروز (شامل امروز)
    let totalHours = 0;
    weekAttendance.forEach((attendance) => {
      if (!attendance.check_in || !attendance.check_out) return;
      
      const attDate = new Date(attendance.date || attendance.check_in);
      attDate.setHours(0, 0, 0, 0);
      
      // اگر تاریخ حضور بین شنبه و امروز باشد (شامل هر دو)
      if (attDate >= saturday && attDate <= today) {
        const start = new Date(attendance.check_in);
        const end = new Date(attendance.check_out);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60); // به ساعت
        totalHours += diffHours;
      }
    });
    
    return totalHours;
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) {
      return `${h} ساعت`;
    }
    return `${h} ساعت و ${m} دقیقه`;
  };

  const getStatusBadge = (attendance) => {
    if (!attendance.check_in) {
      return (
        <span className="neon-box neon-gray px-2 py-1 text-xs font-semibold rounded-full bg-gray-800/50 border border-gray-500/50 text-gray-300">
          ورود ثبت نشده
        </span>
      );
    }
    if (!attendance.check_out) {
      return (
        <span className="neon-box neon-cyan px-2 py-1 text-xs font-semibold rounded-full bg-gray-800/50 border border-cyan-500/50 text-cyan-300">
          ورود ثبت شده
        </span>
      );
    }
    return (
      <span className="neon-box neon-green px-2 py-1 text-xs font-semibold rounded-full bg-gray-800/50 border border-green-500/50 text-green-300">
        کامل
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری حضور و غیاب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-cyan-300 neon-text">حضور و غیاب</h1>
        <p className="mt-1 text-sm text-cyan-400/70">
          پیگیری حضور و غیاب روزانه و ساعات کاری
        </p>
      </div>

      {/* Today's Status */}
      <div className="neon-card bg-gray-900 dark:bg-gray-950 rounded-lg shadow-lg border border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-cyan-300">
              حضور و غیاب امروز
            </h2>
          </div>
          {/* باکس مجموع ساعات هفته */}
          <div className="neon-box neon-pink p-4 bg-gray-800/50 rounded-lg border border-pink-500/50">
            <p className="text-sm text-pink-400 font-medium mb-1">
              مجموع ساعات از اول هفته
            </p>
            <p className="text-2xl font-bold text-pink-300">
              {formatHours(calculateCurrentWeekHours())}
            </p>
          </div>
        </div>

        {!todayAttendance ? (
          // No check-in yet
          <div className="text-center py-8">
            <ClockIcon className="w-16 h-16 text-cyan-400/60 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-cyan-300 mb-2">
              ورود ثبت نشده
            </h3>
            <p className="text-cyan-400/70 mb-6">
              برای شروع روز کاری خود، دکمه زیر را کلیک کنید
            </p>
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="neon-button neon-green px-6 py-3 text-white rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {checkingIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>در حال ثبت ورود...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>ورود</span>
                </>
              )}
            </button>
          </div>
        ) : !todayAttendance.check_out ? (
          // Checked in but not checked out
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="neon-box neon-cyan p-4 bg-gray-800/50 rounded-lg border border-cyan-500/50">
                <p className="text-sm text-cyan-400 font-medium mb-1">
                  زمان ورود
                </p>
                <p className="text-2xl font-bold text-cyan-300">
                  {formatTime(todayAttendance.check_in)}
                </p>
                <p className="text-xs text-cyan-400/80 mt-1">
                  {formatDate(todayAttendance.check_in)}
                </p>
              </div>
              <div className="neon-box neon-purple p-4 bg-gray-800/50 rounded-lg border border-purple-500/50">
                <p className="text-sm text-purple-400 font-medium mb-1">
                  زمان خروج
                </p>
                <p className="text-2xl font-bold text-purple-300">
                  در انتظار
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="neon-button neon-red px-6 py-3 text-white rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {checkingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>در حال ثبت خروج...</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-5 h-5" />
                    <span>خروج</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Both check-in and check-out done
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="neon-box neon-cyan p-4 bg-gray-800/50 rounded-lg border border-cyan-500/50">
                <p className="text-sm text-cyan-400 font-medium mb-1">
                  زمان ورود
                </p>
                <p className="text-2xl font-bold text-cyan-300">
                  {formatTime(todayAttendance.check_in)}
                </p>
                <p className="text-xs text-cyan-400/80 mt-1">
                  {formatDate(todayAttendance.check_in)}
                </p>
              </div>
              <div className="neon-box neon-red p-4 bg-gray-800/50 rounded-lg border border-red-500/50">
                <p className="text-sm text-red-400 font-medium mb-1">
                  زمان خروج
                </p>
                <p className="text-2xl font-bold text-red-300">
                  {formatTime(todayAttendance.check_out)}
                </p>
                <p className="text-xs text-red-400/80 mt-1">
                  {formatDate(todayAttendance.check_out)}
                </p>
              </div>
              <div className="neon-box neon-purple p-4 bg-gray-800/50 rounded-lg border border-purple-500/50">
                <p className="text-sm text-purple-400 font-medium mb-1">
                  مدت زمان کل
                </p>
                <p className="text-2xl font-bold text-purple-300">
                  {calculateDuration(todayAttendance.check_in, todayAttendance.check_out)}
                </p>
                <p className="text-xs text-purple-400/80 mt-1">
                  ساعات کاری
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="neon-box neon-green inline-flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-green-500/50 rounded-full">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">
                  حضور و غیاب امروز کامل شد
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Past Week Attendance */}
      <div className="neon-card bg-gray-900 dark:bg-gray-950 rounded-lg shadow-lg border border-cyan-500/30 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ClockIcon className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-semibold text-cyan-300">
            حضور و غیاب هفته گذشته
          </h2>
        </div>

        {weekAttendance.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-cyan-400/60 mx-auto mb-3" />
            <p className="text-cyan-400/70">هیچ رکورد حضور و غیابی برای هفته گذشته یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-800/70 border-b border-cyan-500/30">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    ورود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    خروج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    مدت زمان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-cyan-500/20">
                {weekAttendance.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-300">
                      {formatDate(attendance.date || attendance.check_in)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400/80">
                      {attendance.check_in ? formatTime(attendance.check_in) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400/80">
                      {attendance.check_out ? formatTime(attendance.check_out) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-pink-400/80">
                      {calculateDuration(attendance.check_in, attendance.check_out)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(attendance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
  /* Neon Dark Theme Styles */
  .neon-card {
    background: #0f172a;
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.05);
  }

  .neon-box {
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .neon-box:hover {
    transform: translateY(-2px);
  }

  .neon-box.neon-cyan {
    border-color: rgba(6, 182, 212, 0.5);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.3), inset 0 0 10px rgba(6, 182, 212, 0.1);
  }

  .neon-box.neon-cyan:hover {
    box-shadow: 0 0 25px rgba(6, 182, 212, 0.5), inset 0 0 15px rgba(6, 182, 212, 0.15);
  }

  .neon-box.neon-purple {
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.3), inset 0 0 10px rgba(168, 85, 247, 0.1);
  }

  .neon-box.neon-purple:hover {
    box-shadow: 0 0 25px rgba(168, 85, 247, 0.5), inset 0 0 15px rgba(168, 85, 247, 0.15);
  }

  .neon-box.neon-pink {
    border-color: rgba(236, 72, 153, 0.5);
    box-shadow: 0 0 15px rgba(236, 72, 153, 0.3), inset 0 0 10px rgba(236, 72, 153, 0.1);
  }

  .neon-box.neon-pink:hover {
    box-shadow: 0 0 25px rgba(236, 72, 153, 0.5), inset 0 0 15px rgba(236, 72, 153, 0.15);
  }

  .neon-box.neon-red {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1);
  }

  .neon-box.neon-red:hover {
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.5), inset 0 0 15px rgba(239, 68, 68, 0.15);
  }

  .neon-box.neon-green {
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 10px rgba(34, 197, 94, 0.1);
  }

  .neon-box.neon-green:hover {
    box-shadow: 0 0 25px rgba(34, 197, 94, 0.5), inset 0 0 15px rgba(34, 197, 94, 0.15);
  }

  .neon-box.neon-gray {
    border-color: rgba(156, 163, 175, 0.5);
    box-shadow: 0 0 15px rgba(156, 163, 175, 0.3), inset 0 0 10px rgba(156, 163, 175, 0.1);
  }

  .neon-button {
    border: 2px solid;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .neon-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .neon-button:hover::before {
    left: 100%;
  }

  .neon-button.neon-green {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.8);
    color: #4ade80;
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), inset 0 0 20px rgba(34, 197, 94, 0.1);
  }

  .neon-button.neon-green:hover {
    background: rgba(34, 197, 94, 0.2);
    box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), inset 0 0 30px rgba(34, 197, 94, 0.2);
    transform: translateY(-2px);
  }

  .neon-button.neon-red {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.8);
    color: #f87171;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.1);
  }

  .neon-button.neon-red:hover {
    background: rgba(239, 68, 68, 0.2);
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.2);
    transform: translateY(-2px);
  }

  .neon-text {
    text-shadow: 0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.6), 0 0 30px rgba(6, 182, 212, 0.4);
  }
`}</style>
    </div>
  );
};

export default Attendance;
