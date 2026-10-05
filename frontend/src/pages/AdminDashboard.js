import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats, getAdminUsers, getAdminTransactions, getAdminLogs } from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({ userCount: 0, transactionCount: 0, logCount: 0, lockedAccountsCount: 0 });
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await getAdminStats();
      if(statsRes.success) setStats(statsRes.stats);

      if (activeTab === 'users') {
        const usersRes = await getAdminUsers();
        if(usersRes.success) setUsers(usersRes.users);
      } else if (activeTab === 'transactions') {
        const txRes = await getAdminTransactions();
        if(txRes.success) setTransactions(txRes.transactions);
      } else if (activeTab === 'logs') {
        const logRes = await getAdminLogs();
        if(logRes.success) setLogs(logRes.logs);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="shield-icon">🛡️</span>
          <h2>UPI MFA Admin</h2>
        </div>
        <nav className="admin-nav">
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            👤 Users
          </button>
          <button className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            💳 Transactions
          </button>
          <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            📋 Security Logs
          </button>
        </nav>
        <div className="admin-nav-bottom">
          <button className="nav-item back" onClick={() => navigate('/')}>
            ← Back to App
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <button className="refresh-btn" onClick={fetchData} disabled={loading}>
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
          </button>
        </header>

        {/* Stats Row */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.userCount}</p>
          </div>
          <div className="stat-card">
            <h3>Total Transactions</h3>
            <p className="stat-number">{stats.transactionCount}</p>
          </div>
          <div className="stat-card">
            <h3>Security Events</h3>
            <p className="stat-number">{stats.logCount}</p>
          </div>
          <div className="stat-card alert-card">
            <h3>Locked Accounts</h3>
            <p className="stat-number alert">{stats.lockedAccountsCount}</p>
          </div>
        </div>

        {/* Dynamic Table Content */}
        <div className="table-container">
          {loading ? (
            <div className="admin-loader">Loading {activeTab}...</div>
          ) : (
            <>
              {activeTab === 'users' && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Device ID</th>
                      <th>Failed Attempts</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.username}</td>
                        <td><code>{u.deviceId}</code></td>
                        <td>{u.failedAttempts}</td>
                        <td>
                          {u.accountLocked ? (
                            <span className="badge-danger">Locked</span>
                          ) : (
                            <span className="badge-success">Active</span>
                          )}
                        </td>
                        <td>{new Date(u.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan="5">No users found.</td></tr>}
                  </tbody>
                </table>
              )}

              {activeTab === 'transactions' && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>TXN ID</th>
                      <th>Sender</th>
                      <th>Recipient</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Initiated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t._id}>
                        <td><code>{t.transactionId}</code></td>
                        <td>{t.username}</td>
                        <td>{t.recipientUpiId}</td>
                        <td><strong>₹{t.amount}</strong></td>
                        <td>
                          <span className={`badge badge-${t.status}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan="6">No transactions found.</td></tr>}
                  </tbody>
                </table>
              )}

              {activeTab === 'logs' && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>User</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l._id}>
                        <td>
                          <span className={`log-type ${l.eventType.toLowerCase()}`}>
                            {l.eventType}
                          </span>
                        </td>
                        <td>{l.username}</td>
                        <td>{l.message}</td>
                        <td>
                          {l.success ? <span className="txt-success">Success</span> : <span className="txt-danger">Failed</span>}
                        </td>
                        <td>{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan="5">No logs found.</td></tr>}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
