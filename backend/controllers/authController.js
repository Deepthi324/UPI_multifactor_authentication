/**
 * Auth Controller
 * Handles user registration and device validation
 */

const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');

/**
 * POST /api/auth/register
 * Register a new user with username and device ID
 */
const registerUser = async (req, res) => {
  try {
    const { username, deviceId } = req.body;

    // Input validation
    if (!username || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Username and Device ID are required'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already registered. Please choose a different username.'
      });
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase().trim(),
      deviceId: deviceId.trim()
    });

    await newUser.save();

    // Log the registration event
    await SecurityLog.log({
      userId: newUser._id,
      username: newUser.username,
      eventType: 'REGISTRATION',
      message: `New user registered: ${newUser.username} from device ${deviceId}`,
      metadata: { deviceId },
      success: true
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: {
        id: newUser._id,
        username: newUser.username,
        upiId: newUser.upiId,
        deviceId: newUser.deviceId
      }
    });

  } catch (error) {
    console.error('[REGISTER ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

/**
 * POST /api/auth/validate
 * Validate user credentials and device binding
 */
const validateUser = async (req, res) => {
  try {
    const { username, deviceId } = req.body;

    if (!username || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Username and Device ID are required'
      });
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or credentials. Please try again.'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      await SecurityLog.log({
        userId: user._id,
        username: user.username,
        eventType: 'TRANSACTION_FAILED',
        message: `Blocked login attempt on locked account: ${user.username}`,
        success: false
      });

      return res.status(403).json({
        success: false,
        message: 'Account is locked due to multiple failed attempts. Please contact support.',
        accountLocked: true
      });
    }

    // Device binding check — ensure same device as registration
    const isDeviceValid = await user.compareDevice(deviceId.trim());
    if (!isDeviceValid) {
      await SecurityLog.log({
        userId: user._id,
        username: user.username,
        eventType: 'DEVICE_MISMATCH',
        message: `Device mismatch for user ${user.username}. Provided device does not match registered biometric binding.`,
        metadata: { providedDevice: deviceId },
        success: false
      });

      return res.status(403).json({
        success: false,
        message: 'Device not recognized. This account is bound to a different device.',
        deviceMismatch: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'User validated successfully',
      user: {
        id: user._id,
        username: user.username,
        upiId: user.upiId,
        deviceId: user.deviceId
      }
    });

  } catch (error) {
    console.error('[VALIDATE ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Validation failed. Please try again.'
    });
  }
};

/**
 * GET /api/auth/me
 * Fetch latest user info (balance, locks, etc.)
 */
const getMe = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false });
    
    const user = await User.findById(userId).select('-__v');
    if (!user) return res.status(404).json({ success: false });

    res.json({ success: true, user: {
      id: user._id,
      username: user.username,
      upiId: user.upiId,
      deviceId: user.deviceId,
      balance: user.balance,
      accountLocked: user.accountLocked
    }});
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

module.exports = { registerUser, validateUser, getMe };
