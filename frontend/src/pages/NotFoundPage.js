import React from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <Brand />
      <div className="card text-center">
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
        <h1 className="page-title">Page Not Found</h1>
        <p className="page-subtitle" style={{ marginBottom: '24px' }}>
          This page doesn't exist or you may have lost your session.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
