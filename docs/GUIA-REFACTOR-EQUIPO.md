# Guía del refactor para el equipo

**Rama:** `refactor/principios-diseno` (sale de `main` en el commit `101ab94`).
**Qué es:** una reorganización del código que ya existía (login, registro y dashboard) para que cumpla SOLID, DRY, KISS y YAGNI. **No agrega funcionalidades nuevas.**

Este documento explica qué cambió, qué tiene que hacer cada quien para seguir trabajando y dónde poner el código nuevo. El detalle de *por qué* se hizo cada cambio está en [`02-diseno/evaluacion-principios-diseno.md`](02-diseno/evaluacion-principios-diseno.md).

---

## 1. Resumen

| Área | Antes | Ahora |
|---|---|---|
| Backend | Un controlador de 270 líneas hacía todo | Capas separadas: rutas → controladores → validadores → servicios → repositorios |
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

## 2. Cómo obtener los cambios

```bash
git fetch origin
git checkout refactor/principios-diseno
```

Después, **obligatorio** en `Back_` y en `Front_` (las dependencias cambiaron):

```bash
npm ci
```

Para traer el refactor a tu propia rama: `git merge origin/refactor/principios-diseno`. Lee antes la sección 7, porque hay ramas con conflictos.

---

## 3. Lo que cambia para ti desde hoy

### 3.1 `Back_/.env`

| Variable | Cambio |
|---|---|
| `JWT_SECRET` | **Obligatoria.** Sin ella el servidor no arranca |
| `CORS_ORIGIN` | **Nueva.** URL del frontend (por defecto `http://localhost:5173`). El backend ya no acepta peticiones de cualquier origen |
| `EMAIL_FROM`, `TEST_EMAIL_RECIPIENT` | Ya no tienen valores por defecto con datos personales. `npm run test:email` exige `TEST_EMAIL_RECIPIENT` |

`dotenv` se carga **una sola vez**, en `src/config/env.js`. En el resto del código no uses `process.env`: importa `config`.

```js
import { config } from '../config/env.js';
config.jwt.secret; config.db.host; config.mail.from;
```

### 3.2 Ya no hay login simulado

Para entrar a la app **necesitas el backend y PostgreSQL funcionando**. Si el backend está apagado, el frontend muestra "No se pudo conectar con el servidor".

### 3.3 Cambios en las respuestas de la API

Las rutas son las mismas (`/api/auth/register`, `/login`, `/me`) y el objeto `user` no cambió. Cambian estos códigos:

| Caso | Antes | Ahora |
|---|---|---|
| Registro con un correo que ya existe | `400` | `409` |
| Token inválido o vencido | `403` | `401` |
| Error interno | `500` con el mensaje real | `500` con "Error interno del servidor" (el detalle queda en la consola) |
| `GET /api/health` | `{ status, message, timestamp, environment }` | `{ status, timestamp }` |

### 3.4 Dependencias

- Se quitó **`multer`** porque nadie lo usaba. Quien haga la subida de archivos (Etapa 5) lo vuelve a instalar: `npm install multer`.
- `morgan` pasó a `dependencies`.
- Se quitó el script `npm test` vacío del backend.

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
  services/         reglas de negocio (authService, tokenService, emailService)
  repositories/     todo el SQL (userRepository)
  templates/        contenido de los correos
  middlewares/      authMiddleware (JWT), errorHandler (errores y 404)
  utils/httpError.js
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

### Reglas

- **Errores para el usuario:** `throw new HttpError(404, 'Usuario no encontrado.')`. Cualquier otro error se convierte en un `500` genérico.
- **SQL solo en `repositories/`.** Los controladores y servicios no importan `query`.
- **Tokens JWT:** usa `signToken` / `verifyToken` de `services/tokenService.js`, no `jwt.sign` directo.
- **Valores fijos de negocio** (cuota de 5 GB, rol por defecto, largo mínimo de contraseña): en `config/constants.js`.
- **Usuario en la respuesta:** pásalo siempre por `toPublicUser(row)` para no filtrar el hash de la contraseña. Hoy es una función interna de `authService.js`; si otro servicio la necesita, hay que exportarla o moverla a un archivo propio.

---

## 5. Frontend: componentes disponibles

Antes de escribir un componente nuevo, revisa si ya existe:

| Componente | Ubicación | Uso |
|---|---|---|
| `Icon` | `components/ui/` | `<Icon name="folder" size={18} />`. Nombres: `mail`, `lock`, `person`, `arrowRight`, `cloud`, `folder`, `folderPlus`, `file`, `clock`, `trash`, `card`, `logout`, `search`, `upload`, `alert`, `more`. Para un icono nuevo, agrégalo al catálogo de `Icon.jsx` |
| `FieldInput` | `components/ui/` | Campo con etiqueta e icono. Si `type="password"`, trae su botón Mostrar/Ocultar |
| `SubmitButton` | `components/ui/` | Botón de envío con estado de carga |
| `TextButton` | `components/ui/` | Acción con apariencia de enlace (en lugar de un `<span onClick>`) |
| `ErrorBanner` | `components/ui/` | Mensaje de error |
| `BrandLogo` | `components/ui/` | Logo de VinCloud. `compact` para el menú lateral. **Reemplaza a `AuthLogo`** |
| `AuthLayout` | `components/auth/` | Fondo + tarjeta + logo + títulos de las pantallas de autenticación |
| `ViewHeader` | `components/dashboard/` | Encabezado de cada vista del panel |
| `SearchInput`, `EmptyState`, `FileTable`, `StorageCard` | `components/dashboard/` | Buscador, estado vacío, tabla de archivos, uso de almacenamiento |

