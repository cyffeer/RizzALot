import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getMyMatches, getMatchDetails } from '../controllers/matchController.js';

const router = Router();

router.get('/', auth, getMyMatches);
router.get('/:id', auth, getMatchDetails);

export default router;
