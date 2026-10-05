/**
 * SecurityLog Model
 * Logs all security events for audit trail
 */

const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  username: {
    type: String,
    default: 'unknown'
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'REGISTRATION',
      'PAYMENT_INITIATED',
      'QR_SCANNED',
      'BIOMETRIC_SUCCESS',
      'OTP_GENERATED',
      'OTP_SUCCESS',
      'OTP_FAILURE',
      'ACCOUNT_LOCKED',
      'DEVICE_MISMATCH',
      'TRANSACTION_COMPLETE',
      'TRANSACTION_FAILED'
    ]
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  success: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to create a log entry
securityLogSchema.statics.log = async function (data) {
  try {
    const entry = new this(data);
    await entry.save();
    console.log(`[SECURITY LOG] ${data.eventType}: ${data.message}`);
  } catch (err) {
    console.error('[LOG ERROR]', err.message);
  }
};

module.exports = mongoose.model('SecurityLog', securityLogSchema);
