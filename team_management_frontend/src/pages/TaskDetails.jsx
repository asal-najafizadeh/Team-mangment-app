import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasksApi';
import { reportsApi } from '../api/reportsApi';
import { authApi } from '../api/authApi';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [reports, setReports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch current user
      const userResponse = await authApi.getCurrentUser();
      setCurrentUser(userResponse.data);

      // Fetch task details
      const taskResponse = await tasksApi.getTask(id);
      setTask(taskResponse.data);
      setNewStatus(taskResponse.data.status);

      // Fetch reports for this task
      try {
        const reportsResponse = await reportsApi.getReports({
          task: id,
        });
        setReports(reportsResponse.data.results || reportsResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
      if (error.response?.status === 404) {
        navigate('/tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!task || newStatus === task.status) {
      setShowStatusModal(false);
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await tasksApi.updateTask(id, { status: newStatus });
      setTask(response.data);
      setShowStatusModal(false);
    } catch (error) {
      alert(error.response?.data?.detail || 'به‌روزرسانی وضعیت ناموفق بود. لطفاً دوباره تلاش کنید.');
    } finally {
      setUpdatingStatus(false);
    }
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
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'بدون مهلت';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeactivate = async () => {
    if (!window.confirm(task.is_active ? 'آیا از غیرفعال کردن این تسک مطمئن هستید؟' : 'آیا از فعال کردن این تسک مطمئن هستید؟')) {
      return;
    }
    try {
      if (task.is_active) {
        await tasksApi.deactivateTask(id);
      } else {
        await tasksApi.activateTask(id);
      }
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'عملیات ناموفق بود. لطفاً دوباره تلاش کنید.');
    }
  };

  const isOwner = currentUser && task && task.assigned_to?.id === currentUser.id;
  const isTaskManager = currentUser && task && task.manager?.id === currentUser.id;
  const isSuperAdmin = currentUser && (currentUser.is_superuser || currentUser.role === 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری جزئیات تسک...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          تسک یافت نشد
        </h3>
        <button
          onClick={() => navigate('/tasks')}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          بازگشت به تسک‌ها
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              جزئیات تسک
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-reverse space-x-3">
          {!(isSuperAdmin || isTaskManager) && getStatusBadge(task.status)}
          {(isSuperAdmin || isTaskManager) && (
            <>
              <button
                onClick={() => navigate(`/tasks/edit/${task.id}`)}
                className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
                <span>ویرایش</span>
              </button>
              <button
                onClick={handleDeactivate}
                className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
                <span>{task.is_active ? 'غیرفعال کردن' : 'فعال کردن'}</span>
              </button>
            </>
          )}
          {isOwner && !(isSuperAdmin || isTaskManager) && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
              <span>تغییر وضعیت</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              اطلاعات تسک
            </h2>
            <div className="space-y-4">
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {(isSuperAdmin || isTaskManager) && task.manager && (
                  <div className="flex items-center space-x-reverse space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">مدیر تسک</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {task.manager.username}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-reverse space-x-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">تاریخ ایجاد</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(task.created_at)}
                    </p>
                  </div>
                </div>

                {!(isSuperAdmin || isTaskManager) && (
                  <>
                    <div className="flex items-center space-x-reverse space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">واگذار شده به</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.assigned_to?.username || 'واگذار نشده'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-reverse space-x-3">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">مهلت</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(task.deadline)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {(isSuperAdmin || isTaskManager) && task.assigned_members && task.assigned_members.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">اعضای تسک:</p>
                    <div className="flex flex-wrap gap-2">
                      {task.assigned_members.map((member) => (
                        <span
                          key={member.id}
                          className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full"
                        >
                          {member.username}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                گزارش‌ها ({reports.length})
              </h2>
            </div>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">گزارشی برای این تسک وجود ندارد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {report.user?.username || 'کاربر نامشخص'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(report.report_date)}
                        </p>
                      </div>
                      {report.status_verified === null && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                          در انتظار
                        </span>
                      )}
                      {report.status_verified === 1 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          تأیید شده
                        </span>
                      )}
                    </div>
                    {report.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                        {report.note}
                      </p>
                    )}
                    {report.verified_by && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        تأیید شده توسط: {report.verified_by.username} در{' '}
                        {formatDateTime(report.created_at)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Manager Panel */}
        {isTaskManager && !isSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                پنل مدیر
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    جریمه اخطار
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {task.manager_warning_penalty || 1}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    تعداد کل گزارش‌ها
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {reports.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    در انتظار تأیید
                  </p>
                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {reports.filter((r) => r.status_verified === null).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              تغییر وضعیت تسک
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت جدید
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="todo">در انتظار</option>
                  <option value="doing">در حال انجام</option>
                  <option value="done">انجام شده</option>
                </select>
              </div>
              <div className="flex space-x-reverse space-x-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || newStatus === task.status}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی وضعیت'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setNewStatus(task.status);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;

