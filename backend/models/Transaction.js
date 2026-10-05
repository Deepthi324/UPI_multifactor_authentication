/**
 * Transaction Model
 * Records all payment transactions with status tracking
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    default: () => `TXN${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 12)}`,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  recipientUpiId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least ₹1']
  },
  note: {
    type: String,
    default: ''
  },
  // MFA step tracking
  status: {
    type: String,
    enum: ['initiated', 'qr_scanned', 'biometric_done', 'otp_pending', 'completed', 'failed'],
    default: 'initiated'
  },
  deviceId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
