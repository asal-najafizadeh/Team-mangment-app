import axiosClient from './axiosClient';

/**
 * Tasks API endpoints
 */
export const tasksApi = {
  /**
   * Get all tasks
   * @param {Object} params - Query parameters (page, page_size, status, etc.)
   * @returns {Promise} Response with tasks list
   */
  getTasks: (params = {}) => {
    return axiosClient.get('/tasks/', { params });
  },

  /**
   * Get a single task by ID
   * @param {number} taskId - Task ID
   * @returns {Promise} Response with task data
   */
  getTask: (taskId) => {
    return axiosClient.get(`/tasks/${taskId}/`);
  },

  /**
   * Get tasks where current user is the manager
   * @returns {Promise}
   */
  getManagedTasks: () => {
    return axiosClient.get('/tasks/managed_by_me/');
  },

  /**
   * Get manager panel data for a task (members + warnings)
   * @param {number} taskId
   * @returns {Promise}
   */
  getTaskManagerPanel: (taskId) => {
    return axiosClient.get(`/tasks/${taskId}/manager_panel/`);
  },

  /**
   * Get warning history for a member in a specific task
   * @param {number} taskId
   * @param {number} userId
   * @returns {Promise}
   */
  getTaskMemberWarnings: (taskId, userId) => {
    return axiosClient.get(`/tasks/${taskId}/member_warnings/`, {
      params: { user_id: userId },
    });
  },

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise} Response with created task
   */
  createTask: (taskData) => {
    return axiosClient.post('/tasks/', taskData);
  },

  /**
   * Update an existing task
   * @param {number} taskId - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise} Response with updated task
   */
  updateTask: (taskId, taskData) => {
    return axiosClient.patch(`/tasks/${taskId}/`, taskData);
  },

  /**
   * Delete a task
   * @param {number} taskId - Task ID
   * @returns {Promise} Response
   */
  deleteTask: (taskId) => {
    return axiosClient.delete(`/tasks/${taskId}/`);
  },

  /**
   * Mark task as complete
   * @param {number} taskId - Task ID
   * @returns {Promise} Response with updated task
   */
  completeTask: (taskId) => {
    return axiosClient.patch(`/tasks/${taskId}/complete/`);
  },

  /**
   * Get tasks assigned to current user
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with user's tasks
   */
  getMyTasks: (params = {}) => {
    // Backend already filters tasks by current user in TaskViewSet.get_queryset
    // so we can just call /tasks/ with optional filters.
    return axiosClient.get('/tasks/', { params });
  },

  /**
   * Deactivate a task
   * @param {number} taskId - Task ID
   * @returns {Promise} Response with updated task
   */
  deactivateTask: (taskId) => {
    return axiosClient.post(`/tasks/${taskId}/deactivate/`);
  },

  /**
   * Activate a task
   * @param {number} taskId - Task ID
   * @returns {Promise} Response with updated task
   */
  activateTask: (taskId) => {
    return axiosClient.post(`/tasks/${taskId}/activate/`);
  },

  /**
   * Get today's reports for a task
   * @param {number} taskId - Task ID
   * @returns {Promise} Response with today's reports
   */
  getTodayReports: (taskId) => {
    return axiosClient.get(`/tasks/${taskId}/today_reports/`);
  },

  /**
   * Send daily report to Telegram
   * @param {number} taskId - Task ID
   * @returns {Promise} Response with success message
   */
  sendDailyReportToTelegram: (taskId) => {
    return axiosClient.post(`/tasks/${taskId}/send_daily_report_to_telegram/`);
  },
};

export default tasksApi;

