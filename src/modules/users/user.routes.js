import { Router } from 'express';
import { uploadMyImage } from './user.controller.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../shared/upload.middleware.js';

const router = Router();

// Montado em app.js com app.use('/users', userRoutes)
// Resultado: POST /users/me/image (autenticação antes do upload)
router.post('/me/image', verifyJWT, uploadSingleImage, uploadMyImage);

export default router;
