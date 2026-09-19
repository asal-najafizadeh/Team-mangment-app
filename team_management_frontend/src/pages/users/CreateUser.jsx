import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import {
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const CreateUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.username.trim()) {
      setError('لطفاً نام کاربری را وارد کنید');
      return;
    }

    if (!formData.password) {
      setError('لطفاً پسورد را وارد کنید');
      return;
    }

    if (formData.password.length < 6) {
      setError('پسورد باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setSubmitting(true);
    try {
      await usersApi.createUser({
        username: formData.username.trim(),
        password: formData.password,
      });

      setSuccess('کاربر جدید با موفقیت ایجاد شد!');
      
      // Reset form
      setFormData({
        username: '',
        password: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'ایجاد کاربر با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">اضافه کردن کاربر جدید</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          کاربر جدید را با نام کاربری و پسورد ایجاد کنید
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            نام کاربری <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="نام کاربری را وارد کنید"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            پسورد <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="پسورد را وارد کنید (حداقل ۶ کاراکتر)"
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            پسورد باید حداقل ۶ کاراکتر باشد
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                در حال ایجاد...
              </>
            ) : (
              <>
                <UserPlusIcon className="w-5 h-5 ml-2" />
                ایجاد کاربر
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium transition-colors"
          >
            لغو
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;