**Archivos eliminados** (no se usaban): `AuthLogo.jsx`, `AuthRightPanel.jsx`, `App.css`, `assets/hero.png`, `assets/react.svg`, `assets/vite.svg`, `public/icons.svg` y el CSS de burbujas de `index.css`.

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

## 7. Cómo integrar las otras ramas

Estado de las ramas el 11 de octubre de 2026:

| Rama | Estado respecto a `main` | Qué hacer |
|---|---|---|
| `Front-` | Sin cambios pendientes (ya está en `main`) | Antes de seguir, traer el refactor: `git merge origin/refactor/principios-diseno` |
| `RamaDB` | Sin cambios pendientes | Igual. Recordar el patrón `IF NOT EXISTS` para las tablas nuevas |
| `integracion` | **2 commits sin subir a `main`** ("verificacion correo": validación de correo y recuperación de contraseña) | **Tiene conflictos con el refactor.** Ver abajo |

### Rama `integracion`: conflictos y cómo resolverlos

Al unirla con el refactor hay conflicto en 6 archivos: `authController.js`, `emailService.js`, `testEmail.js`, `App.jsx`, `LoginScreen.jsx` y `Front_/src/services/authService.js`. Es normal: esos archivos se reescribieron.

No conviene resolverlo línea por línea. Es más rápido **mover cada pieza a su lugar en la estructura nueva**:

| Lo que hay en `integracion` | Dónde va ahora |
|---|---|
| `verifyEmail`, `forgotPassword`, `resetPassword` en `authController.js` | Controlador: 3 funciones cortas. La lógica pasa a un servicio (por ejemplo `services/accountService.js`) |
| Los `query(...)` dentro del controlador | Funciones en `repositories/userRepository.js` (por ejemplo `markEmailVerified`, `updatePassword`) |
| Las validaciones de correo, token y contraseña | `validators/authValidator.js` |
| `jwt.sign(...)` para los tokens de verificación y de recuperación | `services/tokenService.js` |
| `sendVerificationEmail`, `sendPasswordResetEmail` | `services/emailService.js`. El HTML de cada correo va en `templates/` (como `welcomeEmail.js`) |
| `process.env.FRONTEND_URL` | Agregar `frontendUrl` a `config/env.js` |
| `ForgotPasswordScreen`, `ResetPasswordScreen`, `VerifyEmailScreen` | Se conservan. Pueden usar `AuthLayout`, `FieldInput` y `SubmitButton` para no repetir la tarjeta |
| `forgotPassword`, `resetPassword`, `verifyEmail` del `authService.js` del frontend | Reescribirlas con `request()` (quedan en 2 o 3 líneas cada una) |
| El script `init-db` de `package.json` | Ya existe como `db:init`; no hace falta duplicarlo |

Dos puntos de seguridad a revisar al moverlo:
- Que "olvidé mi contraseña" responda **lo mismo** exista o no el correo, para no revelar qué cuentas hay.
- Que el nombre del usuario se escape antes de insertarlo en el HTML del correo (hay un `escapeHtml` en `templates/welcomeEmail.js`; habría que exportarlo para reutilizarlo).

---

## 8. Qué se probó

Con PostgreSQL real, en una base de datos temporal:

| Prueba | Resultado |
|---|---|
| `db:init` ejecutado dos veces seguidas | ✅ |
| Registro: `201`, 5 GB asignados, correo y nombre normalizados, sin exponer el hash | ✅ |
| Correo duplicado: `409` | ✅ |
| Validaciones (campos faltantes, correo inválido, contraseña corta): `400` | ✅ |
| Login correcto `200`; contraseña incorrecta o usuario inexistente `401` | ✅ |
| `/auth/me`: `200` con token; `401` sin token o con token inválido | ✅ |
| JSON mal formado `400`; ruta inexistente `404` | ✅ |
| Un error interno responde `500` genérico, sin detalles de SQL | ✅ |
| Frontend: `npm run build` y `npm run lint` | ✅ sin errores ni avisos |

**No se probó:** el uso manual de las pantallas en el navegador (login, registro y panel), ni el envío real de correos por SMTP.

---

## 9. Pendientes y decisiones para el equipo

- **`espacio_disponible`:** el frontend lo interpreta como *espacio libre restante* (total = consumido + disponible). Si el equipo decide que es la *cuota total*, hay que cambiar `getStorageUsage` en `Front_/src/utils/user.js`.
- **Estilos:** siguen escritos dentro de cada componente (ahora con los colores de `theme.js`). Pasarlos a archivos CSS sería el siguiente paso.
- **Pruebas automáticas:** no hay. `app.js` quedó separado de `index.js` para poder probar la API sin abrir un puerto.
- **Botones sin funcionalidad todavía:** "Subir archivo", "Nueva carpeta", "Ampliar almacenamiento" y "¿Olvidaste tu contraseña?".
- **Seguridad pendiente:** no hay límite de intentos de inicio de sesión, y cambiar la contraseña no cerraría las sesiones ya abiertas.
- **Diagramas:** el diagrama de arquitectura (`02-diseno/`) no refleja las capas nuevas del backend.

> **Si `npm ci` falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`:** es el firewall de la red (inspecciona HTTPS), no el proyecto. Prueba desde otra red.
