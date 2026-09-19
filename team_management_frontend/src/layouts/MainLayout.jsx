import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authApi } from '../api/authApi';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState({
    id: null,
    username: '',
    is_staff: false,
    role: null,
    is_superuser: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user data to check if user is staff
    authApi
      .getCurrentUser()
      .then((response) => {
        setUserData({
          id: response.data.id,
          username: response.data.username || response.data.email || 'کاربر',
          is_staff: response.data.is_staff || false,
          role: response.data.role ?? null,
          is_superuser: response.data.is_superuser || false,
        });
      })
      .catch((error) => {
        console.error('Failed to fetch user data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row-reverse">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isStaff={userData.is_staff}
        isAdmin={userData.is_superuser || userData.role === 1}
      />
      <div className="flex flex-col flex-1">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          username={userData.username}
          isStaff={userData.is_staff}
          role={userData.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative min-h-0">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

