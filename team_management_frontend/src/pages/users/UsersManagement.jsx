import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { authApi } from '../../api/authApi';
import { UserPlusIcon } from '@heroicons/react/24/outline';

const roleLabel = (user) => {
  // اگر role_display === "ADMIN" یا is_superuser: مدیر تیم
  if (user.role_display === 'ADMIN' || user.is_superuser) {
    return 'مدیر تیم';
  }
  
  // اگر role === "user" یا role_display === "EMPLOYEE": کاربر عادی
  if (user.role === 'user' || user.role_display === 'EMPLOYEE') {
    return 'کاربر عادی';
  }
  
  // اگر role_display === "SUPERVISOR" یا role === "task_manager": مدیر تسک
  if (user.role_display === 'SUPERVISOR' || (user.role === 'task_manager' && user.role_display !== 'ADMIN')) {
    if (user.managed_tasks && user.managed_tasks.length > 0) {
      // اگر چند تسک دارد، همه را نمایش بده
      const tasksList = user.managed_tasks.join('، ');
      return `مدیر تسک (${tasksList})`;
    } else {
      return 'مدیر تسک';
    }
  }
  
  return user.role || 'نامشخص';
};

const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isManager, setIsManager] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.getUsersWithStats();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users with stats:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'بارگذاری لیست کاربران با خطا مواجه شد (فقط ادمین اجازه دسترسی دارد).';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkManagerAndLoadUsers();
  }, []);

  const checkManagerAndLoadUsers = async () => {
    try {
      const userResponse = await authApi.getCurrentUser();
      const role = userResponse.data.role;
      const isSuper = userResponse.data.is_superuser;
      // مدیر تیم = ADMIN یا SUPERVISOR یا سوپر یوزر
      setIsManager(isSuper || role === 1 || role === 2);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      setIsManager(false);
    }
    await loadUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    setDeletingId(id);
    setError('');
    try {
      await usersApi.deleteUser(id);
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'حذف کاربر با خطا مواجه شد.';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">مدیریت کاربران</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            این صفحه فقط برای مدیر سیستم قابل دسترسی است.
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => navigate('/users/new')}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            <UserPlusIcon className="w-5 h-5 ml-2" />
            اضافه کردن کاربر جدید
          </button>
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
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  نقش
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  تعداد اخطار
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    هیچ کاربری یافت نشد.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/60">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {roleLabel(user)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {user.total_warnings}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-center space-x-reverse space-x-2">
                        <button
                          onClick={() => navigate(`/users/edit/${user.id}`)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === user.id ? 'در حال حذف...' : 'حذف'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;


