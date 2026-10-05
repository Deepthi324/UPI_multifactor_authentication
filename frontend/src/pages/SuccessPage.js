/**
 * SuccessPage — Transaction complete with celebration animation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import './SuccessPage.css';

const SuccessPage = () => {
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [user, setUser] = useState(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const storedTxn = sessionStorage.getItem('upi_success');
    const storedUser = sessionStorage.getItem('upi_user');
    if (!storedTxn) { navigate('/'); return; }
    setTxn(JSON.parse(storedTxn));
    if (storedUser) setUser(JSON.parse(storedUser));
    // Delay content reveal for animation staging
    setTimeout(() => setShowContent(true), 200);
  }, [navigate]);

  const handleNewPayment = () => {
    // Keep user session, clear transaction
    sessionStorage.removeItem('upi_txn');
    sessionStorage.removeItem('upi_success');
    navigate('/payment');
  };

  const handleHome = () => {
    sessionStorage.removeItem('upi_txn');
    sessionStorage.removeItem('upi_success');
    navigate('/home');
  };

  if (!txn) return null;

  const completedAt = new Date(txn.completedAt || Date.now());

  return (
    <div className="page-container">
      <Brand />

      <div className="card success-card">
        {/* Confetti particles */}
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${1 + Math.random() * 0.5}s`,
                background: ['#4f8ef7', '#7c3aed', '#10b981', '#f59e0b', '#ec4899'][i % 5]
              }}
            />
          ))}
        </div>

        {/* Success Icon */}
        <div className="success-icon-wrapper">
          <div className="success-circle">
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="success-svg">
              <circle cx="40" cy="40" r="38" fill="none" stroke="#10b981" strokeWidth="3" className="success-ring"/>
              <path
                d="M22 40 L34 52 L58 28"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="success-check"
              />
            </svg>
          </div>
          {/* Ripple rings */}
          <div className="ripple r1" />
          <div className="ripple r2" />
          <div className="ripple r3" />
        </div>

        {/* Content */}
        <div className={`success-content ${showContent ? 'visible' : ''}`}>
          <h1 className="success-title">Payment Successful!</h1>
          <p className="success-subtitle">
            Your transaction has been authenticated and processed.
          </p>

          {/* Transaction details card */}
          <div className="txn-details">
            <div className="txn-amount-block">
              <span className="txn-amount-label">Amount Sent</span>
              <span className="txn-amount-value">₹{Number(txn.amount).toLocaleString('en-IN')}</span>
            </div>

            <div className="txn-rows">
              <div className="txn-row">
                <span>Transaction ID</span>
                <span className="txn-id">{txn.transactionId}</span>
              </div>
              <div className="txn-row">
                <span>Paid To</span>
                <span>{txn.recipientUpiId}</span>
              </div>
              {txn.note && (
                <div className="txn-row">
                  <span>Note</span>
                  <span>{txn.note}</span>
                </div>
              )}
              <div className="txn-row">
                <span>Status</span>
                <span className="status-complete">✓ Completed</span>
              </div>
              <div className="txn-row">
                <span>Date & Time</span>
                <span>{completedAt.toLocaleString('en-IN')}</span>
              </div>
              {user && (
                <div className="txn-row">
                  <span>Paid By</span>
                  <span>{user.upiId}</span>
                </div>
              )}
            </div>
          </div>

          {/* MFA Steps completed */}
          <div className="mfa-summary">
            <p className="mfa-label">Authentication completed via</p>
            <div className="mfa-steps">
              <div className="mfa-step done">
                <span>📷</span>
                <span>QR Scan</span>
              </div>
              <div className="mfa-sep">→</div>
              <div className="mfa-step done">
                <span>👆</span>
                <span>Biometric</span>
              </div>
              <div className="mfa-sep">→</div>
              <div className="mfa-step done">
                <span>🔢</span>
                <span>OTP</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="success-actions">
            <button className="btn btn-primary" onClick={handleNewPayment}>
              ➕ New Payment
            </button>
            <button className="btn btn-secondary" onClick={handleHome}>
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
