const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index: document will be deleted at this exact time
  }
}, { timestamps: true });

// Hash OTP before saving
otpSchema.pre('save', async function (next) {
  if (!this.isModified('otp')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('OTP', otpSchema);
