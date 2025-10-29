import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { upload } from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', upload.single('photo'), register);
router.post('/login', login);
router.get('/me', auth, me);

export default router;
