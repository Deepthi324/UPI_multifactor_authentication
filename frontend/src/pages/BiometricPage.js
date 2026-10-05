/**
 * BiometricPage — Fingerprint authentication simulation with animation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeBiometric } from '../utils/api';
import Brand from '../components/Brand';
import StepIndicator from '../components/StepIndicator';
import './BiometricPage.css';

const PHASES = ['idle', 'scanning', 'processing', 'success', 'error'];

const BiometricPage = () => {
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('upi_txn');
    if (!stored) { navigate('/'); return; }
    setTxn(JSON.parse(stored));
  }, [navigate]);

  const startScan = () => {
    setPhase('scanning');
    setProgress(0);
    setError('');

    // Animate progress bar over 2.5 seconds
    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      setProgress(Math.min(current, 100));
      if (current >= 100) {
        clearInterval(interval);
        setPhase('processing');
        setTimeout(() => confirmBiometric(), 600);
      }
    }, 100);
  };

  const confirmBiometric = async () => {
    if (!txn) return;
    try {
      await completeBiometric(txn.transactionId);
      setPhase('success');
      setTimeout(() => navigate('/otp'), 1400);
    } catch (err) {
      setPhase('error');
      setError(err.message || 'Biometric failed.');
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'idle': return 'Place your finger on the sensor';
      case 'scanning': return `Scanning fingerprint... ${progress}%`;
      case 'processing': return 'Analyzing biometric data...';
      case 'success': return 'Identity verified! ✓';
      case 'error': return 'Verification failed';
      default: return '';
    }
  };

  if (!txn) return null;

  return (
    <div className="page-container">
      <Brand />
      <StepIndicator currentStep={3} />

      <div className="card biometric-card">
        <h1 className="page-title">Biometric Auth</h1>
        <p className="page-subtitle">Verify your identity using fingerprint</p>

        {/* Amount reminder */}
        <div className="bio-amount-chip">
          <span>💳</span>
          <span>₹{Number(txn.amount).toLocaleString('en-IN')} → {txn.recipientUpiId}</span>
        </div>

        {/* Fingerprint sensor */}
        <div className="fingerprint-stage">
          <button
            className={`fingerprint-btn phase-${phase}`}
            onClick={phase === 'idle' || phase === 'error' ? startScan : undefined}
            disabled={phase === 'scanning' || phase === 'processing' || phase === 'success'}
          >
            <div className="fp-rings">
              <div className="fp-ring r1" />
              <div className="fp-ring r2" />
              <div className="fp-ring r3" />
            </div>

            {/* Fingerprint SVG */}
            <svg className="fp-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 15 C30 15 15 30 15 50" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M50 15 C70 15 85 30 85 50" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M25 50 C25 36 36 25 50 25 C64 25 75 36 75 50" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M35 52 C35 42 42 35 50 35 C58 35 65 42 65 52 C65 60 60 68 50 75" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M42 53 C42 48 46 44 50 44 C54 44 58 48 58 53 C58 60 54 66 50 72" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M20 62 C18 55 18 43 22 35" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M80 62 C82 55 82 43 78 35" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M28 72 C22 65 20 57 20 50" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M72 72 C78 65 80 57 80 50" fill="none" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>

            {/* Success checkmark */}
            {phase === 'success' && (
              <div className="fp-success-icon">✓</div>
            )}

            {/* Scan overlay */}
            {phase === 'scanning' && (
              <div className="fp-scan-overlay" style={{ height: `${progress}%` }} />
            )}
          </button>

          {/* Progress bar */}
          {(phase === 'scanning' || phase === 'processing') && (
            <div className="bio-progress-track">
              <div
                className="bio-progress-fill"
                style={{ width: `${phase === 'processing' ? 100 : progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Phase label */}
        <p className={`phase-label phase-label-${phase}`}>
          {getPhaseLabel()}
        </p>

        {/* Ridges pattern decoration */}
        <div className="bio-ridges" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ridge" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        {error && (
          <div className="alert alert-error mb-md">
            <span>⚠️</span> {error}
          </div>
        )}

        {(phase === 'idle' || phase === 'error') && (
          <button className="btn btn-primary" onClick={startScan}>
            {phase === 'error' ? '🔄 Try Again' : '👆 Start Fingerprint Scan'}
          </button>
        )}

        <div className="step-info">
          <span className="badge badge-blue">Step 2 of 3</span>
          <span className="step-detail">Biometric Verification</span>
        </div>
      </div>
    </div>
  );
};

export default BiometricPage;
