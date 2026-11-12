import { updateUserImage } from './user.service.js';

export async function uploadMyImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    // O id vem do token (req.user), nunca do corpo: o usuário só altera a própria foto
    const user = await updateUserImage(req.user.id, req.file.buffer);
    return res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    console.error('Erro ao enviar foto de perfil:', error);
    return res.status(500).json({ error: 'Erro ao processar imagem' });
  }
}
