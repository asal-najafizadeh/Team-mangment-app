import axiosClient from './axiosClient';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login with username/email and password
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise} Response with access and refresh tokens
   */
  login: (username, password) => {
    return axiosClient.post('/auth/login/', {
      username,
      password,
    });
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response with user data and tokens
   */
  register: (userData) => {
    return axiosClient.post('/auth/register/', userData);
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} Response with new access token
   */
  refreshToken: (refreshToken) => {
    return axiosClient.post('/auth/refresh/', {
      refresh: refreshToken,
    });
  },

  /**
   * Logout user (invalidate tokens)
   * @returns {Promise} Response
   */
  logout: () => {
    return axiosClient.post('/auth/logout/');
  },

  /**
   * Get current user profile
   * @returns {Promise} Response with user data
   */
  getCurrentUser: () => {
    return axiosClient.get('/auth/me/');
  },

  /**
   * Update current user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise} Response with updated user data
   */
  updateProfile: (userData) => {
    return axiosClient.patch('/auth/me/', userData);
  },

  /**
   * Change password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Response
   */
  changePassword: (oldPassword, newPassword) => {
    return axiosClient.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};

export default authApi;

