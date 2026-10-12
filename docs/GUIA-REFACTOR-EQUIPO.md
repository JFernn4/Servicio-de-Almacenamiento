# Guía del refactor para el equipo

**Dónde está:** en `main`, desde el 11 de octubre de 2026.

**Qué incluye:**
1. **Refactor** del código que ya existía (login, registro y panel) para que cumpla SOLID, DRY, KISS y YAGNI.
2. **Integración de la rama `integracion`** (validación de correo y recuperación de contraseña, de Jimmy Quevedo), adaptada a la estructura nueva.

No se agregó ninguna otra funcionalidad. Este documento explica qué cambió, qué tiene que hacer cada quien para seguir trabajando y dónde poner el código nuevo. El detalle de *por qué* se hizo cada cambio del refactor está en `docs/02-diseno/evaluacion-principios-diseno.md`.

---

## 1. Resumen

| Área | Antes | Ahora |
|---|---|---|
| Backend | Un controlador de más de 270 líneas hacía todo | Capas separadas: rutas → controladores → validadores → servicios → repositorios |
| Frontend | SVG, colores y la tarjeta de login/registro copiados en cada archivo | Componentes reutilizables (`Icon`, `AuthLayout`, `FileTable`…) y colores en `theme.js` |
| Base de datos | `db:init` fallaba si se corría dos veces | Scripts repetibles (`IF NOT EXISTS`, `ON CONFLICT`) |
| Limpieza | `multer` y varios archivos sin uso | Eliminados |

**Además se corrigieron errores reales**, no solo de estilo:

1. **El frontend dejaba entrar con cualquier contraseña.** Si el backend respondía "credenciales inválidas", el frontend igual creaba una sesión falsa (`fake-token`). Ya no.
2. Si faltaba el `.env`, el backend firmaba los tokens con un secreto fijo y conocido. Ahora no arranca sin `JWT_SECRET`.
3. `morgan` estaba en `devDependencies` pero se usaba siempre: en producción el servidor no arrancaba.
4. Los errores internos (por ejemplo, de SQL) se mostraban tal cual al usuario. Ahora responde un mensaje genérico.
5. Había un correo personal real en `.env.example` y en `testEmail.js`.
6. El menú lateral mostraba datos fijos ("18.4 GB de 50 GB", "Carlos Alvarado"). Ahora muestra los del usuario.

---

## 2. Qué tienes que hacer ahora

**1. Actualiza `main`:**

```bash
git checkout main
git pull origin main
```

**2. Reinstala las dependencias** en `Back_` y en `Front_` (cambiaron):

```bash
npm ci
```

**3. Revisa tu `Back_/.env`** (sección 3.1): `JWT_SECRET` es obligatorio y hay variables nuevas.

**4. Si tienes una rama propia con trabajo sin terminar**, trae `main` a tu rama:

```bash
git checkout tu-rama
git merge main
```

Si aparecen conflictos, no los resuelvas línea por línea: mueve tu código al lugar que le corresponde en la estructura nueva (secciones 4 y 5).

---

## 3. Lo que cambia para ti desde hoy

### 3.1 `Back_/.env`

| Variable | Cambio |
|---|---|
| `JWT_SECRET` | **Obligatoria.** Sin ella el servidor no arranca |
| `CORS_ORIGIN` | **Nueva.** URL del frontend (por defecto `http://localhost:5173`). El backend ya no acepta peticiones de cualquier origen |
| `FRONTEND_URL` | **Nueva.** Base de los enlaces que van en los correos |
| `SMTP_PASS` | Si empieza con `<` (como el valor de ejemplo) se considera "sin configurar": los correos no se envían y los enlaces se imprimen en la consola del backend |
| `TEST_EMAIL_RECIPIENT` | Obligatoria para `npm run test:email` (ya no hay un correo personal por defecto) |

`dotenv` se carga **una sola vez**, en `src/config/env.js`. En el resto del código no uses `process.env`: importa `config`.

```js
import { config } from '../config/env.js';
config.jwt.secret; config.db.host; config.mail.from; config.frontendUrl;
```

### 3.2 Ya no hay login simulado

Para entrar a la app **necesitas el backend y PostgreSQL funcionando**. Si el backend está apagado, el frontend muestra "No se pudo conectar con el servidor".

### 3.3 Cambios en las respuestas de la API

Las rutas de siempre (`/api/auth/register`, `/login`, `/me`) no cambian. Cambian estos códigos:

