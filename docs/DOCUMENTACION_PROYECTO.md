# Documento de Requisitos

## 1. Introducción
El sistema VinCloud es una plataforma web de Almacenamiento como Servicio (Storage as a Service / PaaS) desarrollada como proyecto final para el curso de Ingeniería de Software I en la Universidad Rafael Landívar. Su propósito es proveer a usuarios individuales y corporativos un espacio virtual seguro para la gestión, estructuración en carpetas, previsualización, compartición y recuperación de archivos en la nube, optimizando el control de almacenamiento mediante cuotas por usuario y un catálogo de planes administrables. El presente documento formaliza los requisitos funcionales, no funcionales y el modelado de casos de uso verificados en el código fuente del repositorio.

## 2. Alcance

### 2.1 Módulos y funcionalidades entregadas
* **Gestión de Cuentas y Seguridad:** Registro con asignación de cuota base, verificación obligatoria por correo electrónico, inicio de sesión con JWT y huella de contraseña, y recuperación de contraseña en dos pasos (`Back_/src/services/authService.js`, `Back_/src/services/accountService.js`).
* **Sistema de Archivos y Carpetas:** Subida de archivos con control de tamaño y extensiones prohibidas, navegación jerárquica en carpetas (relación reflexiva), descarga, previsualización en línea y renombrado (`Back_/src/services/storageService.js`, `Front_/src/components/dashboard/views/MisArchivosView.jsx`).
* **Papelera de Reciclaje:** Borrado lógico de archivos con preservación de metadatos, restauración selectiva, eliminación física definitiva y vaciado total con recálculo de espacio (`Back_/src/repositories/fileRepository.js`, `Front_/src/components/dashboard/views/PapeleraView.jsx`).
* **Compartición de Archivos:** Generación de enlaces públicos y envío de invitaciones por correo con tokens firmados de vigencia configurable (`Back_/src/templates/shareInvitationEmail.js`, `Front_/src/pages/Auth/SharedFileScreen.jsx`).
* **Panel de Administración:** Monitoreo de salud e infraestructura del servidor, gestión de usuarios (cambio de roles y ajuste manual de cuotas de disco) y CRUD del catálogo de planes (`Back_/src/controllers/adminController.js`, `Front_/src/components/dashboard/views/AdminView.jsx`).
* **Patrones Estructurales de Software:** Desacoplamiento de almacenamiento mediante Patrón Bridge (`local` y `supabase` en `Back_/src/patterns/storageBridge/`) y cálculo dinámico de políticas de planes mediante Patrón Decorator (`Back_/src/patterns/planDecorator.js`).

### 2.2 Funcionalidades fuera de alcance o pendientes
* **Pasarela de Pago Real:** No se integran proveedores financieros reales (Stripe, PayPal); las transacciones y pagos operan bajo un simulador en backend (`Back_/src/services/subscriptionService.js`).
* **Integración de Suscripciones en Frontend:** La vista del cliente para contratación y consulta de historial de pagos (`Front_/src/components/dashboard/views/SuscripcionesView.jsx`) es una maquetación estática no vinculada a los endpoints de la API.
* **Depuración Automática de Papelera:** No existe un proceso en segundo plano (cron job) que elimine permanentemente los archivos con más de 30 días en papelera; la limpieza es manual.
* **Rol Invitado Persistente en Base de Datos:** La compartición se gestiona mediante tokens JWT de acceso sin registrar un rol formal `Invitado` en la tabla `rol` (`database/inicializacion/schema.sql`).

## 3. Requisitos Funcionales

| ID | Requisito | Módulo | Estado |
|---|---|---|---|
| RF-01 | Registrar cuenta nueva con nombre, correo, contraseña y tipo de cuenta | Usuarios | Implementado |
| RF-02 | Enviar correo con enlace firmado (24h) para verificación de cuenta | Usuarios | Implementado |
| RF-03 | Bloquear inicio de sesión y acceso a API a usuarios no verificados | Usuarios | Implementado |
| RF-04 | Iniciar sesión y emitir token JWT de acceso con huella de contraseña | Usuarios | Implementado |
| RF-05 | Reenviar correo de verificación a cuentas pendientes | Usuarios | Implementado |
| RF-06 | Solicitar recuperación de contraseña vía correo electrónico con token (30m) | Usuarios | Implementado |
| RF-07 | Restablecer contraseña invalidando tokens anteriores | Usuarios | Implementado |
| RF-08 | Subir archivos validando cuota disponible, tamaño máximo y extensiones | Almacenamiento | Implementado |
| RF-09 | Crear, renombrar y eliminar carpetas jerárquicas anidadas | Almacenamiento | Implementado |
| RF-10 | Listar archivos y carpetas filtrados por directorio actual | Almacenamiento | Implementado |
| RF-11 | Descargar archivos físicos y previsualizar en navegador (inline) | Almacenamiento | Implementado |
| RF-12 | Renombrar archivos actualizando extensión física en almacenamiento | Almacenamiento | Implementado |
| RF-13 | Mover archivos a papelera mediante borrado lógico | Almacenamiento | Implementado |
| RF-14 | Restaurar archivos desde papelera hacia su ubicación original | Almacenamiento | Implementado |
| RF-15 | Eliminar archivos definitivamente liberando espacio en disco y cuota | Almacenamiento | Implementado |
| RF-16 | Vaciar papelera de reciclaje en un solo paso | Almacenamiento | Implementado |
| RF-17 | Compartir archivos mediante token público y envío de correo | Almacenamiento | Implementado |
| RF-18 | Descargar o visualizar archivos compartidos sin requerir autenticación | Almacenamiento | Implementado |
| RF-19 | Consultar archivos recientes subidos por el usuario | Almacenamiento | Implementado |
| RF-20 | Buscar archivos por coincidencia de nombre | Almacenamiento | Implementado |
| RF-21 | Consultar catálogo de planes con cálculo de Patrón Decorator | Suscripciones | Implementado |
| RF-22 | Contratar o cambiar suscripción de usuario mediante pasarela simulada | Suscripciones | Implementado (Solo API) |
| RF-23 | Renovar y cancelar suscripciones activas en base de datos | Suscripciones | Implementado (Solo API) |
| RF-24 | Consultar historial de pagos transaccionales del usuario | Suscripciones | Implementado (Solo API) |
| RF-25 | Contratar planes desde la interfaz del cliente | Suscripciones | Pendiente (Mockup UI) |
| RF-26 | Monitorear métricas de salud, uso de disco, CPU y red en panel admin | Administración | Implementado |
| RF-27 | Listar usuarios registrados, cambiar roles y actualizar cuotas de disco | Administración | Implementado |
| RF-28 | Crear y actualizar planes de almacenamiento en catálogo administrativo | Administración | Implementado |
| RF-29 | Eliminar usuarios y purgar en cascada sus archivos y carpetas | Administración | Implementado |

