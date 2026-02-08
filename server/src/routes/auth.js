import { Router } from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import User from '../models/User.js';
import Community from '../models/Community.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
      communityId: user.communityId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ─────────────────────────────────────────────
// POST /api/auth/register
// Creates a new community (if isNewCommunity) + user account
// Client sends E2E keys generated in the browser
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      communityName,
      isNewCommunity,
      publicKey,
      encryptedSecretKey,
      secretKeyNonce,
      secretKeySalt,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !communityName || !publicKey || !encryptedSecretKey || !secretKeyNonce || !secretKeySalt) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} already taken` });
    }

    let community;

    if (isNewCommunity) {
      // Check if community name is taken
      const existingCommunity = await Community.findOne({ name: communityName });
      if (existingCommunity) {
        return res.status(409).json({ error: 'Community name already taken' });
      }
      // Create new community (adminId set after user creation)
      community = new Community({ name: communityName });
      await community.save();
    } else {
      // Find existing community
      community = await Community.findOne({ name: communityName });
      if (!community) {
        return res.status(404).json({ error: 'Community not found. Check the name or create a new one.' });
      }
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password);

    // Create user
    const user = new User({
      username,
      email,
      passwordHash,
      publicKey,
      encryptedSecretKey,
      secretKeyNonce,
      secretKeySalt,
      communityId: community._id,
      role: isNewCommunity ? 'admin' : 'member',
      profile: { displayName: username },
    });

    await user.save();

    // If new community, set this user as admin
    if (isNewCommunity) {
      community.adminId = user._id;
      await community.save();
    }

    // Sign JWT
    const token = signToken(user);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Returns JWT + encrypted secret key so client can decrypt it locally
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user — explicitly select the encrypted key fields
    const user = await User.findOne({ email })
      .select('+encryptedSecretKey +secretKeyNonce +secretKeySalt');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign JWT
    const token = signToken(user);

    // Return token + encrypted secret key data so client can decrypt locally
    res.json({
      token,
      user: user.toJSON(),
      encryptionData: {
        encryptedSecretKey: user.encryptedSecretKey,
        secretKeyNonce: user.secretKeyNonce,
        secretKeySalt: user.secretKeySalt,
        publicKey: user.publicKey,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Validate token and return current user
// ─────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId)
      .select('+encryptedSecretKey +secretKeyNonce +secretKeySalt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.toJSON(),
      encryptionData: {
        encryptedSecretKey: user.encryptedSecretKey,
        secretKeyNonce: user.secretKeyNonce,
        secretKeySalt: user.secretKeySalt,
        publicKey: user.publicKey,
      },
    });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
