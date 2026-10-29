# Guía de despliegue (gratis): Render + Supabase + Brevo

Despliegue de VinCloud para la exposición, **todo en planes gratuitos**.

| Pieza | Servicio | Qué lo configura |
|---|---|---|
| Frontend (React) | Render, sitio estático `vincloud-web` | `render.yaml` |
| Backend (Express en Docker) | Render, servicio web `vincloud-api` | `render.yaml` + `Back_/Dockerfile` |
| Base de datos (PostgreSQL) | Supabase | `database/` (se carga una vez) |
| Archivos subidos | Supabase Storage | Patrón Bridge (`Back_/src/patterns/storageBridge/`) |
| Correos | Brevo SMTP, **puerto 2525** | Variables del backend |

> **Por qué los archivos van a Supabase y no al disco:** en Render gratis el disco **se borra** con cada reinicio o despliegue, y el servidor se reinicia cada vez que se duerme. Por eso el backend usa el **patrón Bridge**: la misma lógica (cuotas, papelera, carpetas, compartir) guarda los bytes en el disco local cuando trabajan en su PC (`STORAGE_DRIVER=local`) o en Supabase Storage en producción (`STORAGE_DRIVER=supabase`). La sección 7 lo explica.

---

## 1. Límites del plan gratuito (importante para la exposición)

| Servicio | Límite | Qué significa |
|---|---|---|
| Render (backend) | **Se duerme tras 15 min sin uso**; tarda ~1 min en despertar | Abran la app **2–3 minutos antes** de exponer |
| Render | El disco se borra al reiniciar | Por eso los archivos van a Supabase |
| Render | Bloquea los puertos de correo 25, 465 y 587 | Por eso Brevo va por el **2525** |
| Supabase | Base de datos de 500 MB, **1 GB de archivos en total** | Suficiente para la demo |
| Supabase | **Máximo 50 MB por archivo** | El backend rechaza archivos mayores (`MAX_UPLOAD_MB=50`) aunque el plan diga más |
| Supabase | **Se pausa tras 1 semana sin uso** | Si pasó una semana, entren al panel de Supabase y denle *Restore* |

El frontend sigue mostrando los límites de cada plan (10 MB, 50 MB, 250 MB, 1 GB). En este servidor el tope real es 50 MB, y si alguien lo supera el backend responde: *"El archivo excede el límite de 50 MB por archivo de este servidor."*

---

## 2. Supabase: base de datos y almacenamiento