## 4. Requisitos No Funcionales

| ID | Categoría | Requisito | Cómo se cumple o evidencia | Estado |
|---|---|---|---|---|
| RNF-01 | Seguridad | Cifrado unidireccional de contraseñas | Hash con sal mediante `bcryptjs` en `Back_/src/services/passwordService.js` | Implementado |
| RNF-02 | Seguridad | Autenticación basada en tokens sin estado | Tokens JWT firmados (`HS256`) validados en `Back_/src/middlewares/authMiddleware.js` | Implementado |
| RNF-03 | Seguridad | Invalidación inmediata de sesiones activas | Huella de contraseña (`pwd`) embebida en JWT verificada contra base de datos | Implementado |
| RNF-04 | Seguridad | Mitigación de ataques de fuerza bruta | Limitadores de tasa en memoria (`Back_/src/middlewares/rateLimitMiddleware.js`) | Implementado |
| RNF-05 | Seguridad | Validación y saneamiento de entradas | Validadores por módulo que rechazan campos maliciosos (`Back_/src/validators/`) | Implementado |
| RNF-06 | Seguridad | Prevención de ejecución de binarios maliciosos | Lista negra de extensiones (`.exe`, `.sh`, `.bat`, etc.) en `uploadMiddleware.js` | Implementado |
| RNF-07 | Rendimiento | Modularidad y formato vertical limpio | Componentes de UI < 500 líneas según Clean Code Cap. 5 (`Front_/src/components/dashboard/admin/`) | Implementado |
| RNF-08 | Portabilidad | Abstracción de la capa de almacenamiento | Patrón Bridge con implementaciones para disco local y Supabase (`Back_/src/patterns/storageBridge/`) | Implementado |
| RNF-09 | Mantenibilidad | Arquitectura desacoplada en capas | Separación física estricta entre rutas, controladores, servicios y repositorios SQL | Implementado |
| RNF-10 | Confiabilidad | Persistencia de integridad referencial | Claves foráneas y borrado en cascada en PostgreSQL (`database/inicializacion/schema.sql`) | Implementado |

## 5. Casos de Uso

### 5.1 Diagramas de Casos de Uso por Actor

#### Casos de Uso del Cliente
El siguiente diagrama ilustra las funcionalidades principales que puede ejecutar un usuario autenticado con rol de Cliente.

```mermaid
flowchart LR
    Cliente((Cliente))
    CU01["Registrarse y verificar"]
    CU02["Iniciar sesión"]
    CU03["Subir archivo"]
    CU04["Organizar en carpetas"]
    CU05["Compartir archivo"]
    CU06["Gestionar papelera"]
    CU07["Recuperar acceso"]

    Cliente --> CU01
    Cliente --> CU02
    Cliente --> CU03
    Cliente --> CU04
    Cliente --> CU05
    Cliente --> CU06
    Cliente --> CU07
```

#### Casos de Uso del Administrador
El siguiente diagrama detalla las operaciones privilegiadas asignadas al rol Administrador para la gestión del servicio.

```mermaid
flowchart LR
    Admin((Administrador))
    CU08["Consultar métricas"]
    CU09["Listar usuarios"]
    CU10["Modificar cuota usuario"]
    CU11["Cambiar rol usuario"]
    CU12["Administrar catálogo planes"]
    CU13["Eliminar cuenta usuario"]

    Admin --> CU08
    Admin --> CU09
    Admin --> CU10
    Admin --> CU11
    Admin --> CU12
    Admin --> CU13
```

### 5.2 Tabla Resumen de Casos de Uso

| ID | Caso de Uso | Actor | Descripción breve | Estado |
|---|---|---|---|---|
| CU-01 | Registro de cuenta | Visitante | Crea cuenta de usuario y solicita verificación | Implementado |
| CU-02 | Verificación de correo | Visitante | Valida el enlace firmado para habilitar la cuenta | Implementado |
| CU-03 | Inicio de sesión | Cliente / Admin | Autentica credenciales y genera sesión JWT | Implementado |
| CU-04 | Recuperación de clave | Visitante | Restablece contraseña mediante enlace seguro | Implementado |
| CU-05 | Subir archivo | Cliente | Almacena binario y registra metadatos en BD | Implementado |
| CU-06 | Descargar / Visualizar | Cliente | Obtiene flujo binario de archivo propio | Implementado |
| CU-07 | Gestionar papelera | Cliente | Envía a papelera, restaura o purga archivos | Implementado |
| CU-08 | Compartir archivo | Cliente | Crea enlace público y notifica por correo | Implementado |
| CU-09 | Administrar usuarios | Administrador | Modifica roles, cuotas de disco o elimina cuentas | Implementado |
| CU-10 | Administrar planes | Administrador | Consulta, crea o modifica precios y cuotas de planes | Implementado |

### 5.3 Especificación de Casos de Uso Clave

