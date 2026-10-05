const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  completeQRScan,
  completeBiometric,
  getTransaction,
  getUserHistory
} = require('../controllers/paymentController');

// POST /api/payment/initiate
router.post('/initiate', initiatePayment);

// PUT /api/payment/qr-scan
router.put('/qr-scan', completeQRScan);

// PUT /api/payment/biometric
router.put('/biometric', completeBiometric);

// GET /api/payment/transaction/:transactionId
router.get('/transaction/:transactionId', getTransaction);

// GET /api/payment/history/:userId
router.get('/history/:userId', getUserHistory);

module.exports = router;
