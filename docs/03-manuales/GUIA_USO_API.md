# Guía de Uso de la API REST - VinCloud

> **Documentación de Integración y Pruebas de la API**  
> Proyecto: VinCloud (PaaS - Almacenamiento en la Nube)  
> Base URL: `http://localhost:5000/api`  
> Formato de datos: `application/json` (excepto subida: `multipart/form-data` y descarga: stream binario)

---

## 1. Introducción y Convenciones Generales

### 1.1. Autenticación
Los endpoints protegidos requieren el envío del token JWT en el encabezado HTTP:
```http
Authorization: Bearer <TU_TOKEN_JWT>
```

### 1.2. Códigos de Estado HTTP
* `200 OK`: Operación exitosa (lecturas, actualizaciones, descargas, eliminaciones).
* `201 Created`: Recurso creado exitosamente (registro de usuario, carpeta creada, archivo subido).
* `400 Bad Request`: Parámetros inválidos, validaciones fallidas o cuota de almacenamiento insuficiente.
* `401 Unauthorized`: Token ausente, expirado o credenciales incorrectas.
* `404 Not Found`: Recurso (archivo, carpeta, usuario) no encontrado o sin pertenencia al usuario solicitante.
* `409 Conflict`: Conflicto de unicidad (por ejemplo, correo ya registrado).
* `500 Internal Server Error`: Error no controlado del servidor (mensaje genérico seguro).

---

## 2. Endpoints del Módulo de Autenticación (`/api/auth`)

### 2.1. Registro de Usuario
Crea una cuenta en la plataforma, asigna por defecto 5 GB de cuota y despacha correos de bienvenida y verificación.

* **Método:** `POST`
* **Endpoint:** `/auth/register`
* **Autenticación:** Pública

#### Petición (JSON):
```json
{
  "nombre": "Carlos Alvarado",
  "correo": "carlos.alvarado@correo.com",
  "contrasena": "ClaveSegura123",
  "tipoCuenta": "Usuario"
}
```
*(Nota: `tipoCuenta` puede ser `"Usuario"` o `"Administrador"`. Si se omite, se asigna `"Usuario"`).*

#### Respuesta Exitosa (`201 Created`):
```json
{
  "message": "Usuario registrado exitosamente. Se ha enviado un correo para verificar tu cuenta.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Carlos Alvarado",
    "correo": "carlos.alvarado@correo.com",
    "rol": "Usuario",
    "nivelAcceso": "estandar",
    "correoVerificado": false,
    "espacioConsumido": 0,
    "espacioDisponible": 5368709120,
    "fechaRegistro": "2026-10-14"
  }
}
```

---

### 2.2. Inicio de Sesión
Autentica las credenciales del usuario y emite un token de sesión JWT de 7 días.

* **Método:** `POST`
* **Endpoint:** `/auth/login`
* **Autenticación:** Pública

#### Petición (JSON):
```json
{
  "correo": "carlos.alvarado@correo.com",
  "contrasena": "ClaveSegura123"
}
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Carlos Alvarado",
    "correo": "carlos.alvarado@correo.com",
    "rol": "Usuario",
    "nivelAcceso": "estandar",
    "correoVerificado": false,
    "espacioConsumido": 0,
    "espacioDisponible": 5368709120
  }
}
```

---

### 2.3. Perfil del Usuario Autenticado
Consulta los datos del usuario en sesión, incluyendo el uso de cuota actualizado.

* **Método:** `GET`
* **Endpoint:** `/auth/me`
* **Autenticación:** Requerida (`Bearer`)

#### Respuesta Exitosa (`200 OK`):
```json
{
  "user": {
    "id": 1,
    "nombre": "Carlos Alvarado",
    "correo": "carlos.alvarado@correo.com",
    "rol": "Usuario",
    "nivelAcceso": "estandar",
    "correoVerificado": true,
    "espacioConsumido": 104857600,
    "espacioDisponible": 5368709120
  }
}
```

---

## 3. Endpoints del Módulo de Almacenamiento (`/api/storage`)

Todos los endpoints de almacenamiento requieren el encabezado `Authorization: Bearer <TOKEN>`.

### 3.1. Subir Archivo
Sube un archivo binario. El backend valida el tipo MIME, tamaño (< 100 MB), espacio disponible en el plan del usuario y actualiza atómicamente `espacio_consumido`.

* **Método:** `POST`
* **Endpoint:** `/storage/upload`
* **Content-Type:** `multipart/form-data`

