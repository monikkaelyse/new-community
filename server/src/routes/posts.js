import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/posts/:communityId — Get encrypted posts for a community
router.get('/:communityId', async (req, res) => {
  // TODO: Phase 6 — implement
  res.status(501).json({ message: 'Not yet implemented' });
});

// POST /api/posts — Create encrypted post
router.post('/', async (req, res) => {
  // TODO: Phase 6 — implement
  res.status(501).json({ message: 'Not yet implemented' });
});

export default router;
