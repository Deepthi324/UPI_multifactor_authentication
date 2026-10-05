/**
 * Payment Controller
 * Handles payment initiation and QR/biometric step updates
 */

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');

/**
 * POST /api/payment/initiate
 * Start a new payment transaction
 */
const initiatePayment = async (req, res) => {
  try {
    const { userId, username, deviceId, recipientUpiId, amount, note } = req.body;

    // Validate required fields
    if (!userId || !username || !deviceId || !recipientUpiId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment fields'
      });
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Verify user still exists and is not locked
    const user = await User.findById(userId);
    if (!user || user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: user ? 'Account locked' : 'User not found'
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId,
      username,
      deviceId,
      recipientUpiId,
      amount: Number(amount),
      note: note || '',
      status: 'initiated'
    });

    await transaction.save();

    // Log event
    await SecurityLog.log({
      userId,
      username,
      eventType: 'PAYMENT_INITIATED',
      message: `Payment of ₹${amount} initiated to ${recipientUpiId}`,
      metadata: { transactionId: transaction.transactionId, amount, recipientUpiId },
      success: true
    });

    res.status(201).json({
      success: true,
      message: 'Payment initiated. Proceed to QR scan.',
      transaction: {
        transactionId: transaction.transactionId,
        id: transaction._id,
        amount: transaction.amount,
        recipientUpiId: transaction.recipientUpiId,
        note: transaction.note,
        status: transaction.status
      }
    });

  } catch (error) {
    console.error('[PAYMENT INITIATE ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed'
    });
  }
};

/**
 * PUT /api/payment/qr-scan
 * Mark QR scan step as complete
 */
const completeQRScan = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'initiated') {
      return res.status(400).json({ success: false, message: 'Invalid transaction state for QR scan' });
    }

    transaction.status = 'qr_scanned';
    await transaction.save();

    await SecurityLog.log({
      userId: transaction.userId,
      username: transaction.username,
      eventType: 'QR_SCANNED',
      message: `QR code scanned for transaction ${transactionId}`,
      metadata: { transactionId },
      success: true
    });

    res.json({
      success: true,
      message: 'QR scan verified. Proceed to biometric.',
      status: 'qr_scanned'
    });

  } catch (error) {
    console.error('[QR SCAN ERROR]', error.message);
    res.status(500).json({ success: false, message: 'QR scan failed' });
  }
};

/**
 * PUT /api/payment/biometric
 * Mark biometric step as complete
 */
const completeBiometric = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'qr_scanned') {
      return res.status(400).json({ success: false, message: 'QR scan must be completed first' });
    }

    transaction.status = 'biometric_done';
    await transaction.save();

    await SecurityLog.log({
      userId: transaction.userId,
      username: transaction.username,
      eventType: 'BIOMETRIC_SUCCESS',
      message: `Biometric verified for transaction ${transactionId}`,
      metadata: { transactionId },
      success: true
    });

    res.json({
      success: true,
      message: 'Biometric verified. Proceed to OTP.',
      status: 'biometric_done'
    });

  } catch (error) {
    console.error('[BIOMETRIC ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Biometric verification failed' });
  }
};

/**
 * GET /api/payment/transaction/:transactionId
 * Get transaction details
 */
const getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOne({ transactionId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching transaction' });
  }
};

/**
 * GET /api/payment/history/:userId
 * Get user transaction history (sent and received)
 */
const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const transactions = await Transaction.find({
      $or: [
        { userId: userId },
        { recipientUpiId: user.upiId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, transactions, userUpiId: user.upiId });
  } catch (error) {
    console.error('[HISTORY ERROR]', error.message);
    res.status(500).json({ success: false, message: 'Error fetching history' });
  }
};

module.exports = { initiatePayment, completeQRScan, completeBiometric, getTransaction, getUserHistory };
