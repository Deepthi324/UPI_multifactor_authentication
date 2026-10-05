/**
 * App.js — Router and global layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import HistoryPage from './pages/HistoryPage';
import PaymentPage from './pages/PaymentPage';
import BottomNav from './components/BottomNav';
import QRScanPage from './pages/QRScanPage';
import BiometricPage from './pages/BiometricPage';
import OTPPage from './pages/OTPPage';
import SuccessPage from './pages/SuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/AdminDashboard'; // Import admin dashboard

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/home" element={<UserDashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/qr-scan" element={<QRScanPage />} />
          <Route path="/biometric" element={<BiometricPage />} />
          <Route path="/otp" element={<OTPPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
