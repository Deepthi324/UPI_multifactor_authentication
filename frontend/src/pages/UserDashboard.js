import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUserHistory } from '../utils/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showBalance, setShowBalance] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('upi_user');
    if (!stored) {
      navigate('/');
      return;
    }
    const fetchUser = async () => {
      try {
        setError(null);
        const parsedData = JSON.parse(stored);
        const res = await api.get(`/auth/me?userId=${parsedData.id}`);
        if(res.success) {
          setUser(res.user);
          // fetch history to extract contacts
          const histRes = await getUserHistory(res.user.id);
          if (histRes.success) {
            const uniqueContacts = Array.from(new Set(
              histRes.transactions
               .filter(t => t.userId === res.user.id) // sent by user
               .map(t => t.recipientUpiId)
            ));
            setContacts(uniqueContacts);
          }
        }
      } catch (e) {
        console.error("Error fetching dashboard data", e);
        if (e.status === 404 || e.response?.status === 404) {
          // Session likely invalid (DB wiped or user deleted)
          sessionStorage.clear();
          navigate('/');
        } else {
          setError("Failed to load dashboard. Please check your connection.");
        }
      }
    };
    fetchUser();
  }, [navigate]);

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!user) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="dashboard-container">
      {/* App Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="user-avatar" onClick={() => {
            sessionStorage.clear();
            navigate('/');
          }}>
            {user.username[0].toUpperCase()}
          </div>
          <div className="header-greeting">
            <span className="greeting-text">Welcome back,</span>
            <span className="greeting-name">{user.username}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={() => {
            sessionStorage.clear();
            navigate('/');
          }}>Logout</button>
          <button className="icon-btn">🔔</button>
        </div>
      </header>

      {/* Main Content Scrollable Area */}
      <main className="dashboard-main">
        
        {/* Money Transfer Section */}
        <section className="action-card">
          <h2 className="section-title">Transfer Money</h2>
          <div className="action-grid">
            <div className="action-item" onClick={() => navigate('/payment', { state: { title: 'To Contact' } })}>
              <div className="action-icon purple">👤</div>
              <span>To Contact</span>
            </div>
            <div className="action-item" onClick={() => navigate('/payment', { state: { title: 'To Bank Account' } })}>
              <div className="action-icon blue">🏦</div>
              <span>To Bank</span>
            </div>
            <div className="action-item" onClick={() => navigate('/payment', { state: { title: 'To UPI ID' } })}>
              <div className="action-icon green">🆔</div>
              <span>To UPI ID</span>
            </div>
            <div className="action-item" onClick={() => setShowBalance(!showBalance)}>
              <div className="action-icon orange">💰</div>
              <span>Check Balance</span>
            </div>
          </div>
        </section>

        {/* Balance Display Dropdown */}
        {showBalance && (
          <div className="balance-display slide-down">
            <div className="balance-header">
              <span>Primary Account</span>
              <span className="bank-name">UPI MFA Bank</span>
            </div>
            <div className="balance-amount">
              ₹ {Number(user.balance).toLocaleString('en-IN')}
            </div>
          </div>
        )}

        {/* Recent Contacts */}
        {contacts.length > 0 && (
          <section className="action-card">
            <h2 className="section-title">Recent Contacts</h2>
            <div className="contacts-list">
              {contacts.map((contactUpi, idx) => (
                <div key={idx} className="contact-item" onClick={() => navigate('/payment', { state: { recipient: contactUpi, title: 'To Contact' } })}>
                  <div className="contact-avatar">{contactUpi[0].toUpperCase()}</div>
                  <span className="contact-name">{contactUpi.split('@')[0]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Promotions/Banners */}
        <section className="promo-banner">
          <div className="promo-content">
            <h3>Secure 3FA Payments</h3>
            <p>Your transactions are safeguarded with Device, Biometric, and OTP matching.</p>
          </div>
          <div className="promo-icon">🛡️</div>
        </section>

        {/* Recharge & Pay Bills */}
        <section className="action-card">
          <h2 className="section-title">Recharge & Pay Bills</h2>
          <div className="action-grid small">
            <div className="action-item" onClick={() => navigate('/payment', { state: { title: 'Mobile Recharge', recipient: 'mobile.recharge@upimfa' } })}>
              <div className="action-icon outline">📱</div>
              <span>Mobile</span>
            </div>
            <div className="action-item" onClick={() => navigate('/payment', { state: { title: 'Electricity Bill', recipient: 'electricity.bill@upimfa' } })}>
              <div className="action-icon outline">💡</div>
              <span>Electricity</span>
            </div>
            <div className="action-item" onClick={() => navigate('/payment', { state: { title: 'DTH Recharge', recipient: 'dth.recharge@upimfa' } })}>
              <div className="action-icon outline">📡</div>
              <span>DTH</span>
            </div>
            <div className="action-item" onClick={() => navigate('/payment', { state: { title: 'Water Bill', recipient: 'water.bill@upimfa' } })}>
              <div className="action-icon outline">💧</div>
              <span>Water</span>
            </div>
          </div>
        </section>
        
        {/* Spacer for bottom nav */}
        <div className="bottom-spacer" />
      </main>
    </div>
  );
};

export default UserDashboard;
