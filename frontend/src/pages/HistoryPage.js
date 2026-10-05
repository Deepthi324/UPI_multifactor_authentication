import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserHistory } from '../utils/api';
import './HistoryPage.css';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('upi_user');
    if (!stored) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(stored);
    setUser(parsedUser);
    
    const loadHistory = async () => {
      try {
        const res = await getUserHistory(parsedUser.id);
        if (res.success) {
          setHistory(res.transactions);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="history-page-container">
      <header className="history-header">
        <h2>Transaction History</h2>
      </header>

      <div className="history-content">
        {loading ? (
          <div className="loading-state"><div className="spinner" /></div>
        ) : history.length > 0 ? (
          <div className="full-history-list">
            {history.map(tx => {
              const isReceived = tx.recipientUpiId === user.upiId;
              const statusClass = tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'error' : 'pending';
              
              return (
                <div key={tx._id} className="history-card">
                  <div className="history-card-left">
                    <div className={`history-card-icon ${isReceived ? 'bg-green' : 'bg-dark'}`}>
                      {isReceived ? '↙️' : '↗️'}
                    </div>
                    <div className="history-card-details">
                      <div className="history-card-party">
                        {isReceived ? `Received from ${tx.username}` : `Paid to ${tx.recipientUpiId}`}
                      </div>
                      <div className="history-card-date">
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      {tx.note && <div className="history-card-note">"{tx.note}"</div>}
                    </div>
                  </div>
                  <div className="history-card-right">
                    <div className={`history-card-amount ${isReceived ? 'received' : 'sent'}`}>
                      {isReceived ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                    <div className={`history-card-status status-${statusClass}`}>
                      {tx.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Transactions Yet</h3>
            <p>Your transaction history will appear here once you make or receive payments.</p>
          </div>
        )}
      </div>
      <div className="bottom-spacer" />
    </div>
  );
};

export default HistoryPage;