### 2.1 Crear el proyecto
1. En [supabase.com](https://supabase.com) → **New project**. Elijan una región cercana (por ejemplo, *East US*) y **guarden la contraseña de la base de datos**.

### 2.2 Crear las tablas
2. Abran **SQL Editor** → **New query**.
3. Copien todo el contenido de `database/inicializacion/schema.sql`, péguenlo y denle **Run**.
4. Repitan con `database/datos-iniciales/seed.sql` (roles y planes).
5. Verifiquen en **Table Editor** que existan `usuario`, `rol`, `plan`, `suscripcion`, `pago`, `carpeta` y `archivo`.

### 2.3 Crear el bucket de archivos
6. Abran **Storage** → **New bucket**:
   - Nombre: `archivos`
   - **Public bucket: desactivado** (privado: los archivos se entregan siempre a través del backend, que valida la sesión o el enlace compartido)
   - Restrict file size: **50 MB**

### 2.4 Copiar los datos de conexión
7. **Project Settings → API**:
   - **Project URL** → será `SUPABASE_URL`
   - **service_role** (en *Project API keys*, "secret") → será `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ La `service_role` da acceso total al proyecto: va **solo** en las variables de Render, **nunca** en el frontend, en GitHub ni en un chat.
8. Botón **Connect** (arriba) → pestaña **Session pooler** → copien la URI y reemplacen `[YOUR-PASSWORD]` por la contraseña del paso 1. Esa URI será `DATABASE_URL`.

   ⚠️ Usen **Session pooler**, no *Direct connection*: la conexión directa solo funciona por IPv6, y Render gratis no tiene IPv6, así que el backend no podría conectarse.

---

## 3. Brevo: correos

Usen la cuenta de Brevo que ya les funciona. Solo cambia el puerto:

| Variable | Valor |
|---|---|
| `SMTP_HOST` | `smtp-relay.brevo.com` (ya viene en `render.yaml`) |
| `SMTP_PORT` | `2525` (ya viene en `render.yaml`) |
| `SMTP_USER` | El usuario SMTP de Brevo (el de su `.env` actual) |
| `SMTP_PASS` | La clave SMTP de Brevo (la de su `.env` actual) |
| `EMAIL_FROM` | Un remitente **verificado** en esa cuenta de Brevo |

Para probar el puerto antes de desplegar: en su `Back_/.env` pongan `SMTP_PORT=2525` y, en `Back_`, ejecuten `npm run test:email`.

Si el correo falla, la app sigue funcionando: los enlaces de verificación y recuperación aparecen en los **Logs** del backend en Render.

---

## 4. Render: backend y frontend

El archivo `render.yaml` crea los dos servicios de una vez (es un *Blueprint*).

1. Suban a GitHub la rama que tenga `render.yaml` (normalmente `main`).
2. En [render.com](https://render.com) → **New** → **Blueprint** → conecten GitHub y elijan el repositorio `Servicio-de-Almacenamiento`.
3. Render muestra los dos servicios (`vincloud-api` y `vincloud-web`) y **pide las variables secretas**. Llénenlas así:

| Variable | Servicio | Valor |
|---|---|---|
| `DATABASE_URL` | vincloud-api | URI del **Session pooler** de Supabase (paso 2.4) |
| `SUPABASE_URL` | vincloud-api | Project URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | vincloud-api | service_role de Supabase |
| `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | vincloud-api | Los de Brevo (paso 3) |
| `CORS_ORIGIN` | vincloud-api | URL del frontend, por ejemplo `https://vincloud-web.onrender.com` |
| `FRONTEND_URL` | vincloud-api | La misma URL del frontend |
| `VITE_API_URL` | vincloud-web | URL del backend **terminada en `/api`**, por ejemplo `https://vincloud-api.onrender.com/api` |

Render asigna las URL `https://<nombre>.onrender.com`. Si el nombre ya estaba ocupado, le agrega letras (por ejemplo `vincloud-api-x7k2`). Por eso:

4. Denle **Apply** y esperen a que terminen los dos despliegues.
5. Abran cada servicio y **copien su URL real**. Si es distinta de la que pusieron:
   - en **vincloud-api → Environment**, corrijan `CORS_ORIGIN` y `FRONTEND_URL` y guarden (se redespliega solo);
   - en **vincloud-web → Environment**, corrijan `VITE_API_URL` y luego **Manual Deploy → Clear build cache & deploy**, porque el frontend lee esa variable **al compilar**.

`JWT_SECRET` lo genera Render automáticamente; no lo tienen que inventar.

---

## 5. Verificar que todo funciona

1. Abran `https://<backend>.onrender.com/api/health`. Debe responder `"status":"ok","database":"connected"`. La primera vez puede tardar ~1 minuto, porque el servidor estaba dormido.
2. En **vincloud-api → Logs** debe aparecer `[Almacenamiento] supabase · máximo 50 MB por archivo`.
3. Abran el frontend, **regístrense** y revisen que llegue el correo de verificación.
4. Suban un archivo y verifiquen que aparece en **Supabase → Storage → archivos** con el nombre `<id>.<extensión>`.
5. Descárguenlo, compártanlo, muévanlo a la papelera y vacíenla. En Supabase debe desaparecer.

### Crear un administrador
No hay pantalla para eso. Regístrense normalmente y luego, en **Supabase → SQL Editor**, ejecuten (con su correo):

```sql
UPDATE usuario
SET rol_id = (SELECT id FROM rol WHERE nombre = 'Administrador')
WHERE correo = 'su_correo@ejemplo.com';
```

Cierren sesión y vuelvan a entrar.

---

## 6. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El backend no arranca: *"STORAGE_DRIVER=supabase requiere SUPABASE_URL…"* | Faltan las credenciales de Supabase | Revisar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Render |
| `/api/health` responde `database: disconnected` | `DATABASE_URL` mal copiada, o se usó *Direct connection* | Usar la URI del **Session pooler** con la contraseña correcta |
| El frontend dice "No se pudo conectar con el servidor" | `VITE_API_URL` incorrecta, o el backend estaba dormido | Revisar que termine en `/api`, recompilar el frontend y esperar 1 minuto |
| Error de CORS en la consola del navegador | `CORS_ORIGIN` no coincide con la URL del frontend | Copiar la URL exacta, sin `/` al final |
| *"Supabase Storage: no se pudo subir…"* | El bucket no existe, el nombre no coincide, o la clave no es la service_role | Bucket `archivos` y clave service_role |
| No llegan los correos | Puerto distinto de 2525 o remitente no verificado en Brevo | `SMTP_PORT=2525`; los enlaces también están en los Logs |
| La app tarda en abrir | Render despertando | Normal en el plan gratis: esperar ~1 minuto |

---

## 7. Patrón Bridge en el almacenamiento

```
                 ABSTRACCIÓN                         IMPLEMENTADOR
  storageService ──► FileStorage ──── provider ────► StorageProvider
  adminService       store / open                    put / get / delete / move
                     changeExtension                        ▲
                     remove / removeMany          ┌─────────┴──────────┐
                                           LocalDiskProvider   SupabaseStorageProvider
                                           (disco, desarrollo) (Supabase Storage, Render)
```

| Archivo | Rol |
|---|---|
| `patterns/storageBridge/FileStorage.js` | **Abstracción**: operaciones del dominio sobre un archivo de la tabla `archivo` |
| `patterns/storageBridge/StorageProvider.js` | **Implementador**: interfaz con las operaciones primitivas sobre "claves" |
| `patterns/storageBridge/LocalDiskProvider.js` | Implementador concreto: disco local (el comportamiento anterior) |
| `patterns/storageBridge/SupabaseStorageProvider.js` | Implementador concreto: API REST de Supabase Storage |
| `patterns/storageBridge/index.js` | Elige el implementador según `STORAGE_DRIVER` |

**Por qué Bridge y no solo "un if":**
- La lógica de negocio no sabe dónde se guardan los bytes.
- Los proveedores no saben nada de cuotas, papelera ni carpetas.
- Las dos jerarquías crecen por separado: agregar Amazon S3 sería una clase nueva más una línea en `index.js`, sin tocar `storageService`.
- Se complementa con el **Decorator** de planes (`patterns/planDecorator.js`), que define cuánto puede subir cada usuario.

**En desarrollo nada cambia:** sin `STORAGE_DRIVER` (o con `local`), los archivos siguen yendo a `Back_/uploads` como antes.
