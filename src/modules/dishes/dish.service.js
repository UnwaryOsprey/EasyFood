import prisma from '../../lib/prisma.js';
import { optimizeImage } from '../shared/image.service.js';
 
function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
 
export async function createDish(restaurantId, data, userId) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: Number(restaurantId) }
  });
 
  if (!restaurant) {
    throw httpError('Restaurante não encontrado', 404);
  }
 
  // Só o dono do restaurante pode cadastrar pratos nele
  if (restaurant.userId !== userId) {
    throw httpError('Você não tem permissão para cadastrar pratos neste restaurante', 403);
  }
 
  return prisma.dish.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      restaurantId: Number(restaurantId)
    }
  });
}
 
export async function listDishes(restaurantId) {
  return prisma.dish.findMany({
    where: { restaurantId: Number(restaurantId) }
  });
}
 
export async function uploadDishImage(dishId, buffer, userId) {
  const dish = await prisma.dish.findUnique({
    where: { id: Number(dishId) },
    include: { restaurant: true }
  });
 
  if (!dish) {
    throw httpError('Prato não encontrado', 404);
  }
 
  // Só o dono do restaurante do prato pode trocar a foto
  if (dish.restaurant.userId !== userId) {
    throw httpError('Você não tem permissão para alterar este prato', 403);
  }
 
  const imageUrl = await optimizeImage(buffer, 'dishes');
 
  return prisma.dish.update({
    where: { id: Number(dishId) },
    data: { imageUrl }
  });
}