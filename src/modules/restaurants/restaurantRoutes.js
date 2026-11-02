import { Router } from 'express';
import { getRestaurants, getUserRestaurants, postRestaurant, putRestaurant, deleteRestaurantController, uploadRestaurantImage } from './restaurantControler.js';
import { verifyJWT } from '../../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../shared/upload.middleware.js';

const router = Router();

router.get('/restaurants', getRestaurants);

router.get('/my-restaurants', verifyJWT, getUserRestaurants);

router.post('/restaurants', verifyJWT, postRestaurant);

router.put('/restaurants/:id', verifyJWT, putRestaurant);

router.delete('/restaurants/:id', verifyJWT, deleteRestaurantController);

router.post('/restaurants/:id/image', verifyJWT, uploadSingleImage, uploadRestaurantImage);

export default router;

