import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout user
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone: string, code: string, name?: string, nationalId?: string) =>
    api.post('/auth/verify-otp', { phone, code, name, nationalId }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { name?: string; email?: string; nationalId?: string }) =>
    api.put('/users/profile', data),
  uploadAvatar: (formData: FormData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSettings: () => api.get('/users/settings'),
  updateSettings: (data: any) => api.put('/users/settings', data),
  // Admin endpoints
  getAllUsers: (params?: any) => api.get('/users/admin/all', { params }),
  getUser: (userId: string) => api.get(`/users/admin/${userId}`),
  updateUser: (userId: string, data: any) => api.put(`/users/admin/${userId}`, data),
  updateUserRole: (userId: string, role: string) => api.put(`/users/admin/${userId}/role`, { role }),
  blockUser: (userId: string) => api.put(`/users/admin/${userId}/block`),
  unblockUser: (userId: string) => api.put(`/users/admin/${userId}/unblock`),
  deleteUser: (userId: string) => api.delete(`/users/admin/${userId}`),
};

// Vehicle API
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getOne: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  uploadImage: (id: string, formData: FormData) =>
    api.post(`/vehicles/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  setDefault: (id: string) => api.put(`/vehicles/${id}/default`),
};

// Order API
export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getMyOrders: (params?: any) => api.get('/orders/my', { params }),
  getCurrent: () => api.get('/orders/current'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string, reason?: string) => api.put(`/orders/${id}/cancel`, { reason }),
  // Technician
  getAssigned: (params?: any) => api.get('/orders/technician/assigned', { params }),
  technicianUpdate: (id: string, data: any) => api.put(`/orders/technician/${id}`, data),
  uploadPhoto: (orderId: string, formData: FormData) =>
    api.post(`/orders/technician/${orderId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePhoto: (orderId: string, photoId: string) =>
    api.delete(`/orders/technician/${orderId}/photo/${photoId}`),
  // Admin
  getAll: (params?: any) => api.get('/orders/admin/all', { params }),
  updateStatus: (id: string, status: string, adminNotes?: string) =>
    api.put(`/orders/${id}/status`, { status, adminNotes }),
  assignTechnician: (id: string, technicianId: string) =>
    api.put(`/orders/${id}/assign`, { technicianId }),
  updateTimeline: (orderId: string, stepId: string, data: any) =>
    api.put(`/orders/${orderId}/timeline/${stepId}`, data),
  updateCost: (id: string, data: any) => api.put(`/orders/${id}/cost`, data),
};

// Message API
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  createConversation: (participantId: string, orderId?: string, type?: string) =>
    api.post('/messages/conversations', { participantId, orderId, type }),
  getSupport: () => api.get('/messages/support'),
  getOrderConversation: (orderId: string) => api.get(`/messages/order/${orderId}`),
  startOrderChat: (orderId: string) => api.post(`/messages/order/${orderId}/start`),
  getMessages: (conversationId: string, params?: any) =>
    api.get(`/messages/${conversationId}`, { params }),
  sendMessage: (conversationId: string, text: string) =>
    api.post(`/messages/${conversationId}`, { text }),
  markAsRead: (conversationId: string) => api.put(`/messages/${conversationId}/read`),
  // Admin endpoints
  getAllConversations: (params?: any) => api.get('/messages/admin/conversations', { params }),
  deleteConversation: (conversationId: string) => api.delete(`/messages/admin/${conversationId}`),
  deleteMessage: (conversationId: string, messageId: string) =>
    api.delete(`/messages/admin/${conversationId}/messages/${messageId}`),
};

// Receipt API
export const receiptAPI = {
  getAll: (params?: any) => api.get('/receipts', { params }),
  getOne: (id: string) => api.get(`/receipts/${id}`),
  getByOrder: (orderId: string) => api.get(`/receipts/order/${orderId}`),
  initPayment: (id: string) => api.post(`/receipts/${id}/pay`),
  verifyPayment: (id: string, params: any) => api.get(`/receipts/${id}/verify`, { params }),
  // Admin
  create: (data: any) => api.post('/receipts', data),
  update: (id: string, data: any) => api.put(`/receipts/${id}`, data),
  markAsPaid: (id: string, data?: any) => api.put(`/receipts/${id}/paid`, data),
};

// Notification API
export const notificationAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getPublicStats: () => api.get('/admin/stats/public'),
  getTechnicians: (params?: any) => api.get('/admin/technicians', { params }),
  createTechnician: (data: any) => api.post('/admin/technicians', data),
  updateTechnician: (id: string, data: any) => api.put(`/admin/technicians/${id}`, data),
  deleteTechnician: (id: string) => api.delete(`/admin/technicians/${id}`),
  sendBroadcast: (data: any) => api.post('/admin/broadcast', data),
};

export default api;
