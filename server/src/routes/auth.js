import { Router } from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Membership from '../models/Membership.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Helper: fetch all memberships for a user with community names,
 * including encrypted key data so the client can decrypt locally.
 */
async function getUserMemberships(userId) {
  const memberships = await Membership.find({ userId })
    .populate('communityId', 'name description')
    .lean();

  return memberships.map(m => ({
    _id: m._id,
    communityId: m.communityId._id,
    communityName: m.communityId.name,
    communityDescription: m.communityId.description,
    role: m.role,
    profile: m.profile,
    publicKey: m.publicKey,
    encryptionData: {
      encryptedSecretKey: m.encryptedSecretKey,
      secretKeyNonce: m.secretKeyNonce,
      secretKeySalt: m.secretKeySalt,
    },
  }));
}

// ─────────────────────────────────────────────
// POST /api/auth/register
// Create account + first community membership
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      username, email, password,
      communityName, isNewCommunity,
      publicKey, encryptedSecretKey, secretKeyNonce, secretKeySalt,
    } = req.body;

    if (!username || !email || !password || !communityName ||
        !publicKey || !encryptedSecretKey || !secretKeyNonce || !secretKeySalt) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} already taken` });
    }

    // Resolve community
    let community;
    if (isNewCommunity) {
      const existing = await Community.findOne({ name: communityName });
      if (existing) {
        return res.status(409).json({ error: 'Community name already taken' });
      }
      community = new Community({ name: communityName });
      await community.save();
    } else {
      community = await Community.findOne({ name: communityName });
      if (!community) {
        return res.status(404).json({ error: 'Community not found. Check the name or create a new one.' });
      }
    }

    // Create user
    const passwordHash = await argon2.hash(password);
    const user = new User({ username, email, passwordHash });
    await user.save();

    // Create membership with per-community keypair
    const membership = new Membership({
      userId: user._id,
      communityId: community._id,
      publicKey,
      encryptedSecretKey,
      secretKeyNonce,
      secretKeySalt,
      role: isNewCommunity ? 'admin' : 'member',
      profile: { displayName: username },
    });
    await membership.save();

    // Set community admin if new
    if (isNewCommunity) {
      community.adminId = user._id;
      await community.save();
    }

    const token = signToken(user);
    const memberships = await getUserMemberships(user._id);

    res.status(201).json({ token, user: user.toJSON(), memberships });
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
// Returns JWT + all memberships with encrypted keys
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    const memberships = await getUserMemberships(user._id);

    res.json({ token, user: user.toJSON(), memberships });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/join-community
// Existing user joins another community with a new keypair
// ─────────────────────────────────────────────
router.post('/join-community', authenticate, async (req, res) => {
  try {
    const {
      communityName, isNewCommunity,
      publicKey, encryptedSecretKey, secretKeyNonce, secretKeySalt,
    } = req.body;

    if (!communityName || !publicKey || !encryptedSecretKey || !secretKeyNonce || !secretKeySalt) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Resolve community
    let community;
    if (isNewCommunity) {
      const existing = await Community.findOne({ name: communityName });
      if (existing) {
        return res.status(409).json({ error: 'Community name already taken' });
      }
      community = new Community({ name: communityName });
      await community.save();
    } else {
      community = await Community.findOne({ name: communityName });
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
    }

    // Check if already a member
    const existing = await Membership.findOne({
      userId: req.user.userId,
      communityId: community._id,
    });
    if (existing) {
      return res.status(409).json({ error: 'You are already a member of this community' });
    }

    // Create membership with new keypair
    const user = await User.findById(req.user.userId);
    const membership = new Membership({
      userId: req.user.userId,
      communityId: community._id,
      publicKey,
      encryptedSecretKey,
      secretKeyNonce,
      secretKeySalt,
      role: isNewCommunity ? 'admin' : 'member',
      profile: { displayName: user.username },
    });
    await membership.save();

    if (isNewCommunity) {
      community.adminId = req.user.userId;
      await community.save();
    }

    const memberships = await getUserMemberships(req.user.userId);
    res.status(201).json({ memberships });
  } catch (err) {
    console.error('Join community error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already a member of this community' });
    }
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Validate token and return user + all memberships
// ─────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const memberships = await getUserMemberships(user._id);
    res.json({ user: user.toJSON(), memberships });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
