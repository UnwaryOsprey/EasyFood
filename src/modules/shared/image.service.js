import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
 
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// src/modules/shared -> raiz do projeto -> uploads
const UPLOADS_ROOT = path.resolve(__dirname, '../../../uploads');
 
// Serviço genérico: não conhece "prato" nem "restaurante".
// Quem chama diz em qual pasta salvar (dishes, restaurants...).
export async function optimizeImage(buffer, folder = 'dishes') {
  const filename = `${crypto.randomUUID()}.webp`;
  const directory = path.join(UPLOADS_ROOT, folder);
 
  await fs.mkdir(directory, { recursive: true });
 
  await sharp(buffer)
    .rotate()                                          // corrige orientação
    .resize({ width: 800, withoutEnlargement: true })  // até 800px de largura
    .webp({ quality: 80 })                             // converte para WebP
    .toFile(path.join(directory, filename));
 
  return `/uploads/${folder}/${filename}`;
}
