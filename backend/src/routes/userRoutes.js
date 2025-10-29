import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { discoverUsers, getMyProfile, getQuestionOptions, likeUser, skipUser, submitQuestions, updateMyProfile, uploadProfilePhotos } from '../controllers/userController.js';

const router = Router();

router.get('/me', auth, getMyProfile);
router.put('/me', auth, upload.single('photo'), updateMyProfile);
router.put('/me/photos', auth, upload.array('photos', 6), uploadProfilePhotos);
router.get('/discover', auth, discoverUsers);
router.post('/like/:id', auth, likeUser);
router.post('/skip/:id', auth, skipUser);
router.get('/questions/options', auth, getQuestionOptions);
router.post('/questions', auth, submitQuestions);

export default router;
