import axiosClient from './axiosClient';

/**
 * Reports API endpoints
 */
export const reportsApi = {
  /**
   * Get all reports
   * @param {Object} params - Query parameters (page, page_size, date_from, date_to, etc.)
   * @returns {Promise} Response with reports list
   */
  getReports: (params = {}) => {
    return axiosClient.get('/reports/', { params });
  },

  /**
   * Get a single report by ID
   * @param {number} reportId - Report ID
   * @returns {Promise} Response with report data
   */
  getReport: (reportId) => {
    return axiosClient.get(`/reports/${reportId}/`);
  },

  /**
   * Create a new report
   * @param {Object} reportData - Report data
   * @returns {Promise} Response with created report
   */
  createReport: (reportData) => {
    return axiosClient.post('/reports/', reportData);
  },

  /**
   * Update an existing report
   * @param {number} reportId - Report ID
   * @param {Object} reportData - Updated report data
   * @returns {Promise} Response with updated report
   */
  updateReport: (reportId, reportData) => {
    return axiosClient.patch(`/reports/${reportId}/`, reportData);
  },

  /**
   * Delete a report
   * @param {number} reportId - Report ID
   * @returns {Promise} Response
   */
  deleteReport: (reportId) => {
    return axiosClient.delete(`/reports/${reportId}/`);
  },

  /**
   * Get reports for a specific user
   * @param {number} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with user's reports
   */
  getUserReports: (userId, params = {}) => {
    return axiosClient.get(`/reports/user/${userId}/`, { params });
  },

  /**
   * Get daily reports
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Response with daily reports
   */
  getDailyReports: (date) => {
    return axiosClient.get('/reports/daily/', { params: { date } });
  },

  /**
   * Get weekly reports
   * @param {string} weekStart - Week start date in YYYY-MM-DD format
   * @returns {Promise} Response with weekly reports
   */
  getWeeklyReports: (weekStart) => {
    return axiosClient.get('/reports/weekly/', { params: { week_start: weekStart } });
  },

  /**
   * Verify a report (approve or reject)
   * @param {number} reportId - Report ID
   * @param {number} statusVerified - Verification status (1=approve, 2/3/4=reject reasons)
   * @returns {Promise} Response
   */
  verifyReport: (reportId, statusVerified) => {
    return axiosClient.post(`/reports/${reportId}/verify/`, {
      status_verified: statusVerified,
    });
  },
};

export default reportsApi;

