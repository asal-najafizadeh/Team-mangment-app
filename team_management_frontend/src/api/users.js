import axiosClient from './axiosClient';

export const usersApi = {
  getUsersWithStats: () => axiosClient.get('/users/with_stats/'),

  getUser: (id) => axiosClient.get(`/users/${id}/`),

  updateUser: (id, data) => axiosClient.patch(`/users/${id}/`, data),

  deleteUser: (id) => axiosClient.delete(`/users/${id}/`),

  createUser: (data) => axiosClient.post('/users/create/', data),
  
  // دریافت لیست تسک‌ها برای انتخاب نقش مدیر تسک
  getTasksForRoleSelection: (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    return axiosClient.get('/users/tasks_for_role_selection/', { params });
  },
};

export default usersApi;


