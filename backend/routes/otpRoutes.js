const express = require('express');
const router = express.Router();
const { generateOTPHandler, verifyOTPHandler } = require('../controllers/otpController');

// POST /api/otp/generate
router.post('/generate', generateOTPHandler);

// POST /api/otp/verify
router.post('/verify', verifyOTPHandler);

module.exports = router;
