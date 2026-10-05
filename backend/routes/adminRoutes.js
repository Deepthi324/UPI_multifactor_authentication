const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, getAllTransactions, getAllLogs } = require('../controllers/adminController');

// GET /api/admin/stats
router.get('/stats', getDashboardStats);

// GET /api/admin/users
router.get('/users', getAllUsers);

// GET /api/admin/transactions
router.get('/transactions', getAllTransactions);

// GET /api/admin/logs
router.get('/logs', getAllLogs);

module.exports = router;
