import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tasksApi } from '../../api/tasksApi';
import { reportsApi } from '../../api/reportsApi';
import { PencilIcon } from '@heroicons/react/24/outline';

const TaskManagerPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [task, setTask] = useState(null);
  const [todayReports, setTodayReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await tasksApi.getTaskManagerPanel(id);
        setTask(res.data);
      } catch (err) {
        console.error('Failed to load task manager panel:', err);
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'بارگذاری پنل مدیریتی تسک با خطا مواجه شد.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchTodayReports();
  }, [id]);

  const fetchTodayReports = async () => {
    setLoadingReports(true);
    try {
      const res = await tasksApi.getTodayReports(id);
      setTodayReports(res.data?.reports || []);
    } catch (err) {
      console.error('Failed to load today reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleVerifyReport = async (reportId, statusVerified) => {
    if (!reportId) return;
    
    setVerifyingId(reportId);
    try {
      await reportsApi.verifyReport(reportId, statusVerified);
      await fetchTodayReports();
    } catch (err) {
      console.error('Failed to verify report:', err);
      alert(err.response?.data?.detail || 'تایید گزارش با خطا مواجه شد.');
    } finally {
      setVerifyingId(null);
    }
  };


  const getStatusLabel = (status) => {
    const labels = {
      1: 'کامل و گزارش داده',
      2: 'ناقص و بدون گزارش',
      3: 'گزارش فیک',
      4: 'انجام داده ولی گزارش نداده',
    };
    return labels[status] || '—';
  };

  const getStatusColor = (status) => {
    if (status === 1) return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  };

  const handleBack = () => {
    navigate('/tasks');
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-500 dark:text-gray-400">
        در حال بارگذاری پنل مدیریتی تسک...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">پنل مدیریتی تسک</h1>
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
          >
            بازگشت
          </button>
        </div>
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            پنل مدیریتی تسک {task.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            لیست اعضای این تسک و مجموع اخطارهای هر نفر.
          </p>
        </div>
        <div className="flex items-center space-x-reverse space-x-3">
          <button
            onClick={() => navigate(`/tasks/edit/${id}`)}
            className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            <span>ویرایش تسک</span>
          </button>
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
          >
            بازگشت به لیست تسک‌ها
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        {(task.description || task.overview) && (
          <div className="space-y-2">
            {task.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.description}
              </p>
            )}
            {task.overview && (
              <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                {task.overview}
              </p>
            )}
          </div>
        )}

        {/* بخش گزارش‌های امروز */}
        <div className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              گزارش‌های امروز
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              مدیر تسک باید تا ساعت 23:00 گزارش‌های اعضا را تایید کند. گزارش به‌صورت خودکار در ساعت 23:00 به تلگرام ارسال می‌شود.
            </p>
          </div>

          {loadingReports ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              در حال بارگذاری گزارش‌های امروز...
            </div>
          ) : todayReports.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              امروز هیچ گزارشی ارسال نشده است.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      کاربر
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      وضعیت ارسال
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      وضعیت تایید
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {todayReports.map((report) => (
                    <tr key={report.user_id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {report.username}
                        {report.is_on_leave && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            (مرخصی)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {report.status_sent ? (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status_sent)}`}>
                            {report.status_sent_display}
                          </span>
                        ) : (
                          <span className="text-gray-400">گزارش ارسال نشده</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {report.status_verified ? (
                          <div>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status_verified)}`}>
                              {report.status_verified_display}
                            </span>
                            {report.verified_by && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                توسط: {report.verified_by}
                              </p>
                            )}
                            {report.has_warning && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                ⚠️ اخطار ثبت می‌شود
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">در انتظار تایید</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {report.id && !report.status_verified ? (
                          <div className="flex flex-wrap gap-2 justify-center">
                            <button
                              onClick={() => handleVerifyReport(report.id, 1)}
                              disabled={verifyingId === report.id}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                            >
                              کامل
                            </button>
                            <button
                              onClick={() => handleVerifyReport(report.id, 2)}
                              disabled={verifyingId === report.id}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
                            >
                              ناقص
                            </button>
                            <button
                              onClick={() => handleVerifyReport(report.id, 3)}
                              disabled={verifyingId === report.id}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                            >
                              فیک
                            </button>
                            <button
                              onClick={() => handleVerifyReport(report.id, 4)}
                              disabled={verifyingId === report.id}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                            >
                              بدون گزارش
                            </button>
                          </div>
                        ) : report.is_on_leave ? (
                          <span className="text-xs text-blue-600 dark:text-blue-400">معاف از گزارش</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            اعضای تسک و اخطارها
          </h2>

          {(!task.members || task.members.length === 0) ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              برای این تسک هنوز عضوی تعریف نشده است.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      کاربر
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">
                      اخطارهای این تسک (تعداد / مجموع)
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">
                      کل اخطارهای کاربر (تعداد / مجموع)
                    </th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {task.members.map((member) => {
                    const taskHasWarnings = (member.warnings_count || 0) > 0;
                    const taskBadgeClass = taskHasWarnings
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';

                    const allHasWarnings = (member.total_warnings_count || 0) > 0;
                    const allBadgeClass = allHasWarnings
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';

                    return (
                      <tr key={member.id}>
                        <td className="px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                          {member.username}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${taskBadgeClass}`}
                          >
                            {member.warnings_count || 0} / {member.warnings_amount || '0'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${allBadgeClass}`}
                          >
                            {member.total_warnings_count || 0} / {member.total_warnings_amount || '0'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-left">
                          {taskHasWarnings && (
                            <button
                              type="button"
                              onClick={() => navigate(`/task-manager/${id}/user/${member.id}`)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                            >
                              جزئیات اخطارهای این تسک
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManagerPanel;


