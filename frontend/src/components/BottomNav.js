import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/' || location.pathname.includes('/admin')) return null;

  const getActiveClass = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="bottom-nav">
      <div className={`nav-item ${getActiveClass('/home')}`} onClick={() => navigate('/home')}>
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </div>
      
      <div className="nav-item scan-btn-wrapper" onClick={() => navigate('/payment')}>
        <div className="scan-btn">
          <span className="nav-icon scan-icon">📷</span>
        </div>
      </div>
      
      <div className={`nav-item ${getActiveClass('/history')}`} onClick={() => navigate('/history')}>
        <span className="nav-icon">📜</span>
        <span className="nav-label">History</span>
      </div>
    </nav>
  );
};

export default BottomNav;