#### CU-01: Registro de usuario
* **Precondición:** El visitante no debe tener una cuenta activa con el correo ingresado.
* **Flujo Principal:**
  1. El visitante accede a la pantalla de registro e ingresa nombre, correo y contraseña (`Front_/src/pages/Auth/RegisterScreen.jsx`).
  2. El cliente web envía la solicitud a `POST /api/auth/register`.
  3. El backend valida formato, genera el hash de la contraseña y crea el registro con `correo_verificado = FALSE` (`Back_/src/services/authService.js`).
  4. El backend emite un token de verificación y despacha el correo electrónico (`Back_/src/services/emailService.js`).
  5. El frontend muestra la pantalla `CheckEmailScreen` solicitando confirmar el correo antes de ingresar.
* **Flujo Alterno (Correo Duplicado):**
  * En el paso 3, si el correo ya existe, la base de datos lanza violación única (código `23505`) y el backend responde con error HTTP 409, notificando al usuario en la interfaz.

#### CU-02: Verificación de correo electrónico
* **Precondición:** El usuario debe poseer un token emitido en las últimas 24 horas.
* **Flujo Principal:**
  1. El usuario abre el enlace de su correo (`http://localhost:5173?mode=verify-email&token=...`).
  2. La vista `VerifyEmailScreen` envía el token a `POST /api/auth/verify-email`.
  3. El backend verifica la firma criptográfica y el propósito del token (`Back_/src/services/tokenService.js`).
  4. La base de datos actualiza `correo_verificado = TRUE` en la tabla `usuario` (`Back_/src/repositories/userRepository.js`).
  5. El sistema envía un correo de bienvenida y confirma en pantalla la activación de la cuenta.
* **Flujo Alterno (Token Vencido o Inválido):**
  * En el paso 3, si el token expiró o fue alterado, el backend responde HTTP 400 y el frontend muestra el error permitiendo reenviar un nuevo correo.

#### CU-03: Inicio de sesión
* **Precondición:** La cuenta debe existir y tener el correo verificado.
* **Flujo Principal:**
  1. El usuario introduce correo y contraseña en `LoginScreen.jsx`.
  2. El frontend envía los datos a `POST /api/auth/login`.
  3. El backend verifica la contraseña con `bcrypt.compare` y valida que `correo_verificado === TRUE` (`Back_/src/services/authService.js`).
  4. El backend firma y retorna el JWT de sesión junto con el perfil público.
  5. El frontend almacena el token en `localStorage` y redirige al panel correspondiente (Dashboard o Admin).
* **Flujo Alterno (Cuenta no verificada):**
  * En el paso 3, si `correo_verificado` es falso, el backend responde HTTP 403 y el frontend habilita un botón para reenviar el correo de verificación.

#### CU-04: Recuperación de contraseña
* **Precondición:** El correo debe pertenecer a una cuenta registrada.
* **Flujo Principal:**
  1. El usuario ingresa su correo en `ForgotPasswordScreen.jsx`.
  2. El backend genera un token de un solo propósito válido por 30 minutos con la huella actual de contraseña (`Back_/src/services/accountService.js`).
  3. Se envía el correo con el enlace de restablecimiento.
  4. El usuario abre `ResetPasswordScreen.jsx`, digita su nueva contraseña y envía la petición a `POST /api/auth/reset-password`.
  5. El backend actualiza el hash de la contraseña en PostgreSQL, invalidando el enlace utilizado.
* **Flujo Alterno (Enlace ya utilizado):**
  * En el paso 5, si la huella de contraseña no coincide con la almacenada, el backend rechaza la operación con HTTP 400.

#### CU-05: Subir archivo
* **Precondición:** Usuario autenticado con cuota de espacio disponible suficiente.
* **Flujo Principal:**
  1. El usuario selecciona o arrastra un archivo en `MisArchivosView.jsx`.
  2. `uploadMiddleware.js` intercepta la carga validando que el archivo no supere el tope y no tenga extensión peligrosa.
  3. `storageService.uploadFile` verifica que `espacio_consumido + tamano <= espacio_disponible`.
  4. El Patrón Bridge (`fileStorage.store`) persiste el binario en disco local o Supabase Storage (`Back_/src/patterns/storageBridge/`).
  5. Se inserta el registro en la tabla `archivo` y se incrementa `espacio_consumido` en la tabla `usuario`.
* **Flujo Alterno (Cuota Excedida):**
  * En el paso 3, si no hay espacio, se elimina el archivo temporal de Multer, se aborta la transacción y se retorna HTTP 400.

#### CU-06: Descargar / Visualizar archivo
* **Precondición:** El archivo debe existir, no estar en papelera y pertenecer al usuario autenticado.
* **Flujo Principal:**
  1. El usuario presiona "Descargar" o "Visualizar" en `FileTable.jsx`.
  2. El cliente solicita `GET /api/storage/files/:id/download` o `/view`.
  3. El backend verifica la pertenencia mediante `fileRepository.findFileByIdAndUser`.
  4. El proveedor de almacenamiento resuelve el stream de lectura (`fileStorage.open`).
  5. El servidor envía las cabeceras HTTP (`Content-Disposition: attachment` o `inline`) y transmite el flujo binario.
* **Flujo Alterno (Archivo Inexistente en Disco):**
  * En el paso 4, si los bytes físicos no se localizan, el backend retorna HTTP 404 informando la inconsistencia.

#### CU-07: Eliminar y restaurar desde papelera
* **Precondición:** El archivo debe pertenecer al usuario.
* **Flujo Principal:**
  1. El usuario selecciona "Eliminar" en el menú de un archivo activo.
  2. La API ejecuta `DELETE /api/storage/files/:id`, actualizando `en_papelera = TRUE` y `fecha_eliminacion = CURRENT_DATE` (`fileRepository.js`).
  3. El usuario ingresa a `PapeleraView.jsx` y selecciona "Restaurar".
  4. La API ejecuta `POST /api/storage/trash/:id/restore`, cambiando `en_papelera = FALSE` y devolviendo el archivo a su carpeta original.
* **Flujo Alterno (Borrado Definitivo):**
  * Si en la papelera el usuario elige "Eliminar definitivamente", el backend elimina el registro de la BD, borra los bytes físicos con `fileStorage.remove` y reduce `espacio_consumido`.

