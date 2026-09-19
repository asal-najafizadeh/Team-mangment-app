import axiosClient from './axiosClient';

export const warningsApi = {
  getUsersSummary: () => {
    return axiosClient.get('/warnings/users_summary/');
  },

  getUserWarnings: (userId) => {
    return axiosClient.get('/warnings/', {
      params: { user_id: userId },
    });
  },

  /**
   * Delete a warning completely with a reason
   * @param {number} warningId
   * @param {string} deleteReason
   */
  deleteWarning: (warningId, deleteReason = '') => {
    return axiosClient.delete(`/warnings/${warningId}/`, {
      data: { delete_reason: deleteReason },
    });
  },

  /**
   * Deduct (remove) part of a warning amount, with reason
   * @param {number} warningId
   * @param {{ amount: number, delete_reason?: string }} payload
   */
  deductWarning: (warningId, payload) => {
    return axiosClient.post(`/warnings/${warningId}/deduct/`, payload);
  },

  /**
   * Get complete warning history for a user (including deleted warnings)
   * @param {number} userId - User ID
   * @returns {Promise} Response with warning history
   */
  getUserWarningHistory: (userId) => {
    return axiosClient.get('/warnings/user_history/', {
      params: { user_id: userId },
    });
  },

  // تنظیمات اخطارها
  getSettings: () => {
    return axiosClient.get('/warnings/settings/');
  },

  updateSettings: (data) => {
    return axiosClient.patch('/warnings/settings/', data);
  },

  /**
   * Send warnings summary to Telegram
   * @returns {Promise} Response with success message
   */
  sendToTelegram: () => {
    return axiosClient.post('/warnings/send_to_telegram/');
  },

  /**
   * Approve a pending warning
   * @param {number} warningId
   */
  approveWarning: (warningId) => {
    return axiosClient.post(`/warnings/${warningId}/approve/`);
  },
};

export default warningsApi;