#### Campos del Formulario:
* `archivo` *(File, requerido)*: El archivo a subir.
* `carpetaId` *(Number, opcional)*: ID de la carpeta contenedora. Si se omite, se guarda en la raíz.

#### Ejemplo con cURL:
```bash
curl -X POST http://localhost:5000/api/storage/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "archivo=@./documento.pdf" \
  -F "carpetaId=3"
```

#### Ejemplo con JavaScript (FormData + Fetch):
```javascript
const formData = new FormData();
formData.append('archivo', fileInput.files[0]);
formData.append('carpetaId', 3); // Opcional

const res = await fetch('http://localhost:5000/api/storage/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
const data = await res.json();
```

#### Respuesta Exitosa (`201 Created`):
```json
{
  "message": "Archivo subido exitosamente.",
  "archivo": {
    "id": 12,
    "usuario_id": 1,
    "carpeta_id": 3,
    "nombre": "documento.pdf",
    "tamano": 2048500,
    "tipo": "application/pdf",
    "fecha_subida": "2026-10-14"
  }
}
```

#### Posibles Respuestas de Error:
* `400 Bad Request`:
  ```json
  { "error": "Espacio de almacenamiento insuficiente. Disponible: 500000 bytes, requerido: 2048500 bytes." }
  ```
* `400 Bad Request` (archivo ejecutable peligroso):
  ```json
  { "error": "El tipo de archivo (.exe) no está permitido por motivos de seguridad." }
  ```
* `404 Not Found`:
  ```json
  { "error": "La carpeta especificada no existe o no tienes permisos para acceder a ella." }
  ```

---

### 3.2. Listar Contenido de un Directorio (Carpetas y Archivos)
Devuelve en paralelo las carpetas hijas y los archivos contenidos en el nivel especificado.

* **Método:** `GET`
* **Endpoint:** `/storage/files`
* **Parámetros de Consulta (Query Params):**
  * `carpetaId` *(opcional)*: ID de la carpeta a consultar. Si no se envía, lista el directorio **raíz**.

#### Ejemplo con cURL:
```bash
# Listar directorio raíz
curl -X GET http://localhost:5000/api/storage/files \
  -H "Authorization: Bearer <TOKEN>"

# Listar carpeta con ID 3
curl -X GET "http://localhost:5000/api/storage/files?carpetaId=3" \
  -H "Authorization: Bearer <TOKEN>"
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "carpetaActual": {
    "id": 3,
    "usuario_id": 1,
    "carpeta_padre_id": null,
    "nombre": "Documentos 2026",
    "fecha_creacion": "2026-10-14"
  },
  "carpetas": [
    {
      "id": 4,
      "usuario_id": 1,
      "carpeta_padre_id": 3,
      "nombre": "Facturas",
      "fecha_creacion": "2026-10-14",
      "total_elementos": 5
    }
  ],
  "archivos": [
    {
      "id": 12,
      "usuario_id": 1,
      "carpeta_id": 3,
      "nombre": "documento.pdf",
      "tamano": 2048500,
      "tipo": "application/pdf",
      "fecha_subida": "2026-10-14"
    }
  ]
}
```

---

### 3.3. Descargar Archivo
Transfiere el archivo binario mediante streaming seguro con cabeceras `Content-Disposition`.

* **Método:** `GET`
* **Endpoint:** `/storage/files/:id/download`

#### Ejemplo con cURL:
```bash
curl -X GET http://localhost:5000/api/storage/files/12/download \
  -H "Authorization: Bearer <TOKEN>" \
  -O -J
```

