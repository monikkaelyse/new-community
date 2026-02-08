import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/communities/:id — Get community info
router.get('/:id', async (req, res) => {
  // TODO: Phase 4 — implement
  res.status(501).json({ message: 'Not yet implemented' });
});

// GET /api/communities/:id/members — List community members
router.get('/:id/members', async (req, res) => {
  // TODO: Phase 4 — implement
  res.status(501).json({ message: 'Not yet implemented' });
});

export default router;
