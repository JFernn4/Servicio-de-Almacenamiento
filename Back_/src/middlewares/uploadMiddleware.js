import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { MAX_FILE_SIZE_BYTES, FORBIDDEN_FILE_EXTENSIONS } from '../config/constants.js';
import { HttpError } from '../utils/httpError.js';

// Asegurar que el directorio de almacenamiento exista
const uploadDir = config.storage.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nombre único en disco para evitar colisiones: [timestamp]-[uuid].[ext]
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// Filtro de seguridad para extensiones potencialmente ejecutables
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (FORBIDDEN_FILE_EXTENSIONS.includes(extension)) {
    return cb(
      new HttpError(400, `El tipo de archivo (${extension}) no está permitido por motivos de seguridad.`),
      false
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

/**
 * Middleware para procesar la subida de un solo archivo.
 * Traduce errores de Multer a HttpError con mensajes legibles.
 */
export function handleSingleUpload(fieldName = 'archivo') {
  const single = upload.single(fieldName);

  return (req, res, next) => {
    single(req, res, (err) => {
      if (!err) {
        return next();
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new HttpError(
              400,
              `El archivo excede el tamaño máximo permitido (${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB).`
            )
          );
        }
        return next(new HttpError(400, `Error en la subida: ${err.message}`));
      }

      return next(err);
    });
  };
}
