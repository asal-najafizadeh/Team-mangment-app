import axiosClient from './axiosClient';

/**
 * Calendar Events API endpoints
 */
export const calendarApi = {
  /**
   * Get all calendar events (holidays)
   * GET /api/calendar/events/list/
   * @returns {Promise} Response with events list
   */
  getEvents: () => {
    return axiosClient.get('/calendar/events/list/');
  },

  /**
   * Create a new calendar event (holiday) - Admin only
   * POST /api/calendar/events/
   * @param {Object} eventData - { date: "YYYY-MM-DD", message: "..." }
   * @returns {Promise} Response with created event
   */
  createEvent: (eventData) => {
    return axiosClient.post('/calendar/events/', eventData);
  },

  /**
   * Delete an event (holiday) - Admin only
   * DELETE /api/calendar/events/<id>/
   * @param {number} eventId - Event ID
   * @returns {Promise} Response
   */
  deleteEvent: (eventId) => {
    return axiosClient.delete(`/calendar/events/${eventId}/`);
  },

  /**
   * User creates a leave request
   * POST /api/calendar/leaves/request/
   * @param {Object} leaveData - { date: "YYYY-MM-DD", reason: "..." }
   * @returns {Promise} Response with created leave request
   */
  requestLeave: (leaveData) => {
    return axiosClient.post('/calendar/leaves/request/', leaveData);
  },

  /**
   * User sees their own leave requests
   * GET /api/calendar/leaves/my/
   * @returns {Promise} Response with user's leave requests
   */
  getMyLeaves: () => {
    return axiosClient.get('/calendar/leaves/my/');
  },

  /**
   * Admin sees all leave requests
   * GET /api/calendar/leaves/all/
   * @returns {Promise} Response with all leave requests
   */
  getAllLeaves: () => {
    return axiosClient.get('/calendar/leaves/all/');
  },

  /**
   * Admin handles a leave request (approve/reject)
   * PATCH /api/calendar/leaves/<id>/handle/
   * @param {number} leaveId - Leave request ID
   * @param {Object} handleData - { status: "accepted" | "rejected", rejection_message?: "..." }
   * @returns {Promise} Response with updated leave request
   */
  handleLeave: (leaveId, handleData) => {
    return axiosClient.patch(`/calendar/leaves/${leaveId}/handle/`, handleData);
  },
};

export default calendarApi;