#### CU-08: Compartir archivo mediante enlace
* **Precondición:** El archivo debe estar activo.
* **Flujo Principal:**
  1. El usuario pulsa "Compartir" e ingresa opcionalmente un correo destinatario.
  2. El backend genera un token firmado (`TOKEN_PURPOSES.FILE_SHARE`) con vigencia de 7 días (`Back_/src/services/storageService.js`).
  3. Si se especificó correo, se despacha `shareInvitationEmail.js`; simultáneamente se entrega la URL al portapapeles.
  4. Cualquier persona con el enlace abre `SharedFileScreen.jsx` y consume `GET /api/storage/shared/:token` sin iniciar sesión.
* **Flujo Alterno (Enlace Expirado):**
  * Si el token superó los 7 días de validez, la API responde HTTP 400 y la pantalla muestra aviso de caducidad.

<!-- SALTO DE PÁGINA -->

# Documento de Diseño

## 1. Arquitectura General

### 1.1 Diagrama de Capas del Sistema
El siguiente diagrama representa la estructura arquitectónica implementada en el código fuente, organizada en un flujo unidireccional y desacoplado.

```mermaid
flowchart TD
    Cliente["Cliente Web (React + Vite)"]
    Rutas["Rutas (Express Router)"]
    Controladores["Controladores (HTTP / JSON)"]
    Validadores["Validadores de Entrada"]
    Servicios["Servicios de Negocio"]
    Repositorios["Repositorios SQL (pg Pool)"]
    StorageBridge["Storage Bridge (Local / Supabase)"]
    Postgres[(PostgreSQL)]

    Cliente -->|HTTP / REST| Rutas
    Rutas --> Controladores
    Controladores --> Validadores
    Controladores --> Servicios
    Servicios --> Repositorios
    Servicios --> StorageBridge
    Repositorios --> Postgres
```

### 1.2 Explicación de Cada Capa
* **Cliente Web (Frontend):** Interfaz SPA basada en componentes funcionales de React (`Front_/src/App.jsx`), que gestiona el estado, enrutamiento ligero y renderizado reactivo sin frameworks CSS pesados.
* **Rutas (Routing):** Define los endpoints REST y vincula los middlewares de autenticación y limitación de tasa con sus controladores (`Back_/src/routes/`).
* **Controladores:** Maneja el ciclo de petición y respuesta HTTP, extrayendo parámetros y retornando códigos de estado adecuados (`Back_/src/controllers/`).
* **Validadores:** Funciones puras que analizan y normalizan las entradas del usuario antes de la lógica de negocio, lanzando excepciones controladas (`Back_/src/validators/`).
* **Servicios de Negocio:** Centralizan las reglas operativas, cálculo de cuotas, invocación de correos y orquestación de almacenamiento (`Back_/src/services/`).
* **Storage Bridge:** Abstracción que desacopla la persistencia física de archivos permitiendo conmutar entre disco y la nube (`Back_/src/patterns/storageBridge/`).
* **Repositorios:** Capa de acceso a datos que ejecuta exclusivamente sentencias SQL parametrizadas a través del pool de `pg` (`Back_/src/repositories/`).
* **Base de Datos:** Motor relacional PostgreSQL encargado de garantizar la integridad y persistencia de las entidades del sistema (`Back_/src/config/db.js`).

### 1.3 Defensa de la Arquitectura
* **Justificación de la Arquitectura en Capas:** Permite una división estricta de responsabilidades en un entorno académico y profesional, facilitando que el equipo trabaje en paralelo sin colisiones en consultas SQL o vistas de interfaz.
* **Alternativas Descartadas:**
  * *Microservicios:* Se descartó por generar una sobrecarga innecesaria de infraestructura, latencia de red y complejidad de despliegue para el alcance de un proyecto semestral.
  * *Monolito no estructurado (Smart Controllers):* Se descartó tras el commit `b5ebb40`, ya que concentrar consultas SQL y lógica dentro de controladores generaba duplicación masiva y dificultad extrema de pruebas.
* **Trade-offs y Limitaciones Reales:**
  * Las dependencias entre capas en Node.js se resuelven mediante importaciones estáticas de ES Modules, lo que no ofrece inyección de dependencias dinámica en tiempo de compilación.
  * `storageService.js` mantiene responsabilidades amplias sobre archivos, carpetas y papelera, compensado mediante la delegación al patrón Bridge.

### 1.4 Principios de Diseño Aplicados
* **Cohesión:** Alta en módulos de soporte (`tokenService.js`, `passwordService.js`, `emailService.js`) y repositorios, los cuales ejecutan operaciones atómicas sobre sus entidades correspondientes.
* **Acoplamiento:** Mínimo acoplamiento vertical. Los controladores desconocen la tecnología SQL y los repositorios desconocen las peticiones HTTP (`ANALISIS_PRINCIPIOS.md`).
* **SOLID:**
  * *Single Responsibility (SRP):* Demostrado en la separación entre controladores, validadores y repositorios.
  * *Open/Closed (OCP):* Evidenciado en el Patrón Bridge (`StorageProvider.js`), donde incorporar un proveedor (ej. AWS S3) no altera la abstracción `FileStorage.js`.
  * *Liskov Substitution (LSP):* Aplicado en `LocalDiskProvider` y `SupabaseStorageProvider`, sustituibles de manera transparente por `fileStorage`.
  * *Interface Segregation (ISP):* Los contratos de los repositorios exponen únicamente los métodos requeridos por cada caso de uso.
  * *Dependency Inversion (DIP):* El servicio de archivos depende de la abstracción de almacenamiento (`fileStorage`) y no directamente de librerías del sistema de archivos.

## 2. Diagramas UML

### 2.1 Diagrama de Clases del Dominio
*Nota: Representa el modelo conceptual del dominio derivado del esquema relacional; el backend está implementado bajo un paradigma modular funcional y no mediante clases de dominio persistentes.*

