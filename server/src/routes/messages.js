import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/messages/:channelId — Get encrypted message history for a channel
router.get('/:channelId', async (req, res) => {
  // TODO: Phase 5 — implement message history
  res.status(501).json({ message: 'Not yet implemented' });
});

export default router;
