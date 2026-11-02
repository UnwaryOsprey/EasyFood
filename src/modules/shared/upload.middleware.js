import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Formato de imagem não permitido'));
    }

    callback(null, true);
  }
});

// Envolve o multer para devolver status HTTP adequados (Parte 16 do PDF)
export function uploadSingleImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Imagem maior que o limite de 5 MB' });
    }

    return res.status(400).json({ error: error.message || 'Erro no upload' });
  });
}

export default upload;
