/**
 * OTP Controller
 * Generates, stores, and verifies OTPs for payment authentication
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SecurityLog = require('../models/SecurityLog');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');

const OTP_EXPIRY_MS = (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a cryptographically simple 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/otp/generate
 * Generate and store OTP for a transaction
 */
const generateOTPHandler = async (req, res) => {
  try {
    const { transactionId, userId } = req.body;

    if (!transactionId || !userId) {
      return res.status(400).json({ success: false, message: 'transactionId and userId are required' });
    }

    // Validate transaction state
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'biometric_done') {
      return res.status(400).json({ success: false, message: 'Biometric must be completed before OTP' });
    }

    // Validate user
    const user = await User.findById(userId);
    if (!user || user.isLocked()) {
      return res.status(403).json({ success: false, message: 'User locked or not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    // Store in MongoDB (persistent across restarts)
    await OTP.findOneAndDelete({ transactionId }); // Clear any existing
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    
    await OTP.create({
      transactionId,
      userId,
      otp,
      expiresAt
    });

    // Update transaction status
    transaction.status = 'otp_pending';
    await transaction.save();

    // Log OTP generation (in production, send via SMS/email — here we log to console)
    console.log(`\n╔════════════════════════════════╗`);
    console.log(`║  [OTP SIMULATION]               ║`);
    console.log(`║  Transaction: ${transactionId}  ║`);
    console.log(`║  OTP: ${otp}                     ║`);
    console.log(`║  Expires in: 5 minutes           ║`);
    console.log(`╚════════════════════════════════╝\n`);

    await SecurityLog.log({
      userId,
      username: transaction.username,
      eventType: 'OTP_GENERATED',
      message: `OTP generated for transaction ${transactionId}`,
      metadata: { transactionId },
      success: true
    });

    res.json({
      success: true,
      message: 'OTP generated and sent (check server console for simulation)',
      // In simulation only — REMOVE in production:
      simulatedOtp: otp,
      expiresInSeconds: OTP_EXPIRY_MS / 1000
    });

  } catch (error) {
    console.error('[OTP GENERATE ERROR]', error.message);
    res.status(500).json({ success: false, message: 'OTP generation failed' });
  }
};

/**
 * POST /api/otp/verify
 * Verify the OTP submitted by user
 */
const verifyOTPHandler = async (req, res) => {
  try {
    const { transactionId, otp, userId } = req.body;

    if (!transactionId || !otp || !userId) {
      return res.status(400).json({ success: false, message: 'transactionId, otp, and userId are required' });
    }

    // Get user for locking
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Contact support.',
        accountLocked: true
      });
    }
    
    console.log(`[OTP VERIFY] Req for Txn: ${transactionId}, OTP: [${otp}], User: ${userId}`);

    // Check OTP exists in store
    const otpRecord = await OTP.findOne({ transactionId });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired. Please regenerate.' });
    }

    // Check expiry (TTL index usually handles this, but safety check)
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ transactionId });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempt count
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({ transactionId });
      await user.incrementFailedAttempts();

      await SecurityLog.log({
        userId,
        username: user.username,
        eventType: 'ACCOUNT_LOCKED',
        message: `Account locked after ${MAX_OTP_ATTEMPTS} OTP failures`,
        success: false
      });

      return res.status(403).json({
        success: false,
        message: 'Maximum OTP attempts exceeded. Account locked.',
        accountLocked: true
      });
    }

    // Increment attempt counter
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp.trim(), otpRecord.otp);
    console.log(`[OTP COMPARE] Match: ${isOTPValid}`);
    if (!isOTPValid) {
      const remaining = MAX_OTP_ATTEMPTS - otpRecord.attempts;

      // If no attempts remain, lock account
      if (remaining <= 0) {
        await OTP.deleteOne({ transactionId });
        await user.incrementFailedAttempts();

        await SecurityLog.log({
          userId,
          username: user.username,
          eventType: 'OTP_FAILURE',
          message: `Wrong OTP - account locked for ${user.username}`,
          success: false
        });

        // Mark transaction failed
        await Transaction.findOneAndUpdate(
          { transactionId },
          { status: 'failed' }
        );

        return res.status(403).json({
          success: false,
          message: 'Incorrect OTP. Account has been locked due to multiple failures.',
          accountLocked: true,
          attemptsRemaining: 0
        });
      }

      await SecurityLog.log({
        userId,
        username: user.username,
        eventType: 'OTP_FAILURE',
        message: `Wrong OTP attempt ${otpRecord.attempts} of ${MAX_OTP_ATTEMPTS} for transaction ${transactionId}`,
        metadata: { attempt: otpRecord.attempts },
        success: false
      });

      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining
      });
    }

    // ✅ OTP is correct
    await OTP.deleteOne({ transactionId });
    await user.resetFailedAttempts();

    // Fetch transaction to get amount and recipient
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction record no longer exists' });
    }

    // Deduct balance from sender
    user.balance -= transaction.amount;
    await user.save();

    // Add balance to recipient if they exist in our platform
    const recipientUser = await User.findOne({ upiId: transaction.recipientUpiId });
    if (recipientUser) {
      recipientUser.balance += transaction.amount;
      await recipientUser.save();
    }

    // Mark transaction complete
    transaction.status = 'completed';
    await transaction.save();

    await SecurityLog.log({
      userId,
      username: user.username,
      eventType: 'TRANSACTION_COMPLETE',
      message: `Transaction ${transactionId} completed successfully. Amount: ₹${transaction?.amount}`,
      metadata: { transactionId, amount: transaction?.amount, recipient: transaction?.recipientUpiId },
      success: true
    });

    res.json({
      success: true,
      message: 'OTP verified. Transaction successful!',
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        recipientUpiId: transaction.recipientUpiId,
        note: transaction.note,
        status: 'completed',
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[OTP VERIFY ERROR]', error.message);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};

module.exports = { generateOTPHandler, verifyOTPHandler };
