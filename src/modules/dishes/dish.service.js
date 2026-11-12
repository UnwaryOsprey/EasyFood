import prisma from '../../lib/prisma.js';
import { optimizeImage, deleteImage } from '../shared/image.service.js';

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

// Busca o prato e garante que o usuário é o dono do restaurante dele
async function findOwnedDish(dishId, userId) {
  const dish = await prisma.dish.findUnique({
    where: { id: Number(dishId) },
    include: { restaurant: true }
  });

  if (!dish) {
    throw httpError('Prato não encontrado', 404);
  }

  if (dish.restaurant.userId !== userId) {
    throw httpError('Você não tem permissão para alterar este prato', 403);
  }

  return dish;
}

export async function uploadDishImage(dishId, buffer, userId) {
  const dish = await findOwnedDish(dishId, userId);

  const imageUrl = await optimizeImage(buffer, 'dishes');

  const updated = await prisma.dish.update({
    where: { id: dish.id },
    data: { imageUrl }
  });

  // Foto antiga não serve mais: libera espaço em disco
  await deleteImage(dish.imageUrl);

  return updated;
}

// Edita nome, descrição e preço (a foto é tratada nas rotas de imagem)
export async function updateDish(dishId, data, userId) {
  const dish = await findOwnedDish(dishId, userId);

  return prisma.dish.update({
    where: { id: dish.id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price
    }
  });
}

// Remove só a foto: o prato continua cadastrado
export async function removeDishImage(dishId, userId) {
  const dish = await findOwnedDish(dishId, userId);

  const updated = await prisma.dish.update({
    where: { id: dish.id },
    data: { imageUrl: null }
  });

  await deleteImage(dish.imageUrl);

  return updated;
}

// Exclui o prato (e a foto dele)
export async function deleteDish(dishId, userId) {
  const dish = await findOwnedDish(dishId, userId);

  await prisma.dish.delete({ where: { id: dish.id } });
  await deleteImage(dish.imageUrl);
}
