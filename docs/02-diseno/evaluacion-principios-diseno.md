# Evaluación y refactor según principios de diseño

Rama: `refactor/principios-diseno`. Alcance: `Back_/`, `Front_/` y `database/`.

## Resumen

| Principio | Antes | Después |
|---|---|---|
| **SRP** | `authController` validaba, consultaba la BD, hasheaba, firmaba el JWT, mapeaba la respuesta y enviaba el correo. | Capas separadas: `validators/` → `controllers/` → `services/` → `repositories/`. Cada archivo tiene una sola razón para cambiar. |
| **OCP** | `MainContent` tenía una cadena de `if` por pestaña, y el menú definía las pestañas por su cuenta. | Un registro único (`dashboard/navigation.js`). Para agregar una vista basta con agregar una entrada. |
| **DIP** | Los controladores dependían de `pg`, `bcrypt` y `jsonwebtoken` directamente. | El controlador depende de `authService`, y el servicio usa `userRepository`/`tokenService`. Si cambia la BD o el formato del token, el controlador no cambia. |
| **DRY** | El secreto JWT y su valor por defecto se repetían 3 veces, el mapeo del usuario 3 veces, `dotenv.config()` 5 veces, la lógica de iniciales 3 veces, más de 30 SVG copiados, colores en cada archivo y la tarjeta de login/registro duplicada. | `config/env.js`, `toPublicUser`, `utils/user.js`, `Icon`, `styles/theme.js`, `AuthLayout`, `FileTable`, `ViewHeader`, `EmptyState`, `SearchInput`. |
| **KISS** | Un rol de respaldo con dos consultas, `try/catch` en cada handler, y `useState` para constantes que nunca cambian. | El rol sale de una subconsulta, Express 5 propaga los errores async y las constantes son constantes. |
| **YAGNI** | `multer` sin usar; `AuthRightPanel`, `AuthLogo`, `App.css`, assets de la plantilla de Vite y CSS de burbujas sin usar; login "simulado". | Eliminados. |

## Defectos corregidos (además del diseño)

1. **Crítico: cualquier contraseña iniciaba sesión.** `Front_/src/services/authService.js` atrapaba *cualquier* error, incluido el 401 de credenciales inválidas, y creaba una sesión falsa (`fake-token`). Ahora se muestra el error real del backend.
2. **Secreto JWT por defecto** (`super_secret_jwt_key_default`). Si faltaba `.env`, cualquiera podía falsificar tokens. Ahora el servidor no arranca sin `JWT_SECRET`.
3. **El backend no arrancaba en producción**: `morgan` estaba en `devDependencies` pero se importaba siempre. Se movió a `dependencies`.
4. **Fuga de detalles internos**: el manejador de errores devolvía `err.message` de cualquier excepción (por ejemplo, errores SQL). Ahora solo se exponen los mensajes de `HttpError` y los 4xx de Express.
5. **Condición de carrera en el registro**: se revisaba el correo y después se insertaba. Ahora la restricción `UNIQUE` de la BD decide y responde **409**.
6. **`npm run db:init` no era repetible**: fallaba si las tablas ya existían. Ahora usa `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT DO NOTHING`.
7. **Inyección de HTML en el correo de bienvenida**: el nombre del usuario se insertaba sin escapar. Ahora se escapa.
8. **Datos falsos en el menú lateral**: mostraba "18.4 GB de 50 GB" y "Carlos Alvarado" fijos. Ahora usa `espacioConsumido`/`espacioDisponible` del usuario.
9. **Token inválido devolvía 403**. Lo correcto es **401**.
10. **CORS abierto a cualquier origen**. Ahora se configura con `CORS_ORIGIN`.
11. **Correo personal en el repositorio** (`.env.example` y `testEmail.js`). Se reemplazó por un valor de ejemplo.
12. **Accesibilidad**: `<span>`/`<div>` clicables pasaron a `<button>`, las etiquetas se asociaron a sus inputs y los errores usan `role="alert"`.

## Estructura resultante del backend

```
src/
  app.js                 # configuración de Express (testeable sin abrir un puerto)
  index.js               # arranque + validación de entorno
  config/                # env.js (única carga de .env), db.js, constants.js
  routes/                # definición de endpoints
  controllers/           # HTTP: lee req, responde res
  validators/            # validación y normalización de entrada
  services/              # reglas de negocio (auth, token, email)
  repositories/          # SQL
  templates/             # contenido de correos
  middlewares/           # autenticación, 404 y errores
  utils/httpError.js
```

## Decisiones y pendientes

- Se interpreta `espacio_disponible` como **espacio libre restante** (total = consumido + disponible). Si el equipo lo define como *cuota total*, hay que cambiar `getStorageUsage` en `Front_/src/utils/user.js`.
- Los estilos siguen siendo *inline*, por consistencia con el código existente. Ahora toman los colores de `theme.js`. Migrar a CSS Modules sería el siguiente paso natural.
- "Subir archivo", "Nueva carpeta", "Ampliar almacenamiento" y "¿Olvidaste tu contraseña?" siguen sin funcionalidad, porque aún no hay backend para ellas.
- No hay pruebas automatizadas. `app.js` ya está separado de `index.js` para poder probarlo con `supertest`.