| Caso | Antes | Ahora |
|---|---|---|
| Registro con un correo que ya existe | `400` | `409` |
| Token inválido o vencido | `403` | `401` |
| Error interno | `500` con el mensaje real | `500` con "Error interno del servidor" (el detalle queda en la consola) |
| `GET /api/health` | `{ status, message, timestamp, environment }` | `{ status, timestamp }` |

El objeto `user` ahora incluye también `correoVerificado`.

### 3.4 Dependencias y scripts

- Se quitó **`multer`** porque nadie lo usaba. Quien haga la subida de archivos (Etapa 5) lo vuelve a instalar: `npm install multer`.
- `morgan` pasó a `dependencies`.
- Se quitó el script `npm test` vacío del backend.
- `npm run db:init` y `npm run init-db` hacen lo mismo.

---

## 4. Backend: estructura y dónde va el código nuevo

```
Back_/src/
  index.js          arranque del servidor (valida JWT_SECRET)
  app.js            configuración de Express (sin abrir puerto: sirve para pruebas)
  config/           env.js (variables de entorno), db.js (conexión), constants.js (reglas fijas)
  routes/           qué URL llama a qué controlador
  controllers/      leen la petición y responden. Sin lógica de negocio ni SQL
  validators/       validan y limpian los datos de entrada
  services/         reglas de negocio:
                      authService      registro, login, perfil
                      accountService   verificación de correo y recuperación de contraseña
                      tokenService     firma y verificación de JWT
                      passwordService  hash de contraseñas (bcrypt)
                      emailService     envío de correos
  repositories/     todo el SQL (userRepository)
  templates/        contenido de los correos
  middlewares/      authMiddleware (JWT), errorHandler (errores y 404)
  utils/            httpError.js, escapeHtml.js
```

### Receta para agregar un endpoint

1. **Ruta** en `routes/`: `router.post('/algo', authenticateToken, hacerAlgo);`
2. **Validador** en `validators/`: recibe `req.body`, devuelve los datos limpios o lanza `new HttpError(400, 'mensaje')`.
3. **Servicio** en `services/`: la regla de negocio. Llama a repositorios.
4. **Repositorio** en `repositories/`: solo SQL.
5. **Controlador** en `controllers/`: une lo anterior.

```js
// controllers/…  — no hace falta try/catch: Express 5 envía los errores al errorHandler
export async function hacerAlgo(req, res) {
  const resultado = await algoService.hacerAlgo(req.user.id, validateAlgo(req.body));
  res.status(200).json({ resultado });
}
```

`accountService.js` y sus funciones en el controlador son un buen ejemplo completo para copiar.

### Reglas

- **Errores para el usuario:** `throw new HttpError(404, 'Usuario no encontrado.')`. Cualquier otro error se convierte en un `500` genérico.
- **SQL solo en `repositories/`.** Los controladores y servicios no importan `query`.
- **Tokens JWT:** usa `tokenService.js`, no `jwt.sign` directo. `signToken` / `verifyToken` son para sesiones; `signPurposeToken` / `verifyPurposeToken` son para los enlaces de los correos.
- **Contraseñas:** `hashPassword` / `verifyPassword` de `passwordService.js`.
- **Valores fijos de negocio** (cuota de 5 GB, rol por defecto, largo mínimo de contraseña, vigencia de los enlaces): en `config/constants.js`.
- **Usuario en la respuesta:** pásalo siempre por `toPublicUser(row)` para no filtrar el hash de la contraseña. Hoy es una función interna de `authService.js`; si otro servicio la necesita, hay que exportarla o moverla a un archivo propio.
- **Texto del usuario dentro de HTML** (correos): pásalo por `escapeHtml` (`utils/escapeHtml.js`).

---

## 5. Frontend: componentes disponibles

Antes de escribir un componente nuevo, revisa si ya existe:

| Componente | Ubicación | Uso |
|---|---|---|
| `Icon` | `components/ui/` | `<Icon name="folder" size={18} />`. Nombres: `mail`, `lock`, `person`, `arrowRight`, `cloud`, `folder`, `folderPlus`, `file`, `clock`, `trash`, `card`, `logout`, `search`, `upload`, `alert`, `more`. Para un icono nuevo, agrégalo al catálogo de `Icon.jsx` |
| `FieldInput` | `components/ui/` | Campo con etiqueta e icono. Si `type="password"`, trae su botón Mostrar/Ocultar |
| `SubmitButton` | `components/ui/` | Botón de envío de formulario con estado de carga |
| `Button` | `components/ui/` | Botón normal. `variant`: `primary`, `secondary` o `danger` |
| `TextButton` | `components/ui/` | Acción con apariencia de enlace (en lugar de un `<span onClick>`) |
| `Alert` | `components/ui/` | Mensajes: `<Alert>` (error), `<Alert type="success">`, `<Alert type="info">`. **Reemplaza a `ErrorBanner`** |
| `BrandLogo` | `components/ui/` | Logo de VinCloud. `compact` para el menú lateral. **Reemplaza a `AuthLogo`** |
| `AuthLayout` | `components/auth/` | Fondo + tarjeta + logo + títulos de las pantallas de autenticación |
| `ViewHeader` | `components/dashboard/` | Encabezado de cada vista del panel |
| `SearchInput`, `EmptyState`, `FileTable`, `StorageCard` | `components/dashboard/` | Buscador, estado vacío, tabla de archivos, uso de almacenamiento |

