import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getTodayPrompt, answerTodayPrompt } from '../controllers/promptController.js';

const router = Router();

router.get('/today', auth, getTodayPrompt);
router.post('/answer', auth, answerTodayPrompt);

export default router;
