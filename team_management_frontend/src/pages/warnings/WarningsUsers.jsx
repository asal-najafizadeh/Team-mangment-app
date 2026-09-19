import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { warningsApi } from '../../api/warnings';
import { authApi } from '../../api/authApi';

const WarningsUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authApi.getCurrentUser();
        const { id, role, is_superuser } = me.data;
        // فقط مدیر تیم (role === 1) یا superuser می‌تواند لیست همه کاربران را ببیند
        const isTeamManager = is_superuser || role === 1;
        setIsSuperuser(is_superuser);

        // اگر کاربر مدیر تیم نیست → مستقیم به تاریخچه اخطار خودش هدایت شود
        if (!isTeamManager) {
          navigate(`/warnings/user/${id}`, { replace: true });
          return;
        }

        setLoading(true);
        setError('');
        const res = await warningsApi.getUsersSummary();
        setUsers(res.data || []);
      } catch (err) {
        console.error('Failed to load warnings users summary:', err);
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'بارگذاری لیست کاربران و اخطارها با خطا مواجه شد.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            لیست کاربران و اخطارها
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            لیست تمام کاربران با تعداد اخطارهای ثبت شده (از جمله کاربرانی که اخطار ندارند).
          </p>
        </div>

        {/* فقط برای سوپر ادمین: دکمه تنظیمات اخطارها */}
        {isSuperuser && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate('/warnings/settings')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              تنظیمات اخطارها
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  نام کاربر
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  تعداد اخطار
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    هیچ کاربری یافت نشد.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  // رنگ badge بر اساس تعداد اخطار
                  const badgeClass = user.total_warnings === 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
                  
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/60 cursor-pointer"
                      onClick={() => navigate(`/warnings/user/${user.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
                          {user.total_warnings || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WarningsUsers;


