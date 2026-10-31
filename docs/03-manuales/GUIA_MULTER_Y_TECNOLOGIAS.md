# Guía Técnica: Implementación de Multer y Tecnologías Recomendadas para VinCloud

> **Documento Técnico de Referencia**  
> Proyecto: Plataforma como Servicio (PaaS) - Almacenamiento en la Nube (*VinCloud*)  
> Audiencia: Desarrolladores del equipo y agentes de soporte de código.

---

## 1. Introducción

VinCloud es una plataforma PaaS orientada a **Almacenamiento como Servicio (Storage as a Service)**. El núcleo funcional de la aplicación requiere procesar cargas binarias (*uploads*), validar tipos de datos, gestionar cuotas de usuario en bytes, organizar jerarquías de carpetas y despachar descargas seguras.

Esta guía detalla la implementación recomendada de **`multer`** (ya presente en las dependencias del proyecto) junto con librerías complementarias y patrones de arquitectura idóneos para este sistema.

---

## 2. Multer: Carga y Gestión de Archivos

`multer` es el middleware estándar de Node.js/Express para procesar peticiones multiparte (`multipart/form-data`).

### 2.1. Estrategias de Almacenamiento: ¿Disco o Base de Datos?

En `Contexto_LLM.md` y `README.md` se menciona que PostgreSQL puede gestionar datos y binarios. Existen dos enfoques:

| Estrategia | Configuración Multer | Pros | Contras | Recomendación para VinCloud |
| :--- | :--- | :--- | :--- | :--- |
| **En Disco / Volumen Docker** | `multer.diskStorage()` | • Excelente rendimiento de E/S.<br>• No sobrecarga la memoria RAM de Node.js ni la BD.<br>• Permite streaming nativo. | • Requiere gestionar rutas físicas y montar volúmenes persistentes en Docker. | **Altamente Recomendada** (Especialmente para archivos > 10 MB). |
| **En BD PostgreSQL (`BYTEA`)** | `multer.memoryStorage()` | • El archivo viaja junto a sus metadatos en una sola transacción SQL ACID.<br>• Backups centralizados en la BD. | • Alto consumo de memoria RAM de Node al recibir el buffer (`req.file.buffer`).<br>• Crecimiento rápido del tamaño de la base de datos. | **Viable para archivos pequeños** (< 5 MB) o si el requerimiento académico exige todo en PostgreSQL. |

---

### 2.2. Implementación Recomendada: `multer.diskStorage()`

#### Paso 1: Configurar el middleware (`Back_/src/config/multer.js` o `Back_/src/middlewares/uploadMiddleware.js`)

```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Directorio físico de almacenamiento (ej. Back_/uploads)
const UPLOAD_DIR = path.resolve('uploads');

// Asegurar que la carpeta exista
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar colisiones: [timestamp]-[randomUUID][ext]
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Filtro de validación preventiva de extensiones / tipos MIME
const fileFilter = (req, file, cb) => {
  // Lista de tipos peligrosos que no deben ejecutarse en el servidor
  const forbiddenExtensions = ['.exe', '.sh', '.bat', '.cmd', '.vbs'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (forbiddenExtensions.includes(ext)) {
    return cb(new Error('Tipo de archivo no permitido por motivos de seguridad.'), false);
  }

  cb(null, true);
};

// Instancia configurada de Multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Límite por archivo individual (ej. 100 MB)
    files: 10 // Máximo 10 archivos por petición
  },
  fileFilter
});
```

---

### 2.3. Implementación Alternativa: `multer.memoryStorage()` (para binario `BYTEA` en PostgreSQL)

Si se guardan los bytes en una columna `BYTEA` de PostgreSQL:

```javascript
import multer from 'multer';

const memoryStorage = multer.memoryStorage();

export const uploadMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB máximo para evitar agotar la RAM
  }
});
```

