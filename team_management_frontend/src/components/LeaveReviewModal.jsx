import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatPersianDate } from '../utils/dateUtils';

const LeaveReviewModal = ({ leave, onClose, onHandle }) => {
  const [status, setStatus] = useState('accepted');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!leave) return null;

  const handleSubmit = async () => {
    setError('');
    if (status === 'rejected' && !rejectionMessage.trim()) {
      setError('لطفاً دلیل رد را وارد کنید.');
      return;
    }

    setSubmitting(true);
    try {
      const handleData = {
        status,
      };
      if (status === 'rejected' && rejectionMessage.trim()) {
        handleData.rejection_message = rejectionMessage.trim();
      }
      await onHandle(leave.id, handleData);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'عملیات با خطا مواجه شد.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            بررسی درخواست مرخصی
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              کاربر
            </label>
            <p className="text-gray-900 dark:text-white">{leave.user?.username || 'نامشخص'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تاریخ
            </label>
            <p className="text-gray-900 dark:text-white">
              {formatPersianDate(leave.date)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              دلیل
            </label>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {leave.reason || '—'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              وضعیت فعلی
            </label>
            <span
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
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
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تصمیم
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="accepted">تایید</option>
            <option value="rejected">رد</option>
          </select>
        </div>

        {status === 'rejected' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              دلیل رد <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="دلیل رد درخواست را وارد کنید..."
            />
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex space-x-reverse space-x-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || (status === 'rejected' && !rejectionMessage.trim())}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
          >
            لغو
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveReviewModal;

