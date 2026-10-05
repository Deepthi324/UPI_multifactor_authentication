/**
 * OTPPage — 6-digit OTP entry with retry limit and account lock
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateOTP, verifyOTP } from '../utils/api';
import Brand from '../components/Brand';
import StepIndicator from '../components/StepIndicator';
import './OTPPage.css';

const OTPPage = () => {
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [user, setUser] = useState(null);
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [accountLocked, setAccountLocked] = useState(false);
  const [timer, setTimer] = useState(300); // 5 min
  const inputsRef = useRef([]);
  const hasRequestedOTP = useRef(false);

  useEffect(() => {
    const storedTxn = sessionStorage.getItem('upi_txn');
    const storedUser = sessionStorage.getItem('upi_user');
    if (!storedTxn || !storedUser) { navigate('/'); return; }
    const txnData = JSON.parse(storedTxn);
    const userData = JSON.parse(storedUser);
    setTxn(txnData);
    setUser(userData);
    
    // Auto-generate OTP on mount (prevent double-call in dev)
    if (!hasRequestedOTP.current) {
      hasRequestedOTP.current = true;
      requestOTP(txnData.transactionId, userData.id);
    }
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0 || accountLocked) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer, accountLocked]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const requestOTP = async (transactionId, userId) => {
    setGenerating(true);
    setError('');
    setDigits(Array(6).fill(''));
    setTimer(300);
    try {
      const res = await generateOTP(transactionId, userId);
      // In simulation: show the OTP to the user (real app would send via SMS)
      if (res.simulatedOtp) {
        setSimulatedOtp(res.simulatedOtp);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // one char only
    setDigits(newDigits);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputsRef.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await verifyOTP(txn.transactionId, otp, user.id);
      // Store completed transaction info
      sessionStorage.setItem('upi_success', JSON.stringify(res.transaction));
      navigate('/success');
    } catch (err) {
      if (err.data?.accountLocked) {
        setAccountLocked(true);
        setError(err.message);
      } else {
        const remaining = err.data?.attemptsRemaining ?? (attemptsLeft - 1);
        setAttemptsLeft(remaining);
        setError(err.message || 'Incorrect OTP.');
        setDigits(Array(6).fill(''));
        inputsRef.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (txn && user) requestOTP(txn.transactionId, user.id);
  };

  if (!txn || !user) return null;

  return (
    <div className="page-container">
      <Brand />
      <StepIndicator currentStep={4} />

      <div className="card otp-card">
        <h1 className="page-title">OTP Verification</h1>
        <p className="page-subtitle">
          A 6-digit code has been sent to your registered mobile number
        </p>

        {/* Amount chip */}
        <div className="otp-amount-row">
          <span>Authorising payment of</span>
          <strong>₹{Number(txn.amount).toLocaleString('en-IN')}</strong>
        </div>

        {/* Simulation OTP display */}
        {simulatedOtp && !accountLocked && (
          <div className="sim-otp-banner">
            <span className="sim-label">📲 Simulated OTP</span>
            <span className="sim-code">{simulatedOtp}</span>
            <span className="sim-note">(In production, sent via SMS)</span>
          </div>
        )}

        {/* OTP Input boxes */}
        {!accountLocked && (
          <>
            <div className="otp-inputs" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputsRef.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-box ${d ? 'filled' : ''} ${error && !loading ? 'error' : ''}`}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading || accountLocked}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Timer */}
            <div className={`otp-timer ${timer < 60 ? 'urgent' : ''}`}>
              {timer > 0 ? (
                <>⏱ OTP expires in <strong>{formatTime(timer)}</strong></>
              ) : (
                <span className="expired">OTP expired</span>
              )}
            </div>

            {/* Attempts indicator */}
            <div className="attempts-row">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`attempt-dot ${i >= attemptsLeft ? 'used' : ''}`}
                />
              ))}
              <span className="attempts-label">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
              </span>
            </div>
          </>
        )}

        {/* Error/Lock alerts */}
        {error && (
          <div className={`alert ${accountLocked ? 'alert-error' : 'alert-warning'} mb-md`}>
            <span>{accountLocked ? '🔒' : '⚠️'}</span> {error}
          </div>
        )}

        {/* Account locked message */}
        {accountLocked && (
          <div className="locked-state">
            <div className="lock-icon">🔐</div>
            <h3>Account Locked</h3>
            <p>Your account has been temporarily locked due to multiple incorrect OTP entries. Please contact support or try again after some time.</p>
          </div>
        )}

        {/* Submit button */}
        {!accountLocked && (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || generating || digits.join('').length < 6}
          >
            {loading ? (
              <><div className="spinner" /> Verifying OTP...</>
            ) : (
              'Verify & Pay →'
            )}
          </button>
        )}

        {/* Resend / back links */}
        <div className="otp-footer">
          {!accountLocked && (
            <button
              className="link-btn"
              onClick={handleResend}
              disabled={generating || loading || timer > 240}
            >
              {generating ? 'Sending...' : '🔁 Resend OTP'}
            </button>
          )}
          <button className="link-btn" onClick={() => navigate('/')}>
            ← Cancel
          </button>
        </div>

        <div className="step-info">
          <span className="badge badge-blue">Step 3 of 3</span>
          <span className="step-detail">OTP Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
