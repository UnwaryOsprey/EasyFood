import { Router } from 'express';
import * as dishController from './dish.controller.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../shared/upload.middleware.js';

const router = Router();

// Consulta pública
router.get('/restaurants/:restaurantId/dishes', dishController.list);

// Cadastro exige JWT
router.post('/restaurants/:restaurantId/dishes', verifyJWT, dishController.create);

// Upload: autenticação ANTES do upload
router.post('/dishes/:dishId/image', verifyJWT, uploadSingleImage, dishController.uploadImage);

export default router;