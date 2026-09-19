import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasksApi';
import { reportsApi } from '../api/reportsApi';
import { attendanceApi } from '../api/attendanceApi';
import { authApi } from '../api/authApi';
import { warningsApi } from '../api/warnings';
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [isTeamManager, setIsTeamManager] = useState(false);
  const [warningUsers, setWarningUsers] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendingWarningsToTelegram, setSendingWarningsToTelegram] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userResponse = await authApi.getCurrentUser();
      // برای گزارش‌های در انتظار تایید: مدیر تیم، سوپر وایزر، یا staff
      const userIsStaff = userResponse.data.is_staff || userResponse.data.role === 1 || userResponse.data.role === 2 || userResponse.data.is_superuser || false;
      setIsStaff(userIsStaff);
      
      // فقط مدیر تیم (role === 1) یا superuser می‌تواند لیست همه کاربران و اخطارها را ببیند
      const userIsTeamManager = userResponse.data.is_superuser || userResponse.data.role === 1 || false;
      setIsTeamManager(userIsTeamManager);

      const today = new Date().toISOString().split('T')[0];

      const tasksResponse = await tasksApi.getMyTasks({
        deadline: today,
        status: 'todo,doing',
      });
      setTasks(tasksResponse.data.results || tasksResponse.data || []);

      try {
        const attendanceResponse = await attendanceApi.getTodayAttendance();
        // Backend returns {} if no attendance exists (200 OK)
        // If response.data is empty or doesn't have id, it means no attendance record exists
        if (attendanceResponse.data && attendanceResponse.data.id) {
          setAttendance(attendanceResponse.data);
        } else {
          setAttendance(null);
        }
      } catch (error) {
        // Fallback for any other errors
        setAttendance(null);
      }

      if (userIsStaff) {
        try {
          const reportsResponse = await reportsApi.getReports({
            status_verified: null,
            date_from: today,
          });
          setPendingReports(reportsResponse.data.results || reportsResponse.data || []);
        } catch (error) {
          console.error('Failed to fetch pending reports:', error);
        }

        // لیست کاربران و تعداد اخطارها فقط برای مدیر تیم
        if (userIsTeamManager) {
          try {
            const warningsRes = await warningsApi.getUsersSummary();
            setWarningUsers(warningsRes.data || []);
          } catch (error) {
            console.error('Failed to fetch warnings users summary:', error);
            setWarningUsers([]);
          }
        } else {
          setWarningUsers([]);
        }
      } else {
        setWarningUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await attendanceApi.checkIn();
      setAttendance(response.data);
      await fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.detail || 'ورود ناموفق بود. لطفاً دوباره تلاش کنید.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance?.id) return;
    
    setCheckingOut(true);
    try {
      const response = await attendanceApi.checkOut(attendance.id);
      setAttendance(response.data);
      await fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.detail || 'خروج ناموفق بود. لطفاً دوباره تلاش کنید.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSendDailyReport = () => {
    navigate('/reports/send');
  };

  const handleSendWarningsToTelegram = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید لیست اخطارهای کاربران را به گروه تلگرام ارسال کنید؟')) {
      return;
    }

    setSendingWarningsToTelegram(true);
    try {
      await warningsApi.sendToTelegram();
      alert('لیست اخطارها با موفقیت به گروه تلگرام ارسال شد.');
    } catch (error) {
      console.error('Failed to send warnings to Telegram:', error);
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'ارسال لیست اخطارها به تلگرام با خطا مواجه شد.';
      alert(msg);
    } finally {
      setSendingWarningsToTelegram(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      todo: {
        label: 'در انتظار',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
      doing: {
        label: 'در حال انجام',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
      done: {
        label: 'انجام شده',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
    };

    const config = statusConfig[status] || statusConfig.todo;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری داشبورد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">داشبورد</h1>
          <p className="text-lg text-white/90 font-medium">
            خوش آمدید! اینجا خلاصه امروز شماست.
          </p>
          <div className="mt-4 flex items-center space-x-reverse space-x-2">
            <div className="h-1 w-16 bg-white/30 rounded-full"></div>
            <span className="text-sm text-white/80">{new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={handleSendDailyReport}
          disabled={sendingReport}
          className="group relative overflow-hidden flex items-center justify-between p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 border-2 border-indigo-400/50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="relative z-10 flex items-center space-x-reverse space-x-4 flex-1">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-6">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-right flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                ارسال گزارش روزانه
              </h3>
              <p className="text-sm text-white/90">
                گزارش کار روزانه خود را ارسال کنید
              </p>
            </div>
          </div>
          <ArrowLeftIcon className="w-6 h-6 text-white/80 group-hover:text-white group-hover:translate-x-[-4px] transition-all duration-300 relative z-10" />
        </button>

        {!attendance && (
          <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-green-400/50">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-reverse space-x-4 mb-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-6">
                  <ClockIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    حضور و غیاب سریع
                  </h3>
                  <p className="text-sm text-white/90">
                    برای شروع روز خود ورود بزنید
                  </p>
                </div>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {checkingIn ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    در حال ورود...
                  </span>
                ) : (
                  'ورود'
                )}
              </button>
            </div>
          </div>
        )}

        {attendance && (
          <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-blue-400/50">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-reverse space-x-4 mb-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-6">
                  <ClockIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    حضور و غیاب امروز
                  </h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                      <span className="text-white/90">زمان ورود:</span>
                      <span className="font-bold text-white text-lg">
                        {formatTime(attendance.check_in)}
                      </span>
                    </div>
                    {attendance.check_out ? (
                      <div className="flex justify-between items-center p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <span className="text-white/90">زمان خروج:</span>
                        <span className="font-bold text-white text-lg">
                          {formatTime(attendance.check_out)}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleCheckOut}
                        disabled={checkingOut}
                        className="mt-2 w-full px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {checkingOut ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            در حال خروج...
                          </span>
                        ) : (
                          'خروج'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 border-b border-indigo-400/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                تسک‌های امروز
              </h2>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              مشاهده همه
            </button>
          </div>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">تسکی برای امروز وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center space-x-reverse space-x-4 text-sm">
                        {task.deadline && (
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                            📅 {new Date(task.deadline).toLocaleDateString('fa-IR')}
                          </span>
                        )}
                        {task.assigned_to && (
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                            👤 {task.assigned_to.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mr-4">{getStatusBadge(task.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* فقط برای مدیر تیم: خلاصه اخطارها */}
      {isTeamManager && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-red-500 to-pink-600 border-b border-red-400/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <XCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  خلاصه اخطارهای کاربران
                </h2>
              </div>
              <button
                onClick={() => navigate('/warnings')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                مدیریت اخطارها
              </button>
            </div>
          </div>
          <div className="p-6">
            {warningUsers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                فعلاً هیچ کاربری با اخطار ثبت شده وجود ندارد.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                        کاربر
                      </th>
                      <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400">
                        تعداد اخطار
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {warningUsers.slice(0, 6).map((u) => {
                      const hasWarnings = (u.total_warnings || 0) > 0;
                      const badgeClass = hasWarnings
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
                          onClick={() => navigate(`/warnings/user/${u.id}`)}
                        >
                          <td className="px-4 py-3 text-indigo-700 dark:text-indigo-300 font-bold">
                            {u.username}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-4 py-2 text-sm font-bold rounded-full shadow-lg ${badgeClass}`}
                            >
                              {u.total_warnings || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {warningUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSendWarningsToTelegram}
                  disabled={sendingWarningsToTelegram}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-reverse space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {sendingWarningsToTelegram ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      <span>ارسال وضعیت به بات تلگرام</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isStaff && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-600 border-b border-orange-400/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  گزارش‌های در انتظار تأیید
                </h2>
              </div>
              <button
                onClick={() => navigate('/manager/reports')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                مشاهده همه
              </button>
            </div>
          </div>
          <div className="p-6">
            {pendingReports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">گزارش در انتظار تأییدی وجود ندارد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="group p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {report.task?.title || 'تسک بدون عنوان'}
                        </h3>
                        <div className="mt-2 flex items-center space-x-reverse space-x-3 text-sm">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                            👤 {report.user?.username || 'نامشخص'}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                            📅 {new Date(report.report_date).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        {report.note && (
                          <p className="mt-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 border-r-4 border-orange-400">
                            {report.note}
                          </p>
                        )}
                      </div>
                      <div className="mr-4">
                        <span className="px-4 py-2 text-sm font-bold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 shadow-lg">
                          در انتظار
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
