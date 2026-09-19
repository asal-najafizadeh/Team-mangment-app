import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { warningsApi } from '../../api/warnings';

const WarningsSettings = () => {
  const navigate = useNavigate();
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    penalty_incomplete_report: '1.00',
    penalty_fake_report: '1.50',
    penalty_no_report: '1.00',
    penalty_weekly_low_hours: '1.00',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authApi.getCurrentUser();
        const { is_superuser } = me.data;
        // فقط سوپر ادمین (مدیر تیم) می‌تواند تنظیمات را تغییر دهد
        setIsManager(is_superuser);
        if (!is_superuser) {
          navigate('/warnings', { replace: true });
          return;
        }

        setLoading(true);
        setError('');
        const res = await warningsApi.getSettings();
        const data = res.data || {};
        setFormData({
          penalty_incomplete_report: String(data.penalty_incomplete_report ?? '1.00'),
          penalty_fake_report: String(data.penalty_fake_report ?? '1.50'),
          penalty_no_report: String(data.penalty_no_report ?? '1.00'),
          penalty_weekly_low_hours: String(data.penalty_weekly_low_hours ?? '1.00'),
        });
      } catch (err) {
        console.error('Failed to load warning settings:', err);
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'بارگذاری تنظیمات اخطارها با خطا مواجه شد.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // فقط اعداد و اعشار مجاز
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // تبدیل به عدد و اعتبارسنجی ساده
    const payload = {};
    for (const [key, val] of Object.entries(formData)) {
      if (val === '') continue;
      const num = Number(val);
      if (Number.isNaN(num) || num < 0) {
        setError('مقادیر اخطار باید عددی و بزرگ‌تر یا مساوی صفر باشند.');
        return;
      }
      payload[key] = num.toFixed(2);
    }

    setSaving(true);
    try {
      const res = await warningsApi.updateSettings(payload);
      const data = res.data || {};
      setFormData({
        penalty_incomplete_report: String(data.penalty_incomplete_report ?? '1.00'),
        penalty_fake_report: String(data.penalty_fake_report ?? '1.50'),
        penalty_no_report: String(data.penalty_no_report ?? '1.00'),
        penalty_weekly_low_hours: String(data.penalty_weekly_low_hours ?? '1.00'),
      });
      setSuccess('تنظیمات با موفقیت ذخیره شد.');
    } catch (err) {
      console.error('Failed to save warning settings:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'ذخیره تنظیمات اخطارها با خطا مواجه شد.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تنظیمات اخطارها
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            در این بخش می‌توانید مقدار هر اخطار را (به صورت عدد اعشاری تا دو رقم اعشار) تنظیم کنید.
          </p>
        </div>
        <button
          onClick={() => navigate('/warnings')}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
        >
          بازگشت به لیست کاربران
        </button>
      </div>

      {!isManager ? (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            فقط مدیر تیم می‌تواند به تنظیمات اخطارها دسترسی داشته باشد.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6"
        >
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              در حال بارگذاری تنظیمات...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اخطار برای گزارش ناقص / وضعیت‌های غیر از کامل
                </label>
                <input
                  type="number"
                  name="penalty_incomplete_report"
                  min="0"
                  step="0.01"
                  value={formData.penalty_incomplete_report}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  مثلا 0.50 یا 1.00
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اخطار برای گزارش فیک
                </label>
                <input
                  type="number"
                  name="penalty_fake_report"
                  min="0"
                  step="0.01"
                  value={formData.penalty_fake_report}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اخطار برای «انجام داده ولی گزارش نداده»
                </label>
                <input
                  type="number"
                  name="penalty_no_report"
                  min="0"
                  step="0.01"
                  value={formData.penalty_no_report}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اخطار برای کمتر بودن ساعات هفتگی از حداقل
                </label>
                <input
                  type="number"
                  name="penalty_weekly_low_hours"
                  min="0"
                  step="0.01"
                  value={formData.penalty_weekly_low_hours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WarningsSettings;

