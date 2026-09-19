import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { warningsApi } from '../../api/warnings';
import { authApi } from '../../api/authApi';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const UserWarnings = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [canDelete, setCanDelete] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarningId, setSelectedWarningId] = useState(null);
  const [selectedWarningAmount, setSelectedWarningAmount] = useState(0);
  const [deductAmount, setDeductAmount] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [amountError, setAmountError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await warningsApi.getUserWarningHistory(id);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load warning history:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'بارگذاری تاریخچه اخطارهای کاربر با خطا مواجه شد.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authApi.getCurrentUser();
        const { role, is_superuser } = me.data;
        const userIsManager = is_superuser || role === 1 || role === 2;
        setCanDelete(userIsManager);
        setIsManager(userIsManager);
      } catch {
        setCanDelete(false);
        setIsManager(false);
      }

      await loadHistory();
    };

    init();
  }, [id]);

  const handleDeleteClick = (warningId, warningAmount) => {
    setSelectedWarningId(warningId);
    setSelectedWarningAmount(warningAmount);
    setDeductAmount('');
    setAmountError('');
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWarningId) return;

    // اعتبارسنجی مقدار حذف
    const value = parseFloat(deductAmount);
    if (!deductAmount || Number.isNaN(value)) {
      setAmountError('لطفاً مقدار اخطار برای حذف را به‌صورت عددی وارد کنید.');
      return;
    }
    if (value <= 0) {
      setAmountError('مقدار حذف باید بزرگ‌تر از صفر باشد.');
      return;
    }
    if (value > Number(selectedWarningAmount)) {
      setAmountError('نمی‌توانید بیشتر از مقدار اخطار موجود حذف کنید.');
      return;
    }

    setAmountError('');
    setDeletingId(selectedWarningId);
    setError('');
    try {
      await warningsApi.deductWarning(selectedWarningId, {
        amount: value,
        delete_reason: deleteReason,
      });
      setShowDeleteModal(false);
      setSelectedWarningId(null);
      setSelectedWarningAmount(0);
      setDeductAmount('');
      setDeleteReason('');
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete warning:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'حذف اخطار با خطا مواجه شد.';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تاریخچه اخطارهای کاربر
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            تاریخچه کامل فعالیت‌های اخطار (دریافت و حذف شده‌ها).
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => navigate('/warnings')}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
          >
            بازگشت به لیست کاربران
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            در حال بارگذاری...
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            برای این کاربر هیچ فعالیت اخطاری ثبت نشده است.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {history.map((item, index) => {
              const isActive = item.type === 'active';
              // رنگ‌بندی: قرمز برای اخطارهای فعال، سبز کم رنگ برای حذف شده‌ها
              const bgColor = isActive
                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
              
              return (
                <li
                  key={`${item.type}-${item.id}-${index}`}
                  className={`p-4 sm:p-5 border-r-4 ${bgColor} flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {isActive ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                          دریافت اخطار: {item.amount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          حذف شده: {item.amount}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {isActive ? 'تاریخ دریافت: ' : 'تاریخ حذف: '}
                        {formatDateTime(item.date)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">تسک مربوطه: </span>
                      <span>{item.task_title || `#${item.task_id}`}</span>
                    </div>
                    
                    {!isActive && item.warning_created_at && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        تاریخ دریافت اخطار: {formatDateTime(item.warning_created_at)}
                      </div>
                    )}
                    
                    {item.note && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">یادداشت: </span>
                        <span className="whitespace-pre-wrap">{item.note}</span>
                      </div>
                    )}
                    
                    {!isActive && item.delete_reason && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">دلیل حذف: </span>
                        <span className="whitespace-pre-wrap">{item.delete_reason}</span>
                      </div>
                    )}
                    
                    {!isActive && item.deleted_by && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        حذف شده توسط: {item.deleted_by}
                      </div>
                    )}
                  </div>
                  
                  {isActive && canDelete && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleDeleteClick(item.id, item.amount)}
                        disabled={deletingId === item.id}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === item.id ? 'در حال حذف...' : 'حذف اخطار'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal حذف اخطار */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              حذف اخطار (کاهش مقدار)
            </h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-medium">مقدار فعلی این اخطار:</span>{' '}
                  <span>{selectedWarningAmount}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مقدار اخطاری که می‌خواهید حذف کنید
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deductAmount}
                  onChange={(e) => setDeductAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="مثلاً 0.5"
                />
                {amountError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{amountError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دلیل حذف (اختیاری)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  placeholder="دلیل حذف این اخطار را وارد کنید..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex space-x-reverse space-x-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId ? 'در حال حذف...' : 'تأیید حذف'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedWarningId(null);
                    setDeleteReason('');
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

export default UserWarnings;


