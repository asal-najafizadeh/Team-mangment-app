import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { tasksApi } from '../api/tasksApi';

const navigation = [
  { name: 'داشبورد', href: '/dashboard', icon: HomeIcon },
  { name: 'تسک‌ها', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'ارسال گزارش', href: '/reports/send', icon: DocumentTextIcon },
  { name: 'حضور و غیاب', href: '/attendance', icon: ClockIcon },
  { name: 'تقویم', href: '/calendar', icon: CalendarIcon },
  { name: 'اخطارها', href: '/warnings', icon: ExclamationTriangleIcon },
];

const adminNavigation = [
  {
    name: 'مدیریت تقویم',
    href: '/calendar/admin',
    icon: CalendarIcon,
  },
  {
    name: 'مدیریت کاربران',
    href: '/users',
    icon: Cog6ToothIcon,
  },
];

const Sidebar = ({ isOpen, onClose, isStaff = false, isAdmin = false }) => {
  const [managedTasks, setManagedTasks] = useState([]);
  const [loadingManagedTasks, setLoadingManagedTasks] = useState(true);

  useEffect(() => {
    const fetchManagedTasks = async () => {
      setLoadingManagedTasks(true);
      try {
        const res = await tasksApi.getManagedTasks();
        setManagedTasks(res.data || []);
      } catch (error) {
        // در صورت خطا، فقط در کنسول لاگ می‌کنیم و UI را خراب نمی‌کنیم
        console.error('Failed to load managed tasks for sidebar:', error);
        setManagedTasks([]);
      } finally {
        setLoadingManagedTasks(false);
      }
    };

    fetchManagedTasks();
  }, []);

  return (
    <>
      {/* Mobile overlay + drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`
          fixed inset-y-0 right-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              مدیریت تیم
            </h1>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 ml-3" />
                  {item.name}
                </NavLink>
              );
            })}

            {/* منوی مخصوص مدیران تسک‌ها */}
            {managedTasks.length > 0 && (
              <>
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    تسک‌هایی که مدیر آن هستید
                  </p>
                </div>
                {managedTasks.map((task) => (
                  <NavLink
                    key={task.id}
                    to={`/task-manager/${task.id}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <ClipboardDocumentListIcon className="w-5 h-5 ml-3" />
                    مدیر تسک {task.title}
                  </NavLink>
                ))}
              </>
            )}

            {/* منوی مدیریت - فقط برای ادمین */}
            {isAdmin && (
              <>
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    مدیریت
                  </p>
                </div>
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 ml-3" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:border-l lg:border-gray-200 dark:lg:border-gray-700 lg:bg-white dark:lg:bg-gray-800">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">مدیریت تیم</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="w-5 h-5 ml-3" />
                {item.name}
              </NavLink>
            );
          })}

          {managedTasks.length > 0 && (
            <>
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  تسک‌هایی که مدیر آن هستید
                </p>
              </div>
              {managedTasks.map((task) => (
                <NavLink
                  key={task.id}
                  to={`/task-manager/${task.id}`}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 ml-3" />
                  مدیر تسک {task.title}
                </NavLink>
              ))}
            </>
          )}

          {isAdmin && (
            <>
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  مدیریت
                </p>
              </div>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 ml-3" />
                    {item.name}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;

