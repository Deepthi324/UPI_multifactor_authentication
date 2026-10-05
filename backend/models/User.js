/**
 * User Model
 * Stores registered users with device binding and security state
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    trim: true
  },
  upiId: {
    type: String,
    unique: true,
    sparse: true
  },
  // User Balance for realistic simulation
  balance: {
    type: Number,
    default: 50000
  },
  // Security tracking fields
  failedAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Auto-generate UPI ID and Hash Device ID before saving
userSchema.pre('save', async function (next) {
  if (!this.upiId) {
    this.upiId = `${this.username}@upimfa`;
  }
  
  if (this.isModified('deviceId')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.deviceId = await bcrypt.hash(this.deviceId, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Instance method: check if account is locked
userSchema.methods.isLocked = function () {
  return this.accountLocked;
};

// Instance method: securely compare device ID
userSchema.methods.compareDevice = async function (candidateId) {
  return bcrypt.compare(candidateId, this.deviceId);
};

// Instance method: increment failed attempts
userSchema.methods.incrementFailedAttempts = async function () {
  this.failedAttempts += 1;
  const MAX_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS) || 3;
  if (this.failedAttempts >= MAX_ATTEMPTS) {
    this.accountLocked = true;
    this.lockedAt = new Date();
  }
  await this.save();
};

// Instance method: reset failed attempts on success
userSchema.methods.resetFailedAttempts = async function () {
  this.failedAttempts = 0;
  this.accountLocked = false;
  this.lockedAt = null;
  this.lastLogin = new Date();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