#### Ejemplo con JavaScript (Navegador):
```javascript
const response = await fetch(`http://localhost:5000/api/storage/files/${fileId}/download`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
const downloadUrl = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = downloadUrl;
a.download = 'nombre_original.pdf';
document.body.appendChild(a);
a.click();
a.remove();
```

---

### 3.4. Renombrar Archivo
* **Método:** `PATCH`
* **Endpoint:** `/storage/files/:id`
* **Cuerpo (JSON):**
```json
{
  "nuevoNombre": "reporte_financiero_final.pdf"
}
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "message": "Archivo renombrado exitosamente.",
  "archivo": {
    "id": 12,
    "usuario_id": 1,
    "carpeta_id": 3,
    "nombre": "reporte_financiero_final.pdf",
    "tamano": 2048500,
    "tipo": "application/pdf",
    "fecha_subida": "2026-10-14"
  }
}
```

---

### 3.5. Eliminar Archivo
Elimina el registro de la base de datos, borra el archivo físico en disco y descuenta los bytes del `espacio_consumido`.

* **Método:** `DELETE`
* **Endpoint:** `/storage/files/:id`

#### Respuesta Exitosa (`200 OK`):
```json
{
  "message": "Archivo eliminado exitosamente.",
  "id": 12,
  "nombre": "reporte_financiero_final.pdf",
  "tamanoLiberado": 2048500
}
```

---

### 3.6. Consultar Archivos Recientes
Diseñado para alimentar la pestaña **"Recientes"** del panel.

* **Método:** `GET`
* **Endpoint:** `/storage/files/recent`
* **Query Params:**
  * `limit` *(opcional, default: 10)*: Cantidad de archivos a obtener.

#### Respuesta Exitosa (`200 OK`):
```json
{
  "archivos": [
    {
      "id": 12,
      "usuario_id": 1,
      "carpeta_id": 3,
      "nombre": "reporte_financiero_final.pdf",
      "tamano": 2048500,
      "tipo": "application/pdf",
      "fecha_subida": "2026-10-14"
    }
  ]
}
```

---

### 3.7. Buscar Archivos
Búsqueda insensible a mayúsculas/minúsculas sobre el nombre de los archivos del usuario (`ILIKE`).

* **Método:** `GET`
* **Endpoint:** `/storage/files/search`
* **Query Params:**
  * `q` *(requerido)*: Término de búsqueda (ej. `?q=reporte`).

#### Respuesta Exitosa (`200 OK`):
```json
{
  "archivos": [
    {
      "id": 12,
      "usuario_id": 1,
      "carpeta_id": 3,
      "nombre": "reporte_financiero_final.pdf",
      "tamano": 2048500,
      "tipo": "application/pdf",
      "fecha_subida": "2026-10-14"
    }
  ]
}
```

---

### 3.8. Crear Carpeta
* **Método:** `POST`
* **Endpoint:** `/storage/folders`
* **Cuerpo (JSON):**
```json
{
  "nombre": "Proyectos Universidad",
  "carpetaPadreId": null
}
```
*(Para crear una subcarpeta dentro de otra, enviar el ID de la carpeta padre en `carpetaPadreId`).*

#### Respuesta Exitosa (`201 Created`):
```json
{
  "message": "Carpeta creada exitosamente.",
  "carpeta": {
    "id": 5,
    "usuario_id": 1,
    "carpeta_padre_id": null,
    "nombre": "Proyectos Universidad",
    "fecha_creacion": "2026-10-14"
  }
}
```

---

### 3.9. Renombrar Carpeta
* **Método:** `PATCH`
* **Endpoint:** `/storage/folders/:id`
* **Cuerpo (JSON):**
```json
{
  "nuevoNombre": "Proyectos 2026"
}
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "message": "Carpeta renombrada exitosamente.",
  "carpeta": {
    "id": 5,
    "usuario_id": 1,
    "carpeta_padre_id": null,
    "nombre": "Proyectos 2026",
    "fecha_creacion": "2026-10-14"
  }
}
```

---

### 3.10. Eliminar Carpeta (Recursiva)
Elimina la carpeta, todas sus subcarpetas y archivos contenidos, liberando el total acumulado de bytes en disco y cuota.

* **Método:** `DELETE`
* **Endpoint:** `/storage/folders/:id`

#### Respuesta Exitosa (`200 OK`):
```json
{
  "message": "Carpeta y sus contenidos eliminados exitosamente.",
  "id": 5,
  "nombre": "Proyectos 2026",
  "bytesLiberados": 15420000
}
```

---

## 4. Ejemplos de Integración Frontend (Axios / Fetch)

### Cliente de Almacenamiento Sugerido (`Front_/src/services/storageService.js`)

```javascript
const BASE_URL = 'http://localhost:5000/api/storage';

function authHeaders(isMultipart = false) {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function fetchDirectory(carpetaId = null) {
  const url = carpetaId ? `${BASE_URL}/files?carpetaId=${carpetaId}` : `${BASE_URL}/files`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function uploadFile(file, carpetaId = null) {
  const formData = new FormData();
  formData.append('archivo', file);
  if (carpetaId) formData.append('carpetaId', carpetaId);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: authHeaders(true),
    body: formData
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function createFolder(nombre, carpetaPadreId = null) {
  const res = await fetch(`${BASE_URL}/folders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ nombre, carpetaPadreId })
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteFile(id) {
  const res = await fetch(`${BASE_URL}/files/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
```
