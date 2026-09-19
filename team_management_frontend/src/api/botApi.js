import axiosClient from './axiosClient';

/**
 * Bot API endpoints
 */
export const botApi = {
  /**
   * Get bot configuration
   * @returns {Promise} Response with bot configuration
   */
  getBotConfig: () => {
    return axiosClient.get('/bot/config/');
  },

  /**
   * Update bot configuration
   * @param {Object} configData - Bot configuration data
   * @returns {Promise} Response with updated configuration
   */
  updateBotConfig: (configData) => {
    return axiosClient.patch('/bot/config/', configData);
  },

  /**
   * Send a test message via bot
   * @param {Object} messageData - Message data (chat_id, message, etc.)
   * @returns {Promise} Response
   */
  sendTestMessage: (messageData) => {
    return axiosClient.post('/bot/send-message/', messageData);
  },

  /**
   * Get bot status
   * @returns {Promise} Response with bot status information
   */
  getBotStatus: () => {
    return axiosClient.get('/bot/status/');
  },

  /**
   * Start bot service
   * @returns {Promise} Response
   */
  startBot: () => {
    return axiosClient.post('/bot/start/');
  },

  /**
   * Stop bot service
   * @returns {Promise} Response
   */
  stopBot: () => {
    return axiosClient.post('/bot/stop/');
  },

  /**
   * Get bot logs
   * @param {Object} params - Query parameters (page, page_size, level, etc.)
   * @returns {Promise} Response with bot logs
   */
  getBotLogs: (params = {}) => {
    return axiosClient.get('/bot/logs/', { params });
  },

  /**
   * Get bot statistics
   * @param {Object} params - Query parameters (date_from, date_to, etc.)
   * @returns {Promise} Response with bot statistics
   */
  getBotStats: (params = {}) => {
    return axiosClient.get('/bot/stats/', { params });
  },
};

export default botApi;

