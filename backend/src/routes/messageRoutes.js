import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getMessages, sendMessage, reactToMessage } from '../controllers/messageController.js';

const router = Router();

router.get('/:matchId', auth, getMessages);
router.post('/:messageId/react', auth, reactToMessage);
router.post('/:matchId', auth, sendMessage);

export default router;
