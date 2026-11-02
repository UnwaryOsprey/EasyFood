import prisma from '../../lib/prisma.js';
import { sendEmail } from '../../lib/email.service.js';
import { optimizeImage } from '../shared/image.service.js';

export async function findAllRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { id: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function findUserRestaurants(userId) {
  return prisma.restaurant.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function findRestaurantById(id) {
  return prisma.restaurant.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function createRestaurant({ name, category, description, address, phone, rating = 0, userId }) {
  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      category,
      description,
      address,
      phone,
      rating,
      userId
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  // E-mail é secundário: se falhar, o restaurante continua cadastrado.
  try {
    await sendEmail({
      to: restaurant.user.email,
      toName: restaurant.user.name,
      subject: `Restaurante "${restaurant.name}" cadastrado!`,
      header: 'EasyFood',
      body: `Olá, ${restaurant.user.name}!\n\nSeu restaurante "${restaurant.name}" (${restaurant.category}) foi cadastrado com sucesso.`,
      footer: 'Você recebeu este e-mail porque cadastrou um restaurante no EasyFood.'
    });
  } catch (error) {
    console.error('Falha ao enviar e-mail de cadastro:', error.message);
  }

  return restaurant;
}

export async function updateRestaurant(id, { name, category, description, address, phone, rating }) {
  return prisma.restaurant.update({
    where: { id },
    data: {
      name,
      category,
      description,
      address,
      phone,
      rating
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function deleteRestaurant(id) {
  return prisma.restaurant.delete({
    where: { id }
  });
}

export async function updateRestaurantImage(id, buffer) {
  const imageUrl = await optimizeImage(buffer, 'restaurants');
 
  return prisma.restaurant.update({
    where: { id },
    data: { imageUrl },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}