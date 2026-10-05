/**
 * RegisterPage — User registration with username + device ID
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, validateUser } from '../utils/api';
import Brand from '../components/Brand';
import StepIndicator from '../components/StepIndicator';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', deviceId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  // Auto-generate a device ID from browser fingerprint simulation
  const generateDeviceId = () => {
    const nav = navigator;
    const raw = `${nav.userAgent}-${window.screen.width}x${window.screen.height}-${nav.language}-${nav.hardwareConcurrency}`;
    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const id = `DEV-${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
    setForm(prev => ({ ...prev, deviceId: id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.username.trim() || !form.deviceId.trim()) {
      setError('Both fields are required.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        res = await registerUser(form.username, form.deviceId);
        setSuccess('Registration successful! You can now proceed.');
        // Store user data in sessionStorage for the session
        sessionStorage.setItem('upi_user', JSON.stringify(res.user));
        setTimeout(() => navigate('/home'), 1200);
      } else {
        res = await validateUser(form.username, form.deviceId);
        sessionStorage.setItem('upi_user', JSON.stringify(res.user));
        navigate('/home');
      }
    } catch (err) {
      if (err.data?.accountLocked) {
        setError('🔒 Account locked. Contact support.');
      } else if (err.data?.deviceMismatch) {
        setError('⚠️ Device mismatch. This account is bound to a different device.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Brand />
      <StepIndicator currentStep={0} />

      <div className="card register-card">
        <div className="register-header">
          <h1 className="page-title">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="page-subtitle">
            {mode === 'register'
              ? 'Register to use UPI SecurePay with MFA protection'
              : 'Sign in to your secure UPI account'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            Sign In
          </button>
          <button
            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="e.g. john_doe"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Device ID */}
          <div className="form-group">
            <label className="form-label">
              Device ID
              <span className="form-label-hint">(bound to your device)</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon">📱</span>
              <input
                type="text"
                name="deviceId"
                className="form-input"
                placeholder="e.g. DEV-AB12CD34"
                value={form.deviceId}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <button
              type="button"
              className="autofill-btn"
              onClick={generateDeviceId}
            >
              ✨ Auto-detect my device
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <span>✅</span> {success}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                {mode === 'register' ? 'Registering...' : 'Signing in...'}
              </>
            ) : (
              mode === 'register' ? 'Create Account →' : 'Sign In →'
            )}
          </button>
        </form>

        {/* Security badges */}
        <div className="security-badges">
          <span className="badge badge-blue">🔐 MFA Enabled</span>
          <span className="badge badge-blue">📱 Device Bound</span>
          <span className="badge badge-blue">🔒 Encrypted</span>
        </div>
      </div>

      <p className="footer-note">
        This is a secure simulation for educational purposes
      </p>
    </div>
  );
};

export default RegisterPage;
