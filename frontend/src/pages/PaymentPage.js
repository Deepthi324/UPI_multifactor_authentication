/**
 * PaymentPage — Enter payment details (amount, recipient UPI ID)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initiatePayment } from '../utils/api';
import Brand from '../components/Brand';
import StepIndicator from '../components/StepIndicator';
import './PaymentPage.css';

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ 
    recipientUpiId: location.state?.recipient || '', 
    amount: '', 
    note: '' 
  });
  const pageTitle = location.state?.title || 'Send Money';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('upi_user');
    if (!stored) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(stored));
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleQuickAmount = (amt) => {
    setForm(prev => ({ ...prev, amount: String(amt) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.recipientUpiId.trim()) {
      setError('Recipient UPI ID is required.');
      return;
    }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      setError('Enter a valid amount greater than ₹0.');
      return;
    }
    if (Number(form.amount) > 100000) {
      setError('Maximum transfer limit is ₹1,00,000.');
      return;
    }

    setLoading(true);
    try {
      const res = await initiatePayment({
        userId: user.id,
        username: user.username,
        deviceId: user.deviceId,
        recipientUpiId: form.recipientUpiId.trim(),
        amount: Number(form.amount),
        note: form.note.trim()
      });

      // Store transaction for next steps
      sessionStorage.setItem('upi_txn', JSON.stringify(res.transaction));
      navigate('/qr-scan');
    } catch (err) {
      setError(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-container">
      <Brand />
      <StepIndicator currentStep={1} />

      <div className="card">
        <button className="back-link" onClick={() => navigate('/home')}>
          ← Go Back
        </button>

        {/* User info strip */}
        <div className="user-strip">
          <div className="user-avatar">{user.username[0].toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-upi">{user.upiId}</span>
          </div>
          <div className="user-device">
            <span className="device-label">📱 Device</span>
            <span className="device-id">{user.deviceId}</span>
          </div>
        </div>

        <div className="divider">{pageTitle}</div>

        <form onSubmit={handleSubmit}>
          {/* Recipient */}
          <div className="form-group">
            <label className="form-label">
              {pageTitle.includes('Bank') ? 'Bank Account Number / IFSC' : 'Recipient UPI ID'}
            </label>
            <input
              type="text"
              name="recipientUpiId"
              className="form-input"
              placeholder={pageTitle.includes('Bank') ? 'e.g. 1234567890 @ BANK001' : 'e.g. merchant@upimfa'}
              value={form.recipientUpiId}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                name="amount"
                className="form-input amount-input"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                disabled={loading}
                min="1"
                max="100000"
              />
            </div>
            {/* Quick amounts */}
            <div className="quick-amounts">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  className={`quick-btn ${form.amount === String(amt) ? 'active' : ''}`}
                  onClick={() => handleQuickAmount(amt)}
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input
              type="text"
              name="note"
              className="form-input"
              placeholder="e.g. Rent, Food, Services..."
              value={form.note}
              onChange={handleChange}
              disabled={loading}
              maxLength={50}
            />
          </div>

          {/* Summary preview */}
          {form.amount && form.recipientUpiId && (
            <div className="payment-summary">
              <div className="summary-row">
                <span>Sending to</span>
                <span>{form.recipientUpiId}</span>
              </div>
              <div className="summary-row highlight">
                <span>Amount</span>
                <span>₹{Number(form.amount).toLocaleString('en-IN')}</span>
              </div>
              {form.note && (
                <div className="summary-row">
                  <span>Note</span>
                  <span>{form.note}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-md">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <><div className="spinner" /> Processing...</>
            ) : (
              'Proceed to QR Scan →'
            )}
          </button>
        </form>

        <div className="security-note">
          🔒 This transaction is protected by 3-factor authentication
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
