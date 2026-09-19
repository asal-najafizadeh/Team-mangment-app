import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { tasksApi } from '../../api/tasksApi';

const CreateTask = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    overview: '',
    manager: '',
    assigned_members_ids: [],
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await axiosClient.get('/accounts/users/');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('بارگذاری لیست کاربران با خطا مواجه شد.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleMembersChange = (e) => {
    const options = Array.from(e.target.selectedOptions || []);
    const values = options.map((opt) => opt.value);
    setFormData((prev) => ({
      ...prev,
      assigned_members_ids: values,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('اسم تسک الزامی است.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      overview: formData.overview.trim(),
    };

    if (formData.manager) {
      payload.manager = parseInt(formData.manager, 10);
    }

    if (formData.assigned_members_ids.length > 0) {
      payload.assigned_members_ids = formData.assigned_members_ids.map((id) =>
        parseInt(id, 10),
      );
    }

    setFormSubmitting(true);
    try {
      await tasksApi.createTask(payload);
      navigate('/tasks');
    } catch (err) {
      console.error('Create task error:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'ایجاد تسک با خطا مواجه شد. (احتمالاً فقط مدیر اجازه ساخت تسک دارد)';
      setError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ساخت تسک جدید</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          فرم ساخت تسک با فیلدهای موردنیاز سیستم.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6"
      >
        {/* عنوان */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            اسم تسک
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="مثلاً: گزارش‌گیری روزانه فروش"
          />
        </div>

        {/* توضیحات */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            توضیحات تسک
          </label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="توضیح مختصر درباره این تسک..."
          />
        </div>

        {/* وظایف کلی */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            وظایف کلی
          </label>
          <textarea
            name="overview"
            rows={4}
            value={formData.overview}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="شرح کلی مسئولیت‌ها و خروجی مورد انتظار از این تسک..."
          />
        </div>

        {/* اعضا و مدیر */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              اعضای تسک
            </label>
            <select
              multiple
              name="assigned_members_ids"
              value={formData.assigned_members_ids}
              onChange={handleMembersChange}
              disabled={loadingUsers}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {loadingUsers ? (
                <option>در حال بارگذاری کاربران...</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                    {user.first_name || user.last_name
                      ? ` - ${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : ''}
                  </option>
                ))
              )}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              برای انتخاب چند نفر، از Ctrl/Shift روی دسکتاپ استفاده کنید.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              مدیر تسک
            </label>
            <select
              name="manager"
              value={formData.manager}
              onChange={handleInputChange}
              disabled={loadingUsers}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">انتخاب نشده</option>
              {!loadingUsers &&
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                    {user.first_name || user.last_name
                      ? ` - ${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-reverse space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
          >
            لغو
          </button>
          <button
            type="submit"
            disabled={formSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formSubmitting ? 'در حال ساخت...' : 'ساخت تسک جدید'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;


