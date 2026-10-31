import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { MAX_FILE_SIZE_BYTES, FORBIDDEN_FILE_EXTENSIONS } from '../config/constants.js';
import { resolveUserPlanDecorator } from '../services/subscriptionService.js';
import { PlanGratuito } from '../patterns/planDecorator.js';
import { HttpError } from '../utils/httpError.js';

// Asegurar que el directorio de almacenamiento exista
const uploadDir = config.storage.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento en disco (provisional y desacoplada para futura migración)
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

/**
 * Corrige la codificación latin1 por defecto de Busboy/Multer a UTF-8 (para tildes y ñ).
 */
function normalizeFilename(name = '') {
  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    return decoded.includes('\uFFFD') ? name : decoded;
  } catch {
    return name;
  }
}

// Filtro de seguridad para extensiones potencialmente ejecutables y nombres válidos
const fileFilter = (req, file, cb) => {
  file.originalname = path.basename(normalizeFilename(file.originalname)).trim();

  if (!file.originalname || file.originalname.length > 255) {
    return cb(
      new HttpError(400, 'El nombre del archivo no es válido o excede los 255 caracteres.'),
      false
    );
  }

  const extension = path.extname(file.originalname).toLowerCase();
  if (FORBIDDEN_FILE_EXTENSIONS.includes(extension)) {
    return cb(
      new HttpError(400, `El tipo de archivo (${extension}) no está permitido por motivos de seguridad.`),
      false
    );
  }
  cb(null, true);
};

// Instancia base por defecto (para compatibilidad estática)
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

/**
 * Limpia archivos temporales que Multer haya alcanzado a escribir en disco si un lote falla.
 */
async function cleanupUploadedFiles(req) {
  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
  await Promise.all(
    files.map((f) => (f?.path ? fsPromises.unlink(f.path).catch(() => {}) : Promise.resolve()))
  );
}

/**
 * Middleware dinámico de Multer gobernado por el Patrón Decorator (DiagramaDecorator).
 * Consulta el Plan decorado del usuario (PlanGratuito, PlanBasico, Profesional o Empresarial)
 * y ajusta dinámicamente en tiempo de ejecución:
 *   - limits.fileSize (10 MB -> 50 MB -> 250 MB -> 1 GB)
 *   - limits.files    (1 -> 3 -> 10 -> 25 archivos por petición)
 */
export function handleSingleUpload(fieldName = 'archivo') {
  return async (req, res, next) => {
    try {
      let planDecorado = new PlanGratuito();
      let suscripcionActual = null;

      if (req.user?.id) {
        const resolved = await resolveUserPlanDecorator(req.user.id);
        planDecorado = resolved.planDecorado;
        suscripcionActual = resolved.suscripcionActual;
      }

      req.planDecorado = planDecorado;
      req.suscripcionActiva = suscripcionActual;

      const politica = planDecorado.obtenerPoliticaMulter();
      const maxMb = Number((politica.maxFileSizeBytes / (1024 * 1024)).toFixed(0));

      const dynamicUpload = multer({
        storage,
        limits: {
          fileSize: politica.maxFileSizeBytes,
          files: politica.maxFiles,
        },
        fileFilter,
      }).any();

      dynamicUpload(req, res, async (err) => {
        if (!err) {
          // Filtrar solo los campos esperados ('archivo' o 'archivos') y mantener compatibilidad con req.file
          const uploadedList = Array.isArray(req.files)
            ? req.files.filter((f) => f.fieldname === fieldName || f.fieldname === 'archivos')
            : [];

          req.files = uploadedList;
          req.file = uploadedList[0] || undefined;
          return next();
        }

        await cleanupUploadedFiles(req);

        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(
              new HttpError(
                400,
                `[Multer Dinámico - ${planDecorado.constructor.name}] El archivo excede el tamaño máximo permitido por tu plan actual (${maxMb} MB). Mejora tu suscripción para subir archivos más pesados.`
              )
            );
          }

          if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(
              new HttpError(
                400,
                `[Multer Dinámico - ${planDecorado.constructor.name}] Tu plan actual permite subir máximo ${politica.maxFiles} archivo(s) simultáneamente. Mejora tu suscripción para habilitar cargas múltiples mayores.`
              )
            );
          }

          return next(new HttpError(400, `Error en la subida (${err.code}): ${err.message}`));
        }

        return next(err);
      });
    } catch (error) {
      next(error);
    }
  };
}