```mermaid
classDiagram
    direction TD
    class Rol {
        +int id
        +string nombre
    }
    class Usuario {
        +int id
        +string nombre
        +string correo
        +string contrasenaHash
        +boolean correoVerificado
        +bigint espacioDisponible
        +bigint espacioConsumido
    }
    class Carpeta {
        +int id
        +string nombre
        +date fechaCreacion
    }
    class Archivo {
        +int id
        +string nombre
        +bigint tamano
        +string tipo
        +boolean enPapelera
    }
    class Plan {
        +int id
        +string nombre
        +decimal precio
        +bigint capacidadAlmacenamiento
    }
    class Suscripcion {
        +int id
        +date fechaInicio
        +date fechaRenovacion
        +string estado
    }
    class Pago {
        +int id
        +decimal monto
        +string estado
        +string referencia
    }

    Rol "1" <-- "*" Usuario : asignado
    Usuario "1" --> "*" Carpeta : posee
    Carpeta "0..1" <-- "*" Carpeta : anida
    Usuario "1" --> "*" Archivo : sube
    Carpeta "0..1" <-- "*" Archivo : contiene
    Usuario "1" --> "*" Suscripcion : contrata
    Plan "1" <-- "*" Suscripcion : referencia
    Suscripcion "1" --> "*" Pago : registra
```

### 2.2 Diagrama de Secuencia: Subida de Archivo
Describe la interacción sincrónica entre capas durante la recepción, validación, almacenamiento binario y registro en base de datos.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant Router as storageRoutes
    participant Ctrl as storageController
    participant Svc as storageService
    participant Bridge as fileStorage (Bridge)
    participant Repo as fileRepository

    Usuario->>UI: Selecciona archivo y envía
    UI->>Router: POST /api/storage/upload (FormData)
    Router->>Ctrl: uploadFile(req, res)
    Ctrl->>Svc: uploadFile(usuarioId, fileData)
    critical Validación de Cuota
        Svc->>Svc: Verifica espacio disponible
    end
    alt Cuota Excedida
        Svc-->>Ctrl: HttpError 400 (Espacio insuficiente)
        Ctrl-->>UI: 400 Bad Request
    else Espacio Suficiente
        Svc->>Bridge: store(archivo, tempPath)
        Bridge-->>Svc: Archivo persistido
        Svc->>Repo: createFile(metadatos)
        Repo-->>Svc: Archivo registrado
        Svc-->>Ctrl: Objeto archivo creado
        Ctrl-->>UI: 201 Created (JSON)
    end
```

### 2.3 Diagramas de Actividad

#### Actividad (a): Registro, Verificación de Correo e Inicio de Sesión
Modela el proceso de alta, control de correo no verificado y acceso al sistema.

```mermaid
flowchart TD
    Inicio([Inicio]) --> FormReg[Completar formulario registro]
    FormReg --> EnviarReg[Enviar datos al servidor]
    EnviarReg --> CorreoExiste{¿Correo ya registrado?}
    CorreoExiste -- Sí --> ErrDup[Mostrar error 409] --> FormReg
    CorreoExiste -- No --> CrearPend[Crear usuario y token]
    CrearPend --> EnvMail[Enviar correo verificación]
    EnvMail --> EsperaToken[Abrir enlace desde correo]
    EsperaToken --> ValToken{¿Token válido y vigente?}
    ValToken -- No --> ErrTok[Error de verificación] --> FinErr([Fin])
    ValToken -- Sí --> Activar[Marcar correo verificado]
    Activar --> Login[Ingresar credenciales login]
    Login --> VerifOK{¿Credenciales y correo OK?}
    VerifOK -- No --> Bloqueo[Rechazar acceso HTTP 403] --> Login
    VerifOK -- Sí --> Sesion[Emitir JWT y abrir Dashboard]
    Sesion --> Fin([Fin])
```

#### Actividad (b): Eliminación, Restauración y Vaciado de Papelera
Modela el ciclo de vida de los archivos eliminados lógicamente y su purga definitiva.

```mermaid
flowchart TD
    Inicio([Inicio]) --> Accion{Seleccionar acción}
    Accion -- Mover a papelera --> MarcarPap[Marcar en_papelera = TRUE]
    MarcarPap --> Fin([Fin])
    Accion -- Restaurar --> QuitarPap[Marcar en_papelera = FALSE]
    QuitarPap --> Fin
    Accion -- Borrado individual --> Confirm1{¿Confirma eliminación?}
    Confirm1 -- No --> Fin
    Confirm1 -- Sí --> Purgar1[Borrar de BD y disco físico]
    Purgar1 --> Libera1[Restar espacio consumido] --> Fin
    Accion -- Vaciar papelera --> Confirm2{¿Confirma vaciado total?}
    Confirm2 -- No --> Fin
    Confirm2 -- Sí --> PurgarAll[Eliminar todos los de papelera]
    PurgarAll --> LiberaAll[Restar total de bytes liberados] --> Fin