**Archivos eliminados** (no se usaban o fueron reemplazados): `AuthLogo.jsx`, `AuthRightPanel.jsx`, `ErrorBanner.jsx`, `App.css`, `assets/hero.png`, `assets/react.svg`, `assets/vite.svg`, `public/icons.svg` y el CSS de burbujas de `index.css`.

### Colores

No escribas colores a mano. Están en `src/styles/theme.js`:

```js
import { colors } from '../../styles/theme';
<div style={{ color: colors.primary, border: `1px solid ${colors.border}` }} />
```

### Agregar una pantalla al panel

Solo hay que tocar **un archivo**, `components/dashboard/navigation.js`:

```js
{ id: 'suscripciones', label: 'Suscripciones', icon: 'card', View: SuscripcionesView },
```

El menú lateral y el área principal la toman de ahí. Hoy `suscripciones` no tiene `View` y por eso muestra "Vista en construcción".

### Agregar una pantalla de autenticación

Se registra en `App.jsx` (variable `currentScreen`). Las que se abren desde un enlace de correo (`?mode=...&token=...`) se agregan también a `EMAIL_LINK_SCREENS`.

### Llamadas a la API

`services/authService.js` tiene una función interna `request()` que arma el `fetch`, envía el token y convierte los errores del backend en `Error(mensaje)`. Cambios que afectan a quien ya lo usaba:

- `login()` y `register()` ahora devuelven **el usuario** (antes `{ token, user }`). El token se guarda solo.
- Ya no se exportan `getToken`, `setSession` ni `getCurrentUser`.
- Los nombres de los campos son los del backend: `user.nombre`, `user.correo`, `user.rol` (no `name`, `email`, `role`).

Cuando haya más servicios (archivos, planes), conviene mover `request()` a un archivo propio, por ejemplo `services/apiClient.js`, y reutilizarlo.

### Utilidades

`utils/user.js`: `getInitials(nombre)`, `formatBytes(bytes)` y `getStorageUsage(user)`.

---

## 6. Base de datos

- `database/inicializacion/schema.sql` usa `CREATE TABLE IF NOT EXISTS` y `seed.sql` usa `ON CONFLICT DO NOTHING`. **Las tablas nuevas deben seguir ese patrón**, para que `npm run db:init` se pueda correr siempre sin romper nada.
- `db:init` ya no oculta errores: si un script SQL falla, se detiene y lo muestra.
- No cambió ninguna tabla ni columna.

---

## 7. Validación de correo y recuperación de contraseña (rama `integracion`)

El trabajo de la rama `integracion` chocaba con el refactor en 6 archivos. Se resolvió moviendo cada pieza a la estructura nueva. **La rama `integracion` ya está contenida en `main`: no hace falta fusionarla de nuevo.**

**Se conservó tal cual:**

| Elemento | Valor |
|---|---|
| Rutas | `POST /api/auth/verify-email`, `/forgot-password`, `/reset-password` |
| Campos | `{ token }`, `{ correo }`, `{ token, nuevaContrasena }` |
| Enlaces de los correos | `?mode=verify-email&token=…` y `?mode=reset-password&token=…` |
| Vigencia | 24 horas (verificación) y 30 minutos (recuperación) |
| Textos | Los de los correos y las pantallas |
| Sin SMTP configurado | El enlace se imprime en la consola del backend (`[Simulacion de Correo]`) |

**Dónde quedó cada pieza:**

