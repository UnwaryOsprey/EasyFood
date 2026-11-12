import prisma from '../../lib/prisma.js';
import { optimizeImage } from '../shared/image.service.js';

// Atualiza a foto de perfil do usuário logado.
// Reutiliza o serviço compartilhado de imagens (pasta "users").
export async function updateUserImage(userId, buffer) {
  const imageUrl = await optimizeImage(buffer, 'users');

  return prisma.user.update({
    where: { id: userId },
    data: { imageUrl },
    select: { id: true, name: true, email: true, imageUrl: true }
  });
}
