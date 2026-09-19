import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi } from '../../api/users';
import axiosClient from '../../api/axiosClient';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 3, // default EMPLOYEE
    task_id: '', // برای نقش SUPERVISOR (به صورت "task_{id}" ذخیره می‌شود)
  });
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // بارگذاری اطلاعات کاربر
        const res = await usersApi.getUser(id);
        
        // بارگذاری لیست تسک‌ها از endpoint مخصوص انتخاب نقش
        const tasksRes = await usersApi.getTasksForRoleSelection(id);
        const tasksList = tasksRes.data || [];
        // همه تسک‌ها را نگه دار (شامل تسک حضور و غیاب)
        setTasks(tasksList);
        
        // بارگذاری لیست کاربران
        const usersRes = await axiosClient.get('/accounts/users/');
        setUsers(usersRes.data || []);
        
        // پیدا کردن تسکی که این کاربر مدیر آن است
        let currentTaskId = '';
        if (res.data.role === 2) {
          const managedTask = tasksList.find(task => task.is_current_user_manager);
          if (managedTask) {
            currentTaskId = `task_${managedTask.id}`;
          }
        }
        
        setFormData({
          username: res.data.username,
          password: '',
          role: res.data.role === 2 ? 2 : res.data.role, // اگر SUPERVISOR است، 2 بماند
          task_id: currentTaskId,
        });
      } catch (err) {
        console.error('Failed to load data:', err);
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'بارگذاری اطلاعات با خطا مواجه شد.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // اگر نقش تغییر کرد
      if (name === 'role') {
        if (value.startsWith('task_')) {
          // اگر یک تسک انتخاب شده، role را 2 (SUPERVISOR) تنظیم کن
          newData.role = 2;
          newData.task_id = value;
        } else {
          // اگر مدیر تیم یا کاربر عادی انتخاب شده
          const roleValue = parseInt(value, 10);
          newData.role = roleValue;
          if (roleValue !== 2) {
            newData.task_id = '';
          }
        }
      }
      
      // اگر task_id تغییر کرد (مستقیم)
      if (name === 'task_id' && value) {
        newData.role = 2;
      }
      
      return newData;
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // اعتبارسنجی: اگر نقش SUPERVISOR است، باید تسک انتخاب شود
    if (formData.role === 2 && !formData.task_id) {
      setError('برای نقش مدیر تسک باید یک تسک انتخاب شود.');
      return;
    }
    
    setSaving(true);

    const payload = {
      username: formData.username,
      role: formData.role,
    };
    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }
    
    // اگر نقش SUPERVISOR است، task_id را اضافه کن
    if (formData.role === 2 && formData.task_id) {
      // استخراج ID از فرمت "task_{id}"
      const taskId = formData.task_id.startsWith('task_') 
        ? parseInt(formData.task_id.replace('task_', ''), 10)
        : parseInt(formData.task_id, 10);
      payload.task_id = taskId;
    }

    try {
      await usersApi.updateUser(id, payload);
      setSuccess('اطلاعات کاربر با موفقیت ذخیره شد.');
    } catch (err) {
      console.error('Failed to update user:', err);
      const errorData = err.response?.data || {};
      const msg =
        errorData.detail ||
        errorData.message ||
        (errorData.task_id && Array.isArray(errorData.task_id) ? errorData.task_id[0] : null) ||
        Object.values(errorData).flat().join(', ') ||
        'ذخیره اطلاعات کاربر با خطا مواجه شد.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری اطلاعات کاربر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ویرایش کاربر</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            تغییر نام کاربری، رمز عبور و نقش کاربر.
          </p>
        </div>
        <button
          onClick={() => navigate('/users')}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
        >
          بازگشت
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نام کاربری
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            رمز عبور جدید (اختیاری)
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="اگر خالی باشد، رمز عبور قبلی حفظ می‌شود."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نقش کاربر
          </label>
          <select
            name="role"
            value={formData.role === 2 ? formData.task_id || formData.role : formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>مدیر تیم</option>
            <option value={3}>کاربر عادی</option>
            {/* گزینه‌های مدیر تسک برای هر تسک */}
            {tasks.map((task) => {
              const taskOptionValue = `task_${task.id}`;
              
              return (
                <option
                  key={task.id}
                  value={taskOptionValue}
                  disabled={!task.can_select}
                >
                  {!task.can_select
                    ? `مدیر تسک (${task.title}) - دارای مدیر`
                    : `مدیر تسک (${task.title})`}
                </option>
              );
            })}
          </select>
          {formData.role === 2 && formData.task_id && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              نقش: مدیر تسک انتخاب شده است.
            </p>
          )}
        </div>

        {/* نمایش لیست اعضای تیم برای انتخاب مدیر تسک */}
        {formData.role === 2 && formData.task_id && users.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اعضای تیم (برای اطلاعات)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-3 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-reverse space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user.username}
                    </span>
                    {user.id === parseInt(id) && (
                      <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                        (کاربر فعلی - مدیر تسک)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              کاربر فعلی ({formData.username}) به عنوان مدیر تسک انتخاب شده تنظیم می‌شود.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-reverse space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
          >
            بازگشت
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;


