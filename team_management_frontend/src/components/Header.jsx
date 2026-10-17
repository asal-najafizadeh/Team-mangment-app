import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../utils/tokenManager';
import { authApi } from '../api/authApi';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const Header = ({ onMenuClick, username, isStaff, role }) => {
  const navigate = useNavigate();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [userData, setUserData] = useState({
    username: username || 'کاربر',
    role: role ?? null,
  });

  const getRoleLabel = () => {
    const effectiveRole = userData.role;
    if (effectiveRole === 1) return 'مدیر سیستم';
    if (effectiveRole === 2) return 'مدیر تسک';
    if (effectiveRole === 3) return 'کاربر عادی';
    // اگر نقش مشخص نباشد، از isStaff برای حدس نقش استفاده می‌کنیم
    return isStaff ? 'مدیر تسک' : 'کاربر عادی';
  };

  useEffect(() => {
    // Fetch current user data if username not provided
    if (!username) {
      authApi
        .getCurrentUser()
        .then((response) => {
          setUserData({
            username: response.data.username || response.data.email || 'کاربر',
            role: response.data.role ?? null,
          });
        })
        .catch((error) => {
          console.error('Failed to fetch user data:', error);
        });
    }
  }, [username]);

  const handleLogout = async () => {
    try {
      // Call logout API
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear tokens and redirect to login
      clearTokens();
      navigate('/login');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Right side - Logo and Menu button */}
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="flex items-center space-x-reverse space-x-2">
            <img 
              src="/logo.png" 
              alt="Team Management" 
              className="h-10 w-10 object-contain"
            />
            <span className="hidden sm:inline text-lg font-bold text-gray-900 dark:text-white">
              Team Management
            </span>
          </div>
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>

        {/* Left side - User info and actions */}
        <div className="flex items-center space-x-reverse space-x-4">
          {/* Username + Role */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
            <UserCircleIcon className="w-5 h-5" />
            <span className="font-medium">
              {userData.username || 'کاربر'} ({getRoleLabel()})
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

