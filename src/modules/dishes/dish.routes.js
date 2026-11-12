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

// Editar nome, descrição e preço do prato
router.put('/dishes/:dishId', verifyJWT, dishController.update);

// Remover só a foto do prato
router.delete('/dishes/:dishId/image', verifyJWT, dishController.removeImage);

// Excluir o prato
router.delete('/dishes/:dishId', verifyJWT, dishController.remove);

export default router;
