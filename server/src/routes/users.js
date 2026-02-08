import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/me — Get current user profile
router.get('/me', async (req, res) => {
  // TODO: Phase 4 — implement profile fetch
  res.status(501).json({ message: 'Not yet implemented' });
});

// PUT /api/users/me — Update current user profile
router.put('/me', async (req, res) => {
  // TODO: Phase 4 — implement profile update
  res.status(501).json({ message: 'Not yet implemented' });
});

// GET /api/users/:id/public-key — Get a user's public key (for E2E encryption)
router.get('/:id/public-key', async (req, res) => {
  // TODO: Phase 3 — implement public key retrieval
  res.status(501).json({ message: 'Not yet implemented' });
});

export default router;
