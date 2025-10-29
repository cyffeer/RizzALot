import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getStarters } from '../controllers/starterController.js';

const router = Router();

router.get('/', auth, getStarters);

export default router;
