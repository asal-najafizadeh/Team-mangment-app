import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { tasksApi } from '../../api/tasksApi';
import { authApi } from '../../api/authApi';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isTaskManager, setIsTaskManager] = useState(false);
  const [isAttendanceTask, setIsAttendanceTask] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    overview: '',
    manager: '',
    assigned_members_ids: [],
    member_assignments: [], // [{user_id, assignment}]
      weekly_required_hours: 30,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if user is super admin or task manager
        const userResponse = await authApi.getCurrentUser();
        const currentUserId = userResponse.data.id;
        const isSuper = userResponse.data.is_superuser || userResponse.data.role === 1;
        setIsSuperAdmin(isSuper);

        // Fetch task details first to check if user is task manager
        const taskRes = await tasksApi.getTask(id);
        const task = taskRes.data;
        
        const isManager = task.manager?.id === currentUserId;
        setIsTaskManager(isManager);
        setIsAttendanceTask(task.is_attendance_task || false);

        if (!isSuper && !isManager) {
          setError('شما اجازه ویرایش این تسک را ندارید.');
          setLoading(false);
          return;
        }

        // Fetch users
        const usersRes = await axiosClient.get('/accounts/users/');
        setUsers(usersRes.data);

        setFormData({
          title: task.title || '',
          description: task.description || '',
          overview: task.overview || '',
          manager: task.manager?.id || '',
          assigned_members_ids: task.assigned_members?.map((m) => m.id) || [],
          member_assignments:
            task.member_assignments?.map((ma) => ({
              user_id: ma.user.id,
              assignment: ma.assignment || '',
            })) || [],
          weekly_required_hours: task.weekly_required_hours ?? 30,
        });
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('بارگذاری اطلاعات با خطا مواجه شد.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handleMembersChange = (e) => {
    const options = Array.from(e.target.selectedOptions || []);
    const values = options.map((opt) => parseInt(opt.value, 10));
    setFormData((prev) => ({
      ...prev,
      assigned_members_ids: values,
      // Update member_assignments to include new members
      member_assignments: [
        ...prev.member_assignments.filter((ma) => values.includes(ma.user_id)),
        ...values
          .filter((uid) => !prev.member_assignments.find((ma) => ma.user_id === uid))
          .map((uid) => ({ user_id: uid, assignment: '' })),
      ],
    }));
    setError('');
    setSuccess('');
  };

  const handleAssignmentChange = (userId, assignment) => {
    setFormData((prev) => ({
      ...prev,
      member_assignments: prev.member_assignments.map((ma) =>
        ma.user_id === userId ? { ...ma, assignment } : ma
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('اسم تسک الزامی است.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      overview: formData.overview.trim(),
    };

    // فقط سوپر ادمین می‌تواند مدیر تسک را تغییر دهد
    if (isSuperAdmin && formData.manager) {
      payload.manager = parseInt(formData.manager, 10);
    }

    if (formData.assigned_members_ids.length > 0) {
      payload.assigned_members_ids = formData.assigned_members_ids.map((id) => parseInt(id, 10));
    }

    // حداقل ساعات هفتگی فقط برای تسک حضور و غیاب و فقط توسط مدیر تیم/سوپر ادمین
    if (isAttendanceTask && isSuperAdmin && formData.weekly_required_hours) {
      payload.weekly_required_hours = parseFloat(formData.weekly_required_hours);
    }

    // Add member assignments
    payload.member_assignments = formData.member_assignments.map((ma) => ({
      user_id: ma.user_id,
      assignment: ma.assignment || '',
    }));

    setFormSubmitting(true);
    try {
      await tasksApi.updateTask(id, payload);
      setSuccess('تسک با موفقیت به‌روزرسانی شد.');
      setTimeout(() => {
        navigate(`/tasks/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Update task error:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'به‌روزرسانی تسک با خطا مواجه شد.';
      setError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin && !isTaskManager) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          دسترسی غیرمجاز
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          شما اجازه ویرایش این تسک را ندارید.
        </p>
        <button
          onClick={() => navigate(`/tasks/${id}`)}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
        >
          بازگشت به جزئیات تسک
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <button
            onClick={() => navigate(`/tasks/${id}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ویرایش تسک</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ویرایش اطلاعات تسک
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اسم تسک {!isAttendanceTask && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            disabled={isAttendanceTask}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isAttendanceTask ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
            }`}
            required={!isAttendanceTask}
          />
          {isAttendanceTask && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              نام تسک حضور و غیاب قابل تغییر نیست.
            </p>
          )}
        </div>

        {/* حداقل ساعات کاری هفتگی برای تسک حضور و غیاب */}
        {isAttendanceTask && isSuperAdmin && (
          <div>
            <label htmlFor="weekly_required_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              حداقل ساعات کاری هفتگی (حضور و غیاب)
            </label>
            <input
              type="number"
              id="weekly_required_hours"
              name="weekly_required_hours"
              min="0"
              step="0.5"
              value={formData.weekly_required_hours}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              مقدار پیش‌فرض ۳۰ ساعت است؛ می‌توانید این مقدار را برای این تسک حضور و غیاب تغییر دهید.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            توضیحات تسک
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="توضیحات کامل تسک را اینجا وارد کنید..."
          />
        </div>

        <div>
          <label htmlFor="overview" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            وظایف کلی
          </label>
          <textarea
            id="overview"
            name="overview"
            rows={3}
            value={formData.overview}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="وظایف کلی مربوط به این تسک را وارد کنید..."
          />
        </div>

        {/* مدیر تسک فقط توسط سوپر ادمین قابل تغییر است */}
        {isSuperAdmin && (
          <div>
            <label htmlFor="manager" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مدیر تسک
            </label>
            <select
              id="manager"
              name="manager"
              value={formData.manager}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">انتخاب مدیر تسک</option>
              {users
                .filter((u) => u.role === 1 || u.role === 2 || u.is_superuser)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
            </select>
          </div>
        )}
        
        {/* نمایش مدیر تسک برای مدیر تسک (غیرقابل ویرایش) */}
        {!isSuperAdmin && isTaskManager && formData.manager && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مدیر تسک
            </label>
            <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
              {users.find((u) => u.id === parseInt(formData.manager))?.username || 'نامشخص'}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              فقط مدیر تیم می‌تواند مدیر تسک را تغییر دهد.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="assigned_members_ids" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اعضای تسک
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-3 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {users.map((user) => {
                const isSelected = formData.assigned_members_ids.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className="flex items-center space-x-reverse space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // اضافه کردن کاربر
                          setFormData((prev) => ({
                            ...prev,
                            assigned_members_ids: [...prev.assigned_members_ids, user.id],
                            member_assignments: [
                              ...prev.member_assignments,
                              { user_id: user.id, assignment: '' }
                            ]
                          }));
                        } else {
                          // حذف کاربر
                          setFormData((prev) => ({
                            ...prev,
                            assigned_members_ids: prev.assigned_members_ids.filter(id => id !== user.id),
                            member_assignments: prev.member_assignments.filter(ma => ma.user_id !== user.id)
                          }));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-white flex-1">
                {user.username}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            با کلیک روی هر کاربر می‌توانید آن را به اعضای تسک اضافه یا حذف کنید.
          </p>
        </div>

        {/* وظایف هر عضو */}
        {formData.member_assignments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              وظایف اعضای تسک
            </label>
            <div className="space-y-4">
              {formData.member_assignments.map((ma) => {
                const user = users.find((u) => u.id === ma.user_id);
                if (!user) return null;
                return (
                  <div key={ma.user_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      وظیفه {user.username}:
                    </label>
                    <textarea
                      rows={2}
                      value={ma.assignment}
                      onChange={(e) => handleAssignmentChange(ma.user_id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="وظیفه این کاربر در این تسک را مشخص کنید..."
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-reverse space-x-3">
          <button
            type="submit"
            disabled={formSubmitting}
            className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                <span>ذخیره تغییرات</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tasks/${id}`)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
          >
            لغو
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;

