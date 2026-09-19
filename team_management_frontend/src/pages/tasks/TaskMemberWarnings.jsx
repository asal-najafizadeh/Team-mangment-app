import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tasksApi } from '../../api/tasksApi';
import { warningsApi } from '../../api/warnings';

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

const TaskMemberWarnings = () => {
  const { taskId, userId } = useParams();
  const navigate = useNavigate();

  const [taskTitle, setTaskTitle] = useState('');
  const [username, setUsername] = useState('');
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarningId, setSelectedWarningId] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // اول اطلاعات اصلی تسک و اعضا را می‌گیریم تا نام تسک و کاربر را داشته باشیم
      const panelRes = await tasksApi.getTaskManagerPanel(taskId);
      setTaskTitle(panelRes.data?.title || '');

      const member = (panelRes.data?.members || []).find((m) => String(m.id) === String(userId));
      setUsername(member?.username || '');

      // سپس تاریخچه اخطارهای این کاربر برای همین تسک
      const historyRes = await tasksApi.getTaskMemberWarnings(taskId, userId);
      setPending(historyRes.data?.pending || []);
      setHistory(historyRes.data?.history || []);
    } catch (err) {
      console.error('Failed to load task member warnings:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'بارگذاری تاریخچه اخطارهای این کاربر برای این تسک با خطا مواجه شد.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [taskId, userId]);

  const handleBack = () => {
    navigate(`/task-manager/${taskId}`);
  };

  const handleDeleteClick = (warningId) => {
    setSelectedWarningId(warningId);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleApprovePending = async (warningId) => {
    setError('');
    try {
      await warningsApi.approveWarning(warningId);
      await loadData();
    } catch (err) {
      console.error('Failed to approve pending warning:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'تایید اخطار معلق با خطا مواجه شد.';
      setError(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWarningId) return;

    setDeletingId(selectedWarningId);
    setError('');
    try {
      await warningsApi.deleteWarning(selectedWarningId, deleteReason);
      setShowDeleteModal(false);
      setSelectedWarningId(null);
      setDeleteReason('');
      await loadData();
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
            اخطارهای تسک {taskTitle || '—'} برای کاربر {username || `#${userId}`}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            این لیست فقط اخطارهای مربوط به همین تسک را نمایش می‌دهد (هم اخطارهای فعال و هم اخطارهای حذف‌شده به‌همراه لاگ).
          </p>
        </div>
        <button
          onClick={handleBack}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
        >
          بازگشت به پنل مدیر تسک
        </button>
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
        ) : history.length === 0 && pending.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            برای این کاربر در این تسک هیچ فعالیت اخطاری ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-4">
            {/* اخطارهای معلق */}
            {pending.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  اخطارهای معلق (در انتظار تایید مدیر تسک)
                </h2>
                <ul className="space-y-2">
                  {pending.map((item) => (
                    <li
                      key={item.id}
                      className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200">
                            اخطار معلق: {item.amount}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            تاریخ ایجاد: {formatDateTime(item.date)}
                          </span>
                          {item.pending_until && (
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              مهلت تا: {formatDateTime(item.pending_until)}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">یادداشت: </span>
                            <span className="whitespace-pre-wrap">{item.note}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex space-x-reverse space-x-2">
                        <button
                          type="button"
                          onClick={() => handleApprovePending(item.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white"
                        >
                          ثبت اخطار
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                        >
                          لغو اخطار
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* تاریخچه اخطارهای تاییدشده و حذف‌شده */}
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {history.map((item, index) => {
              const isActive = item.type === 'active';
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
                          اخطار فعال: {item.amount}
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

                    {item.note && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">یادداشت: </span>
                        <span className="whitespace-pre-wrap">{item.note}</span>
                      </div>
                    )}

                    {!isActive && item.warning_created_at && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        تاریخ دریافت اخطار: {formatDateTime(item.warning_created_at)}
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

                  {isActive && item.can_delete && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleDeleteClick(item.id)}
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
          </div>
        )}
      </div>

      {/* Modal حذف اخطار */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              حذف اخطار (فقط برای این تسک)
            </h3>
            <div className="space-y-4">
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

export default TaskMemberWarnings;