```

## 3. Modelo Entidad-Relación

### 3.1 Diagrama ER: Módulo de Usuarios, Planes y Pagos
Muestra las entidades vinculadas a cuentas, roles y transacciones comerciales según `database/inicializacion/schema.sql`.

```mermaid
erDiagram
    ROL ||--o{ USUARIO : asigna
    PLAN ||--o{ SUSCRIPCION : define
    USUARIO ||--o{ SUSCRIPCION : contrata
    USUARIO ||--o{ PAGO : abona
    SUSCRIPCION ||--o{ PAGO : genera

    ROL {
        int id PK
        string nombre UK
    }
    USUARIO {
        int id PK
        int rol_id FK
        string nombre
        string correo UK
        string contrasena_hash
        boolean correo_verificado
        bigint espacio_disponible
        bigint espacio_consumido
    }
    PLAN {
        int id PK
        string nombre UK
        decimal precio
        bigint capacidad_almacenamiento
        int vigencia_dias
        boolean activo
    }
    SUSCRIPCION {
        int id PK
        int usuario_id FK
        int plan_id FK
        date fecha_inicio
        date fecha_renovacion
        string estado
    }
    PAGO {
        int id PK
        int usuario_id FK
        int suscripcion_id FK
        decimal monto
        string estado
        string referencia UK
        string tarjeta_ultimos4
    }
```

### 3.2 Diagrama ER: Módulo de Almacenamiento (Carpetas y Archivos)
Muestra la organización jerárquica de carpetas y el almacenamiento de metadatos de archivos.

```mermaid
erDiagram
    USUARIO ||--o{ CARPETA : posee
    USUARIO ||--o{ ARCHIVO : sube
    CARPETA ||--o{ ARCHIVO : clasifica
    CARPETA ||--o{ CARPETA : anida

    CARPETA {
        int id PK
        int usuario_id FK
        int carpeta_padre_id FK
        string nombre
        date fecha_creacion
    }
    ARCHIVO {
        int id PK
        int usuario_id FK
        int carpeta_id FK
        string nombre
        bigint tamano
        string tipo
        date fecha_subida
        boolean en_papelera
        date fecha_eliminacion
    }
```

## 4. Diseño de Base de Datos

### 4.1 Diccionario de Tablas

| Tabla | Propósito | Columnas principales | Relaciones |
|---|---|---|---|
| `rol` | Define niveles de autorización | `id` (INT PK), `nombre` (VARCHAR) | `1:N` con `usuario` |
| `usuario` | Registro de credenciales y cuotas | `id` (INT PK), `rol_id` (INT FK), `correo` (VARCHAR), `espacio_disponible` (BIGINT) | `N:1` con `rol`, `1:N` con archivos |
| `carpeta` | Organización jerárquica | `id` (INT PK), `usuario_id` (INT FK), `carpeta_padre_id` (INT FK), `nombre` (VARCHAR) | `N:1` con `usuario`, reflexiva consigo misma |
| `archivo` | Metadatos de archivos subidos | `id` (INT PK), `usuario_id` (INT FK), `carpeta_id` (INT FK), `nombre` (VARCHAR), `tamano` (BIGINT) | `N:1` con `usuario`, `N:1` con `carpeta` |
| `plan` | Oferta comercial de almacenamiento | `id` (INT PK), `nombre` (VARCHAR), `precio` (NUMERIC), `capacidad_almacenamiento` (BIGINT) | `1:N` con `suscripcion` |
| `suscripcion`| Planes activos o pasados de usuarios | `id` (INT PK), `usuario_id` (INT FK), `plan_id` (INT FK), `estado` (VARCHAR) | `N:1` con `usuario`, `N:1` con `plan` |
| `pago` | Registro de transacciones simuladas | `id` (INT PK), `usuario_id` (INT FK), `suscripcion_id` (INT FK), `monto` (NUMERIC) | `N:1` con `usuario` y `suscripcion` |

### 4.2 Restricciones, Índices y Vistas
* **Restricciones Check:**
  * `chk_usuario_espacio_consumido`: `espacio_consumido >= 0`.
  * `chk_usuario_espacio_disponible`: `espacio_disponible >= 0`.
  * `chk_archivo_tamano`: `tamano >= 0`.
  * `chk_suscripcion_estado`: estados permitidos `'pendiente'`, `'activa'`, `'vencida'`, `'cancelada'`.
  * `chk_pago_tarjeta_ultimos4`: valida formato de 4 dígitos con expresión regular `^[0-9]{4}$`.
* **Índices Estratégicos:**
  * `idx_archivo_usuario_id`, `idx_archivo_carpeta_id`: optimizan la búsqueda en directorios.
  * `idx_archivo_papelera`: índice compuesto `(usuario_id, en_papelera)` para filtrado rápido en papelera.
  * `uq_suscripcion_activa_por_usuario`: índice único parcial para garantizar un único plan activo simultáneo.
* **Vistas Implementadas:**
  * `v_suscripcion_actual`: combina `suscripcion` y `plan` calculando `dias_restantes` para el perfil del cliente.
  * `v_historial_pagos`: combina `pago`, `suscripcion` y `plan` para auditoría y consulta de facturación.

### 4.3 Decisiones de Diseño Relevantes
* **Separación de binarios y metadatos:** Los archivos se conservan en disco o Supabase Storage y solo sus metadatos residen en PostgreSQL, evitando la saturación del motor con tipos BLOB.
* **Borrado lógico en papelera:** Se implementa con las columnas `en_papelera` y `fecha_eliminacion`, permitiendo recuperar archivos sin pérdida física de datos.
* **Estructura jerárquica reflexiva:** La columna `carpeta_padre_id` nula en `carpeta` permite subcarpetas infinitas asociadas a la raíz de forma natural.
* **Clave de archivo determinista en almacenamiento:** La clave física se calcula como `<id>.<ext>`, evitando colisiones por nombres duplicados entre usuarios.

<!-- SALTO DE PÁGINA -->

# Manual Técnico

## 1. Tecnologías Utilizadas

| Tecnología | Versión | Uso en el Sistema | Archivo donde se declara |
|---|---|---|---|
| **Node.js** | `>= 20.x` (Pruebas en v24) | Entorno de ejecución de backend | `Back_/package.json` |
| **Express** | `^5.2.1` | Framework HTTP y enrutamiento REST | `Back_/package.json` |
| **PostgreSQL** | `15+` / `16` | Motor de base de datos relacional | `database/inicializacion/schema.sql` |
| **pg (node-postgres)** | `^8.23.0` | Cliente de conexión y pool SQL | `Back_/package.json` |
| **React** | `^19.2.8` | Biblioteca de interfaz gráfica SPA | `Front_/package.json` |
| **Vite** | `^8.3.0` | Empaquetador y servidor de desarrollo front | `Front_/package.json` |
| **Multer** | `^2.4.0` | Manejo de cargas multipart/form-data | `Back_/package.json` |
| **Nodemailer** | `^10.0.11` | Envío de correos SMTP transaccionales | `Back_/package.json` |
| **jsonwebtoken** | `^9.0.3` | Generación y validación de tokens JWT | `Back_/package.json` |
| **bcryptjs** | `^3.0.3` | Cifrado unidireccional de contraseñas | `Back_/package.json` |
| **Docker** | `v20+` | Contenerización del backend para despliegue | `Back_/Dockerfile` |

## 2. Instalación

### 2.1 Requisitos Previos
* Node.js versión 20.x o superior instalado en el equipo.
* PostgreSQL instalado localmente o servicio activo en la nube (Supabase / Neon).
* Gestor de paquetes `npm`.
* Cuenta SMTP transaccional (Brevo, Mailtrap o cuenta Google con contraseña de aplicación).

### 2.2 Pasos de Instalación
1. Clonar el repositorio localmente y abrir una terminal en la raíz del proyecto.
2. Instalar dependencias del Backend:
   ```bash
   cd Back_
   npm install
   ```
3. Instalar dependencias del Frontend:
   ```bash
   cd ../Front_
   npm install
   cd ..
   ```
4. Configurar el archivo de entorno del backend copiando la plantilla:
   ```bash
   cp Back_/.env.example Back_/.env
   ```
5. Inicializar la base de datos (creación de base de datos, tablas e índices):
   ```bash
   cd Back_
   npm run db:init
   ```

## 3. Configuración

### 3.1 Variables de Entorno del Backend (`Back_/.env`)

| Variable | Descripción | Ejemplo ficticio | Obligatoria |
|---|---|---|---|
| `PORT` | Puerto de escucha del servidor Express | `5000` | No (def: 5000) |
| `NODE_ENV` | Entorno de ejecución (`development`/`production`) | `development` | No |
| `FRONTEND_URL` | URL base de la interfaz para enlaces de correo | `http://localhost:5173` | Sí |
| `CORS_ORIGIN` | Origen permitido para solicitudes cross-origin | `http://localhost:5173` | No |
| `DB_HOST` | Host del servidor PostgreSQL local | `localhost` | Sí (si no hay URI) |
| `DB_PORT` | Puerto de PostgreSQL | `5432` | No (def: 5432) |
| `DB_USER` | Usuario de base de datos | `postgres_user` | Sí (modo local) |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `mi_password_segura` | Sí (modo local) |
| `DB_NAME` | Nombre de la base de datos | `almacenamiento_db` | Sí (modo local) |
| `DATABASE_URL` | Cadena URI de conexión (Supabase/Neon/Render) | `postgresql://usr:pwd@host:5432/db` | No (prioritaria) |
| `DB_SSL` | Forzar conexión segura SSL (`true`/`false`) | `false` | No |
| `JWT_SECRET` | Clave secreta para firmar tokens de sesión | `clave_secreta_jwt_ficticia_123` | Sí |
| `JWT_EXPIRES_IN` | Vigencia de la sesión | `7d` | No (def: 7d) |
| `SMTP_HOST` | Servidor SMTP transaccional | `smtp-relay.brevo.com` | Sí |
| `SMTP_PORT` | Puerto del servicio SMTP (`587`, `465` o `2525`) | `587` | Sí |
| `SMTP_USER` | Usuario o identificador SMTP | `usuario_smtp@ejemplo.com` | Sí |
| `SMTP_PASS` | Contraseña o token del proveedor de correo | `xsmtp_token_ejemplo` | Sí |
| `EMAIL_FROM` | Remitente visible en los correos | `VinCloud <no-reply@dominio.com>` | Sí |
| `STORAGE_DRIVER`| Controlador del Patrón Bridge (`local` o `supabase`)| `local` | No (def: local) |
| `UPLOAD_DIR` | Directorio físico para archivos en modo local | `Back_/uploads` | No |
| `SUPABASE_URL` | URL del proyecto Supabase Storage | `https://xyz.supabase.co` | Sí (si driver=supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para Supabase Storage | `sb_secret_ejemplo_123` | Sí (si driver=supabase) |
| `SUPABASE_BUCKET`| Bucket de almacenamiento | `archivos` | No (def: archivos) |
| `MAX_UPLOAD_MB` | Límite máximo en MB por archivo en servidor | `50` | No |

### 3.2 Inicialización de Base de Datos y Primer Administrador
* El script `Back_/src/scripts/initDb.js` ejecuta `database/inicializacion/schema.sql` y `database/datos-iniciales/seed.sql`.
* **Creación del Primer Administrador:**
  * Al registrarse mediante `POST /api/auth/register`, el backend acepta el atributo opcional `tipoCuenta: "administrador"`. Si se envía este valor, la cuenta se crea automáticamente con el rol `Administrador` (`Back_/src/services/authService.js`).
  * Alternativamente, tras crear una cuenta estándar, se puede promover desde PostgreSQL:
    ```sql
    UPDATE usuario SET rol_id = (SELECT id FROM rol WHERE nombre = 'Administrador') WHERE correo = 'admin@correo.com';
    ```

### 3.3 Ejecución en Local y Estructura de Carpetas

Comandos de ejecución en dos terminales independientes:
* Terminal Backend: `cd Back_ && npm run dev` (disponible en `http://localhost:5000`).
* Terminal Frontend: `cd Front_ && npm run dev` (disponible en `http://localhost:5173`).

```text
Servicio-de-Almacenamiento/
├── Back_/                      # Backend Node.js / Express
│   ├── src/                    # Código fuente en capas (routes, controllers, services, repositories)
│   ├── uploads/                # Directorio de persistencia física de archivos locales
│   └── Dockerfile              # Empaquetado en contenedor para producción
├── Front_/                     # Frontend React / Vite
│   ├── src/                    # Componentes, vistas del dashboard, estilos y servicios API
│   └── package.json            # Dependencias del cliente web
├── database/                   # Definición de base de datos
│   ├── inicializacion/         # Scripts DDL (schema.sql)
│   └── datos-iniciales/        # Datos semilla iniciales (seed.sql)
├── docs/                       # Documentación técnica y guías de despliegue
├── render.yaml                 # Blueprint de infraestructura como código para Render
└── netlify.toml                # Configuración de despliegue estático alternativo
```

### 3.4 Resumen de la API REST

| Método | Ruta | Rol Requerido | Propósito |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registro de usuarios nuevos |
| `POST` | `/api/auth/login` | Público | Inicio de sesión y entrega de JWT |
| `GET` | `/api/auth/me` | Autenticado | Perfil del usuario autenticado |
| `POST` | `/api/auth/verify-email` | Público | Confirmación de correo mediante token |
| `POST` | `/api/auth/resend-verification` | Público | Reenvío de correo de activación |
| `POST` | `/api/auth/forgot-password` | Público | Solicitud de recuperación de contraseña |
| `POST` | `/api/auth/reset-password` | Público | Cambio de contraseña con token |
| `POST` | `/api/storage/upload` | Autenticado | Carga de archivos físicos a la plataforma |
| `GET` | `/api/storage/files` | Autenticado | Listado de archivos por carpeta |
| `GET` | `/api/storage/files/recent` | Autenticado | Consulta de archivos recientes |
| `GET` | `/api/storage/files/search` | Autenticado | Búsqueda por nombre |
| `GET` | `/api/storage/files/:id/view` | Autenticado | Previsualización de archivo en navegador |
| `GET` | `/api/storage/files/:id/download` | Autenticado | Descarga de archivo físico |
| `PATCH` | `/api/storage/files/:id` | Autenticado | Renombrar archivo |
| `DELETE` | `/api/storage/files/:id` | Autenticado | Envío de archivo a papelera |
| `POST` | `/api/storage/files/:id/share` | Autenticado | Creación de enlace de compartición |
| `GET` | `/api/storage/shared/:token` | Público | Lectura de metadatos de archivo compartido |
| `GET` | `/api/storage/shared/:token/download` | Público | Descarga pública de archivo compartido |
| `GET` | `/api/storage/trash` | Autenticado | Listar archivos en papelera |
| `POST` | `/api/storage/trash/:id/restore`| Autenticado | Restaurar archivo de la papelera |
| `DELETE` | `/api/storage/trash/:id` | Autenticado | Borrado físico definitivo de un archivo |
| `DELETE` | `/api/storage/trash` | Autenticado | Vaciado total de papelera |
| `POST` | `/api/storage/folders` | Autenticado | Crear nueva carpeta |
| `PATCH` | `/api/storage/folders/:id` | Autenticado | Renombrar carpeta |
| `DELETE` | `/api/storage/folders/:id` | Autenticado | Eliminar carpeta y contenidos en cascada |
| `GET` | `/api/subscriptions/plans` | Público | Catálogo comercial con cálculo Decorator |
| `POST` | `/api/subscriptions/subscribe` | Autenticado | Contratar o cambiar plan de suscripción |
| `POST` | `/api/subscriptions/renew` | Autenticado | Renovar plan activo |
| `POST` | `/api/subscriptions/cancel` | Autenticado | Cancelar plan activo |
| `GET` | `/api/subscriptions/payments` | Autenticado | Historial de pagos del usuario |
| `GET` | `/api/admin/reports` | Administrador | Métricas operativas de CPU, memoria y disco |
| `GET` | `/api/admin/users` | Administrador | Listar usuarios y estado de cuotas |
| `PATCH` | `/api/admin/users/:id` | Administrador | Modificar rol o cuota de un usuario |
| `DELETE` | `/api/admin/users/:id` | Administrador | Eliminar usuario y purgar sus archivos |
| `GET` | `/api/admin/plans` | Administrador | Catálogo de planes para gestión |
| `POST` | `/api/admin/plans` | Administrador | Crear nuevo plan de suscripción |
| `PATCH` | `/api/admin/plans/:id` | Administrador | Editar precio o capacidad de un plan |
| `GET` | `/api/health` | Público | Monitoreo de estado y conectividad a base de datos |

### 3.5 Problemas Comunes y Soluciones
* **Falla de conexión a PostgreSQL:** En entornos locales, revisar que el servicio PostgreSQL esté iniciado y coincida la contraseña en `Back_/.env`. En conexiones remotas (Supabase), utilizar el puerto del *Session Pooler* con IPv4 y activar `DB_SSL=true`.
* **Correos en carpeta de Spam:** Al utilizar servidores SMTP compartidos con remitentes `@gmail.com`, Google suele clasificarlos en Spam. Para pruebas inmediatas, los enlaces se imprimen automáticamente en la consola del servidor backend (`Back_/src/services/emailService.js`).
* **Error de CORS en navegador:** Ocurre cuando `FRONTEND_URL` o `CORS_ORIGIN` en el backend no coinciden con el puerto asignado por Vite (`http://localhost:5173`).
* **Límite de subida de Multer superado:** El backend rechaza por seguridad archivos mayores al valor de `MAX_UPLOAD_MB` o con extensiones ejecutables prohibidas.

## 4. Despliegue

### 4.1 Infraestructura de Despliegue en la Nube
El proyecto incluye automatización de infraestructura como código mediante Render Blueprint (`render.yaml`), Dockerfile de backend y configuración estática para Netlify:
* **Backend:** Empaquetado mediante `Back_/Dockerfile` en Node.js 20 Alpine y desplegado como Web Service en Render (`vincloud-api`).
* **Base de Datos:** PostgreSQL administrado en Supabase con conexión mediante Session Pooler (`DATABASE_URL`).
* **Persistencia de Archivos:** Dado que el disco del plan gratuito de Render es efímero y se reinicia periódicamente, el sistema activa el **Patrón Bridge** configurando `STORAGE_DRIVER=supabase`. Los binarios se guardan en el bucket privado `archivos` de Supabase Storage mediante credenciales seguras de servicio (`SUPABASE_SERVICE_ROLE_KEY`), garantizando persistencia permanente entre despliegues.
* **Frontend:** Desplegable como sitio estático en Render (`vincloud-web`) o en Netlify mediante `netlify.toml`, ejecutando `npm run build` y redirigiendo rutas hacia `/index.html`.

[PENDIENTE: URL pública activa del despliegue en producción]

