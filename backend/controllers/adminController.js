/**
 * Admin Controller
 * Serves dashboard data: Users, Transactions, Security Logs
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SecurityLog = require('../models/SecurityLog');

const getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    const logCount = await SecurityLog.countDocuments();
    const lockedAccountsCount = await User.countDocuments({ accountLocked: true });

    res.json({
      success: true,
      stats: { userCount, transactionCount, logCount, lockedAccountsCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().select('-__v').sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllLogs = async (req, res) => {
  try {
    const logs = await SecurityLog.find().select('-__v').sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { getDashboardStats, getAllUsers, getAllTransactions, getAllLogs };
