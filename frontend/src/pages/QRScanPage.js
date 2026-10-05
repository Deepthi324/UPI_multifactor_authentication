/**
 * QRScanPage — Simulated QR code scan with animation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeQRScan } from '../utils/api';
import Brand from '../components/Brand';
import StepIndicator from '../components/StepIndicator';
import './QRScanPage.css';

const QRScanPage = () => {
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('upi_txn');
    const user = sessionStorage.getItem('upi_user');
    if (!stored || !user) {
      navigate('/');
      return;
    }
    setTxn(JSON.parse(stored));
  }, [navigate]);

  const handleScanClick = () => {
    setScanning(true);
    setError('');

    // Simulate QR scan animation (2 seconds)
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2000);
  };

  const handleConfirm = async () => {
    if (!txn) return;
    setLoading(true);
    try {
      await completeQRScan(txn.transactionId);
      navigate('/biometric');
    } catch (err) {
      setError(err.message || 'QR verification failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!txn) return null;

  return (
    <div className="page-container">
      <Brand />
      <StepIndicator currentStep={2} />

      <div className="card">
        <h1 className="page-title">QR Verification</h1>
        <p className="page-subtitle">Scan the merchant QR code to verify payment destination</p>

        {/* Transaction amount display */}
        <div className="amount-display">
          <div className="amount-label">Sending</div>
          <div className="amount-value">₹{Number(txn.amount).toLocaleString('en-IN')}</div>
          <div className="amount-recipient">to {txn.recipientUpiId}</div>
        </div>

        {/* QR Code Display */}
        <div className={`qr-container ${scanning ? 'scanning' : ''} ${scanned ? 'scanned' : ''}`}>
          {/* QR Code SVG simulation */}
          <div className="qr-code">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="qr-svg">
              {/* Top-left finder */}
              <rect x="10" y="10" width="60" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="6"/>
              <rect x="22" y="22" width="36" height="36" rx="2" fill="currentColor"/>
              {/* Top-right finder */}
              <rect x="130" y="10" width="60" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="6"/>
              <rect x="142" y="22" width="36" height="36" rx="2" fill="currentColor"/>
              {/* Bottom-left finder */}
              <rect x="10" y="130" width="60" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="6"/>
              <rect x="22" y="142" width="36" height="36" rx="2" fill="currentColor"/>
              {/* Data modules (simulated pattern) */}
              {[0,1,2,3,4,5,6,7].map(row =>
                [0,1,2,3,4,5,6,7].map(col => {
                  const skip = (row < 3 && col < 3) || (row < 3 && col > 4) || (row > 4 && col < 3);
                  if (skip) return null;
                  const show = (row + col + row * col) % 3 !== 0;
                  if (!show) return null;
                  return (
                    <rect
                      key={`${row}-${col}`}
                      x={80 + col * 10}
                      y={80 + row * 10}
                      width="8" height="8" rx="1"
                      fill="currentColor"
                    />
                  );
                })
              )}
              {/* Extra data dots */}
              {[[85,20],[95,20],[105,20],[115,20],[85,30],[115,30],[105,30],[85,40],[95,50],[115,50]].map(([x,y], i) => (
                <rect key={i} x={x} y={y} width="8" height="8" rx="1" fill="currentColor"/>
              ))}
            </svg>

            {/* Scanner line animation */}
            {scanning && <div className="scanner-line" />}

            {/* Success overlay */}
            {scanned && (
              <div className="scan-success-overlay">
                <div className="checkmark-circle">
                  <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="26" cy="26" r="25" fill="none" stroke="#10b981" strokeWidth="2"/>
                    <path d="M14 26 L22 34 L38 18" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="checkmark-path"/>
                  </svg>
                </div>
                <span>QR Verified!</span>
              </div>
            )}
          </div>

          {/* Corner decorators */}
          <div className="qr-corner tl" />
          <div className="qr-corner tr" />
          <div className="qr-corner bl" />
          <div className="qr-corner br" />
        </div>

        {/* UPI ID label */}
        <div className="qr-label">
          <span className="qr-upi-badge">📲 {txn.recipientUpiId}</span>
        </div>

        {error && (
          <div className="alert alert-error mb-md">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Action Buttons */}
        {!scanned ? (
          <button
            className={`btn btn-primary ${scanning ? 'scanning-btn' : ''}`}
            onClick={handleScanClick}
            disabled={scanning}
          >
            {scanning ? (
              <><div className="spinner" /> Scanning QR Code...</>
            ) : (
              '📷 Simulate QR Scan'
            )}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" /> Verifying...</>
            ) : (
              'Confirm & Continue →'
            )}
          </button>
        )}

        <div className="step-info">
          <span className="badge badge-blue">Step 1 of 3</span>
          <span className="step-detail">QR Code Verification</span>
        </div>
      </div>
    </div>
  );
};

export default QRScanPage;
