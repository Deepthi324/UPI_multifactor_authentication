/**
 * StepIndicator — Shows current MFA step progress
 */

import React from 'react';

const STEPS = ['Register', 'Payment', 'QR', 'Biometric', 'OTP', 'Done'];

const StepIndicator = ({ currentStep }) => {
  return (
    <div className="step-indicator">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`step-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}
        />
      ))}
    </div>
  );
};

export default StepIndicator;
