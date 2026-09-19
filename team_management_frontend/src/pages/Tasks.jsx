import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasksApi';
import { authApi } from '../api/authApi';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

const Tasks = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [canCreateTask, setCanCreateTask] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // بررسی نقش کاربر برای نمایش دکمه "تسک جدید" و کارت حضور و غیاب
    authApi
      .getCurrentUser()
      .then((res) => {
        const role = res.data.role;
        const isSuper = res.data.is_superuser;
        const userId = res.data.id;
        setCurrentUserId(userId);
        
        // مدیر = ADMIN یا SUPERVISOR یا سوپر یوزر
        if (isSuper || role === 1 || role === 2) {
          setCanCreateTask(true);
        }
        // فقط سوپر ادمین کارت حضور و غیاب را می‌بیند
        setIsSuperAdmin(isSuper || role === 1);
        // مدیر تیم = ADMIN یا SUPERVISOR یا سوپر یوزر
        setIsManager(isSuper || role === 1 || role === 2);
      })
      .catch(() => {
        setCanCreateTask(false);
        setIsSuperAdmin(false);
      });

    if (currentUserId !== null) {
      fetchTasks();
    }
  }, [filter, isManager, currentUserId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // برای مدیر تیم یا مدیر تسک، فیلتر و جستجو اعمال نمی‌شود
      const params = {};
      if (!isManager && filter !== 'all') {
        params.status = filter;
      }
      
      const response = await tasksApi.getMyTasks(params);
      const fetchedTasks = response.data.results || response.data || [];
      setTasks(fetchedTasks);
      
      // چک کردن که آیا کاربر مدیر حداقل یک تسک است
      if (!isManager && currentUserId) {
        const isTaskManager = fetchedTasks.some((task) => task.manager?.id === currentUserId);
        if (isTaskManager) {
          setIsManager(true); // برای نمایش بدون فیلتر و جستجو
        }
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      todo: {
        label: 'در انتظار',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
      doing: {
        label: 'در حال انجام',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
      done: {
        label: 'انجام شده',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
    };

    const config = statusConfig[status] || statusConfig.todo;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'بدون مهلت';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return (
        <span className="text-red-600 dark:text-red-400">
          تأخیر ({Math.abs(diffDays)} روز گذشته)
        </span>
      );
    } else if (diffDays === 0) {
      return <span className="text-orange-600 dark:text-orange-400">امروز</span>;
    } else if (diffDays === 1) {
      return <span className="text-orange-600 dark:text-orange-400">فردا</span>;
    } else {
      return date.toLocaleDateString('fa-IR');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.assigned_to?.username?.toLowerCase().includes(query)
    );
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تسک‌ها</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            مدیریت و پیگیری تسک‌های خود
          </p>
        </div>
        {canCreateTask && (
          <button
            onClick={() => navigate('/tasks/new')}
            className="flex items-center space-x-reverse space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>تسک جدید</span>
          </button>
        )}
      </div>

      {/* فیلتر و جستجو فقط برای کاربران عادی - برای مدیر تیم نمایش داده نمی‌شود */}
      {!isManager && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-reverse space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت:</span>
              <div className="flex space-x-reverse space-x-2">
                {[
                  { value: 'all', label: 'همه' },
                  { value: 'todo', label: 'در انتظار' },
                  { value: 'doing', label: 'در حال انجام' },
                  { value: 'done', label: 'انجام شده' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setFilter(status.value)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      filter === status.value
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجوی تسک‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            تسکی یافت نشد
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'لطفاً عبارت جستجوی خود را تغییر دهید'
              : filter !== 'all'
              ? `تسکی با وضعیت "${filter === 'todo' ? 'در انتظار' : filter === 'doing' ? 'در حال انجام' : 'انجام شده'}" وجود ندارد`
              : 'شروع کنید با ایجاد یک تسک جدید'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(isManager ? tasks : filteredTasks).map((task) => {
            // برای مدیر تیم: همیشه به صفحه جزئیات تسک (حتی برای تسک حضور و غیاب)
            // برای کاربر عادی: اگر تسک حضور و غیاب است، به صفحه حضور و غیاب، وگرنه به صفحه جزئیات تسک
            const handleTaskClick = () => {
              // مدیر تیم همیشه به صفحه جزئیات تسک می‌رود (حتی برای تسک حضور و غیاب)
              if (isManager) {
                navigate(`/tasks/${task.id}`);
                return;
              }
              
              // کاربر عادی: اگر تسک حضور و غیاب است، به صفحه حضور و غیاب
              if (task.is_attendance_task) {
                navigate('/attendance');
                return;
              }
              
              // کاربر عادی: برای سایر تسک‌ها به صفحه جزئیات تسک
                navigate(`/tasks/${task.id}`);
            };

            // استایل مخصوص برای تسک حضور و غیاب
            const isAttendanceTask = task.is_attendance_task;
            const cardClassName = isAttendanceTask
              ? "bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-lg shadow-lg border-2 border-indigo-400 dark:border-indigo-500 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all text-white"
              : "bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all";

            // بررسی اینکه آیا کاربر مدیر این تسک است
            const isTaskManager = currentUserId && task.manager?.id === currentUserId;
            
            return (
            <div
              key={task.id}
              className={cardClassName}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 
                  onClick={handleTaskClick}
                  className={`text-lg font-semibold flex-1 line-clamp-2 cursor-pointer ${isAttendanceTask ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                >
                  {task.title}
                  {isAttendanceTask && (
                    <span className="mr-2 px-2 py-1 text-xs font-semibold rounded-full bg-white/20 text-white">
                      حضور و غیاب
                    </span>
                  )}
                </h3>
                <div className="flex items-center space-x-reverse space-x-2">
                  {isTaskManager && !isAttendanceTask && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/edit/${task.id}`);
                      }}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                      title="ویرایش تسک"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  {!isManager && !isAttendanceTask && <div className="mr-2">{getStatusBadge(task.status)}</div>}
                  {isManager && !task.is_active && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      isAttendanceTask 
                        ? 'bg-white/20 text-white' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      غیرفعال
                    </span>
                  )}
                </div>
              </div>

              {task.description && (
                <p 
                  onClick={handleTaskClick}
                  className={`text-sm mb-4 line-clamp-3 cursor-pointer ${isAttendanceTask ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {task.description}
                </p>
              )}

              <div 
                onClick={handleTaskClick}
                className="space-y-2 text-sm cursor-pointer"
              >
                {isManager && task.manager && (
                  <div className={`flex items-center ${isAttendanceTask ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className="font-medium ml-2">مدیر تسک:</span>
                    <span>{task.manager.username}</span>
                  </div>
                )}
                
                {task.assigned_to && (
                  <div className={`flex items-center ${isAttendanceTask ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className="font-medium ml-2">واگذار شده به:</span>
                    <span>{task.assigned_to.username}</span>
                  </div>
                )}

                {isManager && task.assigned_members && task.assigned_members.length > 0 && (
                  <div className={`flex items-center ${isAttendanceTask ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className="font-medium ml-2">اعضای تسک:</span>
                    <span>{task.assigned_members.map(m => m.username).join(', ')}</span>
                  </div>
                )}

                {isManager && task.created_at && (
                  <div className={`flex items-center ${isAttendanceTask ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className="font-medium ml-2">تاریخ ایجاد:</span>
                    <span>{new Date(task.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                )}

                {!isManager && (
                  <>
                    <div className={`flex items-center ${isAttendanceTask ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                      <span className="font-medium ml-2">مهلت:</span>
                      {formatDate(task.deadline)}
                    </div>

                    {task.created_at && (
                      <div className={`flex items-center text-xs ${isAttendanceTask ? 'text-white/70' : 'text-gray-500 dark:text-gray-500'}`}>
                        ایجاد شده: {new Date(task.created_at).toLocaleDateString('fa-IR')}
                      </div>
                    )}
                  </>
                )}

                {isAttendanceTask && (
                  <div className="flex items-center text-white/80 text-xs mt-4">
                    <span>کلیک برای مشاهده جزئیات →</span>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
