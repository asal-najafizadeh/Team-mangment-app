import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasksApi';
import { reportsApi } from '../api/reportsApi';
import { authApi } from '../api/authApi';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import PersianDatePicker from '../components/PersianDatePicker';

const SendReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userAssignment, setUserAssignment] = useState('');
  
  // Initialize formData with today's date safely
  const getTodayDate = () => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch (e) {
      return '2024-01-01'; // Fallback date
    }
  };
  
  const [formData, setFormData] = useState({
    task: '',
    note: '',
    report_date: getTodayDate(),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeValidation, setTimeValidation] = useState({ isValid: true, message: '' });


  useEffect(() => {
    fetchCurrentUser();
    fetchTasks();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setCurrentUserId(response.data.id);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  useEffect(() => {
    // Validate time window when task is selected
    if (formData.task) {
      validateTimeWindow();
    }
  }, [formData.task]);

  useEffect(() => {
    // Update user assignment when currentUserId becomes available and task is selected
    if (selectedTask && currentUserId && selectedTask.member_assignments) {
      const assignment = selectedTask.member_assignments.find(
        (ma) => ma.user && ma.user.id === currentUserId
      );
      setUserAssignment(assignment?.assignment || '');
    }
  }, [currentUserId, selectedTask]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await tasksApi.getMyTasks();
      const tasksList = response.data?.results || response.data || [];
      // فیلتر کردن: فقط تسک‌های فعال (غیر از تسک حضور و غیاب)
      const filteredTasks = Array.isArray(tasksList) 
        ? tasksList.filter(task => !task.is_attendance_task && task.is_active !== false)
        : [];
      setTasks(filteredTasks);
      
      // اگر لیست تسک‌ها خالی است، پیام مناسب نمایش بده
      if (filteredTasks.length === 0) {
        setError('هیچ تسکی برای ارسال گزارش یافت نشد. لطفاً ابتدا یک تسک ایجاد کنید.');
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      const errorMessage = 
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'بارگذاری تسک‌ها با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const validateTimeWindow = () => {
    if (!formData.task) {
      setTimeValidation({ isValid: true, message: '' });
      return;
    }

    // تسک حضور و غیاب از لیست حذف شده است، پس نیازی به چک کردن نیست

    // Check time window: 12:00 - 22:00
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    const startTime = 12 * 60; // 12:00 in minutes
    const endTime = 22 * 60; // 22:00 in minutes

    const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    
    if (currentTime < startTime) {
      setTimeValidation({
        isValid: false,
        message: `گزارش‌ها فقط بین ساعت ۱۲:۰۰ تا ۲۲:۰۰ قابل ارسال هستند. زمان فعلی: ${timeStr}`,
      });
    } else if (currentTime >= endTime) {
      setTimeValidation({
        isValid: false,
        message: `گزارش‌ها فقط بین ساعت ۱۲:۰۰ تا ۲۲:۰۰ قابل ارسال هستند. زمان فعلی: ${timeStr}`,
      });
    } else {
      setTimeValidation({
        isValid: true,
        message: `بازه زمانی معتبر است. زمان فعلی: ${timeStr}`,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');

    // Update selected task when task changes
    if (name === 'task') {
      const task = tasks.find((t) => t.id === parseInt(value));
      setSelectedTask(task);
      
      // Find user's assignment in this task
      if (task && currentUserId && task.member_assignments) {
        const assignment = task.member_assignments.find(
          (ma) => ma.user && ma.user.id === currentUserId
        );
        setUserAssignment(assignment?.assignment || '');
      } else {
        setUserAssignment('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.task) {
      setError('لطفاً یک تسک انتخاب کنید');
      return;
    }

    // Validate time window
    if (!timeValidation.isValid) {
      setError(timeValidation.message);
      return;
    }

    setSubmitting(true);
    try {
      const reportData = {
        task: parseInt(formData.task),
        report_date: formData.report_date,
        status_sent: 1, // Default: کامل و گزارش داده
        note: formData.note || '',
      };

      await reportsApi.createReport(reportData);
      
      setSuccess('گزارش با موفقیت ارسال شد!');
      
      // Reset form
      setFormData({
        task: '',
        note: '',
        report_date: new Date().toISOString().split('T')[0],
      });
      setSelectedTask(null);
      setUserAssignment('');
      setTimeValidation({ isValid: true, message: '' });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/reports');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'ارسال گزارش با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری تسک‌ها...</p>
        </div>
      </div>
    );
  }

  // اگر خطا وجود دارد و تسک‌ای نیست، صفحه را نمایش بده اما با پیام خطا
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ارسال گزارش روزانه</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          گزارش روزانه کار خود را برای یک تسک ارسال کنید
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
              <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
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
          </div>
        </div>
      )}

      {/* Time Validation Message */}
      {formData.task && timeValidation.message && (
        <div
          className={`rounded-md p-4 border ${
            timeValidation.isValid
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <ClockIcon
                className={`h-5 w-5 ${
                  timeValidation.isValid
                    ? 'text-blue-400'
                    : 'text-yellow-400'
                }`}
              />
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  timeValidation.isValid
                    ? 'text-blue-800 dark:text-blue-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {timeValidation.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Task Selection */}
        <div>
          <label htmlFor="task" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تسک <span className="text-red-500">*</span>
          </label>
          <select
            id="task"
            name="task"
            value={formData.task}
            onChange={handleChange}
            required
            disabled={tasks.length === 0}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{tasks.length === 0 ? 'هیچ تسکی یافت نشد' : 'انتخاب تسک'}</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          {selectedTask && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {selectedTask.description && (
                <span className="block mb-1">{selectedTask.description}</span>
              )}
            </p>
          )}
        </div>

        {/* User Assignment Display (Read-only) */}
        {selectedTask && userAssignment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              وظیفه شما در این تسک
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-300 cursor-not-allowed">
              {userAssignment}
            </div>
          </div>
        )}

        {/* Report Date */}
        <div>
          <label htmlFor="report_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تاریخ گزارش <span className="text-red-500">*</span>
          </label>
          <PersianDatePicker
            value={formData.report_date}
            onChange={handleChange}
            placeholder="انتخاب تاریخ شمسی"
          />
          {formData.report_date && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              تاریخ میلادی: <span className="font-medium">{formData.report_date}</span>
            </p>
          )}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            یادداشت (اختیاری)
          </label>
          <textarea
            id="note"
            name="note"
            rows={4}
            value={formData.note}
            onChange={handleChange}
            placeholder="یادداشت‌های اضافی درباره گزارش خود را اینجا وارد کنید..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting || !timeValidation.isValid}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                در حال ارسال...
              </>
            ) : (
              <>
                <DocumentTextIcon className="w-5 h-5 ml-2" />
                ارسال گزارش
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
          >
            لغو
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendReport;