| Antes (en `integracion`) | Ahora |
|---|---|
| `verifyEmail`, `forgotPassword`, `resetPassword` en `authController.js` (con SQL, JWT y bcrypt dentro) | Controlador: 3 funciones cortas. La lógica está en `services/accountService.js` |
| `query(...)` en el controlador | `markEmailVerified` y `updatePassword` en `repositories/userRepository.js` |
| Validaciones en el controlador | `validateVerifyEmail`, `validateForgotPassword`, `validateResetPassword` en `validators/authValidator.js` |
| `jwt.sign` / `jwt.verify` con `tipo` | `signPurposeToken` / `verifyPurposeToken` en `services/tokenService.js` |
| HTML de los dos correos, casi idéntico y repetido | `templates/actionEmailLayout.js` (estructura común) + `verificationEmail.js` y `passwordResetEmail.js` (solo los textos) |
| `process.env.FRONTEND_URL` | `config.frontendUrl` |
| Pantallas con el diseño anterior de dos paneles (`AuthLogo` + `AuthRightPanel`) | Las 3 pantallas usan `AuthLayout`, igual que Login y Registro |
| `fetch` repetido en el `authService.js` del frontend | `forgotPassword`, `resetPassword` y `verifyEmail` usan `request()` |

**Correcciones hechas al integrar** (cambian el comportamiento respecto a la rama original):

1. **"Olvidé mi contraseña" revelaba qué correos existían:** respondía un mensaje distinto si la cuenta existía. Ahora responde siempre "Si el correo está registrado, se ha enviado un enlace de recuperación."
2. **Un enlace de verificación o de recuperación servía como sesión:** al estar firmado con el mismo secreto, se podía usar como token de inicio de sesión. Ahora se rechaza.
3. **Con el `.env.example` nuevo el sistema intentaba enviar correos con el valor de ejemplo** y fallaba. Ahora un `SMTP_PASS` que empieza con `<` se trata como "sin configurar".
4. El nombre del usuario se escapa antes de insertarlo en el HTML de los correos.
5. Se quitó un `package-lock.json` vacío que se había creado por error en la raíz del repositorio.
6. Tras verificar el correo con la sesión abierta, el panel recarga el perfil para reflejar el cambio.

---

## 8. Qué se probó

Con PostgreSQL real, en una base de datos temporal:

| Prueba | Resultado |
|---|---|
| `db:init` ejecutado dos veces seguidas | ✅ |
| Registro: `201`, 5 GB asignados, `correoVerificado=false`, sin exponer el hash; se generan los correos de bienvenida y de verificación | ✅ |
| Correo duplicado: `409` | ✅ |
| Validaciones (campos faltantes, correo inválido, contraseña corta): `400` | ✅ |
| Login correcto `200`; contraseña incorrecta o usuario inexistente `401` | ✅ |
| `/auth/me`: `200` con token; `401` sin token o con token inválido | ✅ |
| JSON mal formado `400`; ruta inexistente `404`; error interno `500` genérico | ✅ |
| `verify-email` con el enlace del correo: `200` y `/auth/me` refleja `correoVerificado=true` | ✅ |
| `verify-email` sin token, con token inválido o con un token de sesión: `400` | ✅ |
| Un token de verificación no sirve como sesión: `401` | ✅ |
| `forgot-password`: misma respuesta exista o no el correo | ✅ |
| `reset-password`: validaciones `400`; con el enlace del correo `200`; entra la contraseña nueva y no la anterior | ✅ |
| Los correos escapan el HTML del nombre | ✅ |
| Frontend: `npm run build` y `npm run lint` sin errores ni avisos | ✅ |
| Las pantallas de login, recuperar contraseña, nueva contraseña y verificación abren en el navegador sin errores de consola | ✅ |

**No se probó:** el envío real de correos por SMTP, ni el panel después de iniciar sesión en el navegador.

---

## 9. Pendientes y decisiones para el equipo

- **`espacio_disponible`:** el frontend lo interpreta como *espacio libre restante* (total = consumido + disponible). Si el equipo decide que es la *cuota total*, hay que cambiar `getStorageUsage` en `Front_/src/utils/user.js`.
- **Seguridad pendiente:**
  - Un enlace de recuperación se puede usar más de una vez durante sus 30 minutos.
  - Cambiar la contraseña no cierra las sesiones ya abiertas.
  - No hay límite de intentos de inicio de sesión.
- **Estilos:** siguen escritos dentro de cada componente (ahora con los colores de `theme.js`). Pasarlos a archivos CSS sería el siguiente paso.
- **Pruebas automáticas:** no hay. `app.js` quedó separado de `index.js` para poder probar la API sin abrir un puerto.
- **Botones sin funcionalidad todavía:** "Subir archivo", "Nueva carpeta" y "Ampliar almacenamiento".
- **Diagramas:** el diagrama de arquitectura (`docs/02-diseno/`) no refleja las capas nuevas del backend.

> **Si `npm ci` falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`:** es el firewall de la red (inspecciona HTTPS), no el proyecto. Prueba desde otra red.
