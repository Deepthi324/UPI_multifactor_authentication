const express = require('express');
const router = express.Router();
const { registerUser, validateUser, getMe } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/validate
router.post('/validate', validateUser);

// GET /api/auth/me
router.get('/me', getMe);

module.exports = router;
