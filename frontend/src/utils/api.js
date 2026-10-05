/**
 * API Utility — Axios instance with interceptors
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor: unwrap data or throw structured error
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
      
    if (message.includes('status code 500') || message.includes('Network Error')) {
      message = 'Cannot connect to server. Please ensure the backend is running.';
    }
    
    return Promise.reject({ message, data: error.response?.data });
  }
);

// ─── Auth API ─────────────────────────────────────────────────
export const registerUser = (username, deviceId) =>
  api.post('/auth/register', { username, deviceId });

export const validateUser = (username, deviceId) =>
  api.post('/auth/validate', { username, deviceId });

// ─── Payment API ──────────────────────────────────────────────
export const initiatePayment = (payload) =>
  api.post('/payment/initiate', payload);

export const completeQRScan = (transactionId) =>
  api.put('/payment/qr-scan', { transactionId });

export const completeBiometric = (transactionId) =>
  api.put('/payment/biometric', { transactionId });

export const getTransaction = (transactionId) =>
  api.get(`/payment/transaction/${transactionId}`);

export const getUserHistory = (userId) =>
  api.get(`/payment/history/${userId}`);

// ─── OTP API ──────────────────────────────────────────────────
export const generateOTP = (transactionId, userId) =>
  api.post('/otp/generate', { transactionId, userId });

export const verifyOTP = (transactionId, otp, userId) =>
  api.post('/otp/verify', { transactionId, otp, userId });

// ─── Admin API ──────────────────────────────────────────────────
export const getAdminStats = () =>
  api.get('/admin/stats');

export const getAdminUsers = () =>
  api.get('/admin/users');

export const getAdminTransactions = () =>
  api.get('/admin/transactions');

export const getAdminLogs = () =>
  api.get('/admin/logs');

export default api;
