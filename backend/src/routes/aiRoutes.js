import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { generatePickupLine, listAvailableModels } from '../controllers/aiController.js';

const router = Router();

router.get('/pickup-line/:matchId', auth, generatePickupLine);
router.get('/models', auth, listAvailableModels);

export default router;
