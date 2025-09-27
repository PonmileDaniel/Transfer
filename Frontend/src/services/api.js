// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const paymentAPI = {
  // Create a new payment
  createPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      console.error('Create payment error:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  },

  // Get all payments
  getAllPayments: async (limit = 10, skip = 0) => {
    try {
      const response = await api.get(`/payments/all?limit=${limit}&skip=${skip}`);
      return response.data;
    } catch (error) {
      console.error('Get all payments error:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  },

  // Get payment by ID
  getPayment: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment error:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  },

  // Verify payment
  verifyPayment: async (reference) => {
    try {
      const response = await api.get(`/payments/verify/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  },

  // Get payments by email
  getPaymentsByEmail: async (email, limit = 10) => {
    try {
      const response = await api.get(`/payments/user/${encodeURIComponent(email)}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get payments by email error:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  },

  // Get payments by status
  getPaymentsByStatus: async (status, limit = 10) => {
    try {
      const response = await api.get(`/payments/status/${status}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get payments by status error:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  }
};

export default api;