import { useState, useEffect } from 'react';
import { reportsApi } from '../api/reportsApi';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatPersianDate } from '../utils/dateUtils';

const ManagerReports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusVerified, setStatusVerified] = useState({}); // { reportId: status_verified }

  // Status options for manager verification
  const statusOptions = [
    { value: 1, label: 'کامل و گزارش داده' },
    { value: 2, label: 'ناقص و بدون گزارش' },
    { value: 3, label: 'گزارش فیک' },
    { value: 4, label: 'انجام داده ولی گزارش نداده' },
  ];

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getReports({
        status_verified: null, // Only pending reports
      });
      setReports(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch pending reports:', error);
      setError('Failed to load pending reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (reportId) => {
    const selectedStatus = statusVerified[reportId];
    if (!selectedStatus) {
      setError('لطفاً وضعیت گزارش را انتخاب کنید');
      return;
    }

    setProcessingId(reportId);
    setError('');
    setSuccess('');
    try {
      await reportsApi.verifyReport(reportId, selectedStatus);
      setSuccess('گزارش با موفقیت تایید شد!');
      setStatusVerified((prev) => {
        const newStatus = { ...prev };
        delete newStatus[reportId];
        return newStatus;
      });
      await fetchPendingReports();
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'تایید گزارش با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusSentBadge = (status) => {
    const statusConfig = {
      1: {
        label: 'کامل و گزارش داده',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
      2: {
        label: 'ناقص و بدون گزارش',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
      3: {
        label: 'گزارش فیک',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      },
      4: {
        label: 'انجام داده ولی گزارش نداده',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      },
    };

    const config = statusConfig[status] || statusConfig[2];
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return formatPersianDate(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pending reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          بررسی و تایید گزارش‌ها
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          بررسی و تایید گزارش‌های ارسالی کاربران
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {success}
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setSuccess('')}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setError('')}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <DocumentTextIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            گزارش‌های در انتظار بررسی ({reports.length})
          </h2>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              هیچ گزارش در انتظار بررسی وجود ندارد. همه گزارش‌ها بررسی شده‌اند.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Report Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        جزئیات گزارش
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">
                            کاربر:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {report.user?.username || 'نامشخص'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">
                            تسک:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {report.task?.title || 'نامشخص'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">
                            تاریخ گزارش:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(report.report_date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">
                            وضعیت ارسالی:
                          </span>
                          <div>{getStatusSentBadge(report.status_sent)}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32">
                            زمان ارسال:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDateTime(report.created_at)}
                          </span>
                        </div>
                        {report.note && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                              یادداشت:
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                              {report.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      تایید گزارش
                    </h3>
                    <div className="space-y-3">
                      {/* Status Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          وضعیت <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={statusVerified[report.id] || ''}
                          onChange={(e) =>
                            setStatusVerified((prev) => ({
                              ...prev,
                              [report.id]: parseInt(e.target.value),
                            }))
                          }
                          disabled={processingId === report.id}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">انتخاب وضعیت</option>
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          توجه: انتخاب هر وضعیت به جز "کامل و گزارش داده" باعث ایجاد اخطار برای کاربر می‌شود.
                        </p>
                      </div>

                      {/* Verify Button */}
                      <button
                        onClick={() => handleVerify(report.id)}
                        disabled={processingId === report.id || !statusVerified[report.id]}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === report.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>در حال پردازش...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>تایید گزارش</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerReports;