En el controlador:
```javascript
// req.file.buffer contiene los bytes en memoria Buffer
const fileBuffer = req.file.buffer;
const fileSize = req.file.size;
const mimeType = req.file.mimetype;

await query(
  `INSERT INTO archivo (usuario_id, carpeta_id, nombre, tamano, tipo, contenido_binario)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [userId, carpetaId, req.file.originalname, fileSize, mimeType, fileBuffer]
);
```

---

### 2.4. Flujo Completo: Subida con Validación de Cuota (UML Activity Diagram)

Según el **Diagrama de Actividad - Subida de Archivos** (`docs/02-diseno/UML/Diagrama sin título-Actividad Subida de Archivos.drawio.png`), el backend debe:
1. Recibir archivo.
2. Validar archivo y cuota disponible.
3. Guardar archivo y registrar metadata en BD.
4. Actualizar `espacio_consumido` del usuario en la tabla `usuario`.
5. Confirmar operación.

#### Ejemplo de Controlador (`Back_/src/controllers/storageController.js`):

```javascript
import { query } from '../config/db.js';
import fs from 'fs/promises';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debes seleccionar un archivo para subir.' });
    }

    const userId = req.user.id;
    const { carpetaId } = req.body; // Puede ser null para raíz
    const fileSize = req.file.size;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;

    // 1. Validar cuota de almacenamiento del usuario
    const userRes = await query(
      'SELECT espacio_consumido, espacio_disponible FROM usuario WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      // Si falla, limpiar archivo subido
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const { espacio_consumido, espacio_disponible } = userRes.rows[0];
    const nuevoConsumo = Number(espacio_consumido) + fileSize;

    if (nuevoConsumo > Number(espacio_disponible)) {
      // Eliminar el archivo del disco para no dejar huérfanos
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: 'Espacio insuficiente en tu plan de almacenamiento.',
        espacioDisponible: Number(espacio_disponible) - Number(espacio_consumido),
        tamanoArchivo: fileSize
      });
    }

    // 2. Insertar metadatos en tabla 'archivo'
    const insertRes = await query(
      `INSERT INTO archivo (usuario_id, carpeta_id, nombre, tamano, tipo, fecha_subida)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
       RETURNING id, nombre, tamano, tipo, fecha_subida`,
      [userId, carpetaId || null, originalName, fileSize, mimeType]
    );

    // 3. Actualizar espacio consumido del usuario
    await query(
      'UPDATE usuario SET espacio_consumido = espacio_consumido + $1 WHERE id = $2',
      [fileSize, userId]
    );

    return res.status(201).json({
      message: 'Archivo subido exitosamente.',
      archivo: insertRes.rows[0]
    });
  } catch (error) {
    // Limpieza de emergencia en disco si falló la BD
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};
```

---

### 2.5. Descarga de Archivos (`res.download` y Streaming)

```javascript
import path from 'path';
import fs from 'fs';

export const downloadFile = async (req, res, next) => {
  try {
    const { archivoId } = req.params;
    const userId = req.user.id;

    const fileRes = await query(
      'SELECT nombre, tipo FROM archivo WHERE id = $1 AND usuario_id = $2',
      [archivoId, userId]
    );

    if (fileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado o no tienes permisos.' });
    }

    const file = fileRes.rows[0];
    const physicalPath = path.resolve('uploads', file.nombre_fisico); // o usar id como nombre

    if (!fs.existsSync(physicalPath)) {
      return res.status(404).json({ error: 'El archivo físico no se encuentra en el servidor.' });
    }

    // res.download maneja automáticamente headers de Content-Disposition
    return res.download(physicalPath, file.nombre);
  } catch (error) {
    next(error);
  }
};
```

---

## 3. Tecnologías Complementarias Recomendadas

Para un PaaS de almacenamiento robusto, moderno y con los requerimientos de VinCloud, se recomiendan las siguientes herramientas:

### 3.1. Detección Segura de Archivos
* **`file-type`** (`npm install file-type`):
  * **Problema que resuelve:** Un usuario malintencionado puede subir un archivo ejecutable `.exe` y renombrarlo como `foto.png`.
  * **Solución:** Lee los *Magic Bytes* (primeros 4-8 bytes binarios) para verificar el formato real del archivo antes de aceptarlo.

### 3.2. Compresión y Descarga en Lote
* **`archiver`** (`npm install archiver`):
  * **Uso en VinCloud:** Permite que un cliente descargue una carpeta entera o múltiples archivos seleccionados comprimidos en un archivo `.zip` mediante streaming continuo, sin tener que comprimir todo en disco primero.

### 3.3. Optimización de Imágenes y Miniaturas
* **`sharp`** (`npm install sharp`):
  * **Uso en VinCloud:** En la vista de "Mis Archivos" (según los mockups de Figma), cargar miniaturas de 50 imágenes de 10 MB saturaría el navegador. Con `sharp`, al subir una imagen se puede generar un thumbnail ligero de 150x150 px para la vista de cuadrícula.

### 3.4. Seguridad y Límites de Tasa
* **`express-rate-limit`** (`npm install express-rate-limit`):
  * **Uso en VinCloud:** Previene ataques de fuerza bruta en `/api/auth/login` y saturación de ancho de banda o ataques DoS en endpoints de subida `/api/storage/upload`.

### 3.5. Enlaces de Invitación Temporales
* **`nanoid`** (`npm install nanoid`):
  * **Uso en VinCloud:** Generación de identificadores cortos y URL-friendly para enlaces de invitación compartidos (ej. `https://vincloud.app/share/xK9_mQ2`), según el caso de uso *"Aceptar enlace de invitación"* de `docs/02-diseno/UML/DiagramaCasosDeUso.drawio.png`.

---

## 4. Resumen de Prácticas Esenciales

1. **Nunca guardar con el nombre original en disco:** Siempre generar nombres únicos (`crypto.randomUUID()`) para evitar colisiones (`reporte.pdf` de dos usuarios distintos).
2. **Atomicidad de Cuotas:** Siempre descontar o sumar bytes dentro de la transacción de subida o eliminación.
3. **Limpieza de Archivos Huérfanos:** Si la inserción en la base de datos falla luego de que Multer guardó el archivo en disco, eliminar el archivo físico en el bloque `catch`.
4. **Volúmenes en Docker:** Si la aplicación se despliega en contenedores Docker, montar la carpeta `uploads` como un volumen persistente (`volumes: - ./uploads:/app/uploads`) para no perder archivos al reiniciar contenedores.
