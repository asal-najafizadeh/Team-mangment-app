import axiosClient from './axiosClient';

/**
 * Attendance API endpoints
 */
export const attendanceApi = {
  /**
   * Get all attendance records
   * @param {Object} params - Query parameters (page, page_size, date_from, date_to, user_id, etc.)
   * @returns {Promise} Response with attendance list
   */
  getAttendance: (params = {}) => {
    return axiosClient.get('/attendance/', { params });
  },

  /**
   * Get a single attendance record by ID
   * @param {number} attendanceId - Attendance ID
   * @returns {Promise} Response with attendance data
   */
  getAttendanceRecord: (attendanceId) => {
    return axiosClient.get(`/attendance/${attendanceId}/`);
  },

  /**
   * Check in (start attendance)
   * @param {Object} checkInData - Optional check-in data (task_id, etc.)
   * @returns {Promise} Response with attendance record
   */
  checkIn: (checkInData = {}) => {
    return axiosClient.post('/attendance/check_in/', checkInData);
  },

  /**
   * Check out (end attendance)
   * @param {Object} checkOutData - Optional check-out data (notes, etc.)
   * @returns {Promise} Response with updated attendance record
   */
  checkOut: (checkOutData = {}) => {
    return axiosClient.post('/attendance/check_out/', checkOutData);
  },

  /**
   * Get current user's attendance records
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with user's attendance records
   */
  getMyAttendance: (params = {}) => {
    return axiosClient.get('/attendance/my-attendance/', { params });
  },

  /**
   * Get attendance for a specific user
   * @param {number} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with user's attendance records
   */
  getUserAttendance: (userId, params = {}) => {
    return axiosClient.get(`/attendance/user/${userId}/`, { params });
  },

  /**
   * Get attendance statistics
   * @param {Object} params - Query parameters (date_from, date_to, user_id, etc.)
   * @returns {Promise} Response with attendance statistics
   */
  getAttendanceStats: (params = {}) => {
    return axiosClient.get('/attendance/stats/', { params });
  },

  /**
   * Get today's attendance for current user
   * @returns {Promise} Response with today's attendance record
   */
  getTodayAttendance: () => {
    return axiosClient.get('/attendance/today/');
  },

  /**
   * Update an attendance record (admin only)
   * @param {number} attendanceId - Attendance ID
   * @param {Object} attendanceData - Updated attendance data
   * @returns {Promise} Response with updated attendance record
   */
  updateAttendance: (attendanceId, attendanceData) => {
    return axiosClient.patch(`/attendance/${attendanceId}/`, attendanceData);
  },

  /**
   * Get weekly attendance reports (for supervisors/admins)
   * @param {Object} params - Query parameters (week_start)
   * @returns {Promise} Response with weekly reports
   */
  getWeeklyReports: (params = {}) => {
    return axiosClient.get('/attendance/weekly-reports/', { params });
  },

  /**
   * Generate weekly attendance report for current user
   * @returns {Promise} Response with generated report
   */
  generateWeeklyReport: () => {
    return axiosClient.post('/attendance/generate-weekly-report/');
  },

  /**
   * Approve or reject weekly attendance report
   * @param {number} reportId - Report ID
   * @param {string} action - "approve" or "reject"
   * @param {string} note - Optional note
   * @returns {Promise} Response with updated report
   */
  approveWeeklyReport: (reportId, action, note = '') => {
    return axiosClient.post(`/attendance/${reportId}/approve-weekly/`, {
      action,
      note,
    });
  },
};

export default attendanceApi;

