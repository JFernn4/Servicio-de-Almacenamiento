# Documento de Requisitos

## 1. Introducción
El sistema **VinCloud** es una plataforma web de Almacenamiento como Servicio (*Storage as a Service* / PaaS) desarrollada como proyecto final del curso de Ingeniería de Software I en la Universidad Rafael Landívar. Su propósito es brindar a usuarios individuales y organizacionales un espacio virtual seguro para almacenar, estructurar en carpetas jerárquicas, previsualizar, compartir y recuperar archivos en la nube, incorporando control de cuotas, planes de suscripción y supervisión administrativa. El presente documento especifica los requisitos funcionales, no funcionales y casos de uso verificados en el sistema implementado.

## 2. Alcance

### 2.1 Funcionalidades entregadas
En su versión actual, VinCloud cubre el ciclo completo de gestión de cuentas y seguridad, incluyendo el registro de usuarios con asignación de cuota base gratuita de 5 GB, la verificación obligatoria de correo electrónico mediante enlace firmado, el inicio de sesión con tokens JWT y huella de contraseña, el reenvío de activación y la recuperación de credenciales en dos pasos. Sobre la gestión documental, ofrece carga individual o múltiple de archivos (mediante selector y arrastrar y soltar) con validación de extensiones prohibidas y límites de tamaño, organización en carpetas anidadas con navegación por migas de pan, previsualización en navegador, descarga y renombrado mediante diálogos gráficos propios.

La plataforma incluye también una papelera de reciclaje unificada para archivos y carpetas con borrado lógico, preservando intacto el subárbol interno de las carpetas enviadas a papelera para su posterior restauración selectiva, eliminación definitiva o vaciado total con liberación de espacio. Para la compartición de contenido, incorpora un modal que genera enlaces públicos firmados con vigencia dinámica según el plan del remitente y permite enviar invitaciones directas por correo electrónico, habilitando el acceso a destinatarios e invitados sin requerir inicio de sesión.

En el ámbito comercial y administrativo, el sistema integra dinámicamente el catálogo de planes desde PostgreSQL tanto en la página de bienvenida como en el panel del cliente, permitiendo contratar, cambiar, renovar y cancelar suscripciones mediante una pasarela de pagos conectada a transacciones ACID, reflejando de inmediato la nueva cuota en la barra de uso y el historial de pagos. Finalmente, el panel de administración provee monitoreo en vivo de usuarios activos, espacio físico en almacenamiento frente a la capacidad contratada, suscripciones activas, ingresos mensuales recurrentes (MRR) y pagos recientes, junto con gestión de cuentas, roles, cuotas y edición completa de planes.

### 2.2 Funcionalidades fuera de alcance o pendientes
Queda fuera del alcance de esta entrega el procesamiento de cobros bancarios reales con pasarelas externas como Stripe o PayPal, por lo que las transacciones operan bajo un simulador controlado que valida tarjetas de prueba y registra intentos aprobados o rechazados. Asimismo, aunque la base de datos almacena la fecha de eliminación en la papelera, no existe un proceso automático programado (*cron job*) que purgue los elementos tras 30 días, ejecutándose la limpieza definitiva únicamente bajo confirmación del usuario.

Las capacidades comerciales promocionadas (50 GB, 200 GB y 1 TB) representan cuotas simuladas del modelo de negocio, ya que la infraestructura gratuita empleada para el despliegue en producción impone un límite global de 1 GB y 50 MB por archivo. Tampoco forman parte de la versión actual el traslado manual de archivos entre carpetas, la descarga de carpetas completas comprimidas en formato ZIP, el control de versiones de archivos ni un rol formal de invitado persistido en base de datos.

## 3. Requisitos Funcionales

| ID | Requisito | Módulo | Estado |
|---|---|---|---|
| RF-01 | Registrar cuenta nueva con nombre, correo, contraseña y tipo de cuenta | Usuarios | Implementado |
| RF-02 | Enviar correo con enlace firmado (24h) para verificación obligatoria de cuenta | Usuarios | Implementado |
| RF-03 | Bloquear inicio de sesión y acceso API a usuarios sin correo verificado | Usuarios | Implementado |
| RF-04 | Iniciar sesión y emitir token JWT con huella de contraseña (`pwd`) | Usuarios | Implementado |
| RF-05 | Reenviar correo de verificación a cuentas pendientes | Usuarios | Implementado |
| RF-06 | Solicitar recuperación de contraseña por correo con token de 30 minutos | Usuarios | Implementado |
| RF-07 | Restablecer contraseña invalidando enlaces anteriores | Usuarios | Implementado |
| RF-08 | Subir uno o varios archivos validando cuota, límites del plan y extensiones | Almacenamiento | Implementado |
| RF-09 | Crear, navegar, renombrar y enviar carpetas a papelera | Almacenamiento | Implementado |
| RF-10 | Listar archivos y carpetas activos filtrados por carpeta actual | Almacenamiento | Implementado |
| RF-11 | Descargar archivos físicos y previsualizar en navegador (`inline`) | Almacenamiento | Implementado |
| RF-12 | Renombrar archivos actualizando su extensión física mediante Bridge | Almacenamiento | Implementado |
| RF-13 | Mover archivos y carpetas a papelera mediante borrado lógico | Almacenamiento | Implementado |
| RF-14 | Restaurar archivos y carpetas desde la papelera preservando su subárbol | Almacenamiento | Implementado |
| RF-15 | Eliminar archivos o carpetas definitivamente liberando bytes y cuota | Almacenamiento | Implementado |
| RF-16 | Vaciar toda la papelera (archivos y carpetas) en una operación | Almacenamiento | Implementado |
| RF-17 | Visualizar uso de almacenamiento con barra porcentual y espacio libre exacto | Almacenamiento | Implementado |
| RF-18 | Compartir archivos vía enlace público JWT o invitación por correo | Almacenamiento | Implementado |
| RF-19 | Visualizar y descargar archivos compartidos sin iniciar sesión | Almacenamiento | Implementado |
| RF-20 | Consultar archivos recientes y buscar archivos por nombre | Almacenamiento | Implementado |
| RF-21 | Cargar dinámicamente planes activos del catálogo en Landing y Dashboard | Suscripciones | Implementado |
| RF-22 | Contratar o cambiar plan mediante pasarela conectada a transacción ACID | Suscripciones | Implementado |
| RF-23 | Renovar suscripción activa extendiendo vigencia y registrando pago | Suscripciones | Implementado |
| RF-24 | Cancelar suscripción activa restaurando el plan gratuito base (5 GB) | Suscripciones | Implementado |
| RF-25 | Consultar historial de pagos aprobados y rechazados del usuario | Suscripciones | Implementado |
| RF-26 | Supervisar reporte en vivo: usuarios, almacenamiento en nube/cuota, MRR e ingresos | Administración | Implementado |
| RF-27 | Consultar tabla de últimos pagos e ingresos desglosados por plan | Administración | Implementado |
| RF-28 | Listar usuarios, buscar, cambiar roles, editar cuotas en GB y eliminar cuentas | Administración | Implementado |
| RF-29 | Crear, activar/desactivar y editar todos los campos de un plan existente | Administración | Implementado |
| RF-30 | Sincronizar automáticamente cuota de suscriptores activos al editar capacidad de plan | Administración | Implementado |

## 4. Requisitos No Funcionales

| ID | Categoría | Requisito | Cómo se cumple o evidencia | Estado |
|---|---|---|---|---|
| RNF-01 | Seguridad | Hash seguro de contraseñas | Cifrado unidireccional con sal (`bcryptjs`, 10 rondas) en `Back_/src/services/passwordService.js` | Implementado |
| RNF-02 | Seguridad | Autenticación sin estado mediante tokens | JWT firmados (`HS256`) validados en `Back_/src/middlewares/authMiddleware.js` | Implementado |
| RNF-03 | Seguridad | Invalidación inmediata de sesiones y enlaces | Huella de contraseña (`pwd`) en JWT verificada contra la BD en cada petición | Implementado |
| RNF-04 | Seguridad | Mitigación de fuerza bruta en endpoints sensibles | Limitadores de tasa en memoria en `Back_/src/middlewares/rateLimitMiddleware.js` | Implementado |
| RNF-05 | Seguridad | Validación estricta y saneamiento de entradas | Validadores dedicados por dominio en `Back_/src/validators/` | Implementado |
| RNF-06 | Seguridad | Bloqueo de ejecutables peligrosos y límites de carga | Lista negra de extensiones y topes dinámicos en `Back_/src/middlewares/uploadMiddleware.js` | Implementado |
| RNF-07 | Integridad | Atomicidad en transacciones comerciales y cuotas | Transacciones `withTransaction` (`BEGIN/COMMIT/ROLLBACK`) en `Back_/src/repositories/subscriptionRepository.js` | Implementado |
| RNF-08 | Portabilidad | Abstracción del almacenamiento físico | **Patrón Bridge** (`StorageProvider`) en `Back_/src/patterns/storageBridge/` | Implementado |
| RNF-09 | Extensibilidad | Políticas comerciales extensibles sin subclasificación rígida | **Patrón Decorator** en `Back_/src/patterns/planDecorator.js` | Implementado |
| RNF-10 | Mantenibilidad | Arquitectura limpia en capas y modularidad UI | Separación en `Back_/src/` y subcomponentes en `Front_/src/components/dashboard/` | Implementado |

## 5. Casos de Uso

### 5.1 Diagramas de Casos de Uso por Actor
La siguiente especificación actualiza el modelado original de casos de uso separando las interacciones reales verificadas para cada actor en el sistema.

#### Casos de Uso del Invitado / Visitante
El visitante no autenticado consulta el catálogo comercial público en la página de inicio y accede a archivos compartidos mediante enlaces firmados sin necesidad de poseer una cuenta en base de datos.

```mermaid
flowchart LR
    Invitado((Invitado))
    CU01["Consultar catalogo de planes"]
    CU02["Registrarse y verificar correo"]
    CU03["Iniciar sesion o recuperar clave"]
    CU04["Visualizar archivo compartido"]
    CU05["Descargar archivo compartido"]

    Invitado --> CU01
    Invitado --> CU02
    Invitado --> CU03
    Invitado --> CU04
    Invitado --> CU05
```

#### Casos de Uso del Cliente
El cliente autenticado administra sus archivos y carpetas, gestiona su papelera de reciclaje, comparte contenido y contrata o renueva planes de almacenamiento.

```mermaid
flowchart LR
    Cliente((Cliente))
    CU06["Subir descargar y visualizar"]
    CU07["Organizar y renombrar carpetas"]
    CU08["Gestionar papelera archivos y carpetas"]
    CU09["Compartir por enlace o correo"]
    CU10["Contratar renovar o cancelar plan"]
    CU11["Consultar cuota e historial pagos"]

    Cliente --> CU06
    Cliente --> CU07
    Cliente --> CU08
    Cliente --> CU09
    Cliente --> CU10
    Cliente --> CU11
```

#### Casos de Uso del Administrador
El administrador supervisa métricas globales de infraestructura e ingresos en vivo, gestiona cuentas de usuario y administra el catálogo comercial de planes.

```mermaid
flowchart LR
    Admin((Administrador))
    CU12["Consultar reporte ingresos y nube"]
    CU13["Listar y buscar usuarios"]
    CU14["Modificar cuota y rol usuario"]
    CU15["Eliminar cuenta usuario"]
    CU16["Crear editar y activar planes"]

    Admin --> CU12
    Admin --> CU13
    Admin --> CU14
    Admin --> CU15
    Admin --> CU16
```

### 5.2 Tabla Resumen de Casos de Uso

| ID | Caso de Uso | Actor | Descripción breve | Estado |
|---|---|---|---|---|
| CU-01 | Registro y verificación | Visitante | Crea cuenta, recibe enlace firmado (24h) y activa acceso | Implementado |
| CU-02 | Inicio de sesión | Cliente / Admin | Autentica credenciales verificadas y emite JWT | Implementado |
| CU-03 | Recuperación de contraseña | Visitante | Solicita correo (30m) y define nueva clave invalidando sesiones | Implementado |
| CU-04 | Subir archivo | Cliente | Valida cuota y límites Decorator/Multer y persiste binario vía Bridge | Implementado |
| CU-05 | Descargar / Visualizar | Cliente | Transmite stream binario propio en descarga o vista inline | Implementado |
| CU-06 | Organizar y renombrar | Cliente | Crea carpetas anidadas y renombra elementos mediante diálogo modal | Implementado |
| CU-07 | Gestionar papelera | Cliente | Envía archivos/carpetas a papelera, restaura o purga | Implementado |
| CU-08 | Compartir archivo | Cliente / Invitado | Genera token según plan y da acceso directo al invitado sin login | Implementado |
| CU-09 | Contratar / Renovar plan | Cliente | Procesa pago en pasarela conectada a BD y actualiza cuota ACID | Implementado |
| CU-10 | Reporte general e ingresos | Administrador | Consulta métricas de almacenamiento en nube, MRR, suscripciones y pagos | Implementado |
| CU-11 | Administrar catálogo planes | Administrador | Crea, edita todos los campos y activa o desactiva planes | Implementado |
| CU-12 | Administrar usuarios | Administrador | Ajusta cuotas en GB, alterna roles o elimina cuentas | Implementado |

### 5.3 Especificación de Casos de Uso Clave

#### CU-01: Registro de usuario y verificación de correo
**Precondición:** El visitante no posee una cuenta previa con el correo ingresado.  
**Flujo Principal:**
1. El visitante completa el formulario de registro y envía sus datos al servidor.
2. El backend valida los campos, cifra la contraseña, inserta el registro con verificación pendiente y asigna la cuota base de 5 GB.
3. El sistema firma un token de verificación válido por 24 horas y envía el correo electrónico correspondiente.
4. Al abrir el enlace recibido, el servidor valida el token, marca el correo como verificado y envía un mensaje de bienvenida.

**Flujo Alterno:** Si el correo ya existe en PostgreSQL, la restricción de unicidad detiene la operación y se informa el error HTTP 409 al usuario.

#### CU-02: Inicio de sesión
**Precondición:** Cuenta existente con correo electrónico verificado.  
**Flujo Principal:**
1. El usuario introduce correo y contraseña en la pantalla de acceso.
2. El servidor verifica el hash de la contraseña y comprueba que la verificación de correo esté completa.
3. El sistema emite un token JWT que incluye identificador, rol y huella actual de contraseña.
4. La aplicación almacena la sesión y dirige al usuario al panel de cliente o de administración según su rol.

**Flujo Alterno:** Si la cuenta aún no ha verificado su correo, el acceso es rechazado con HTTP 403 y se habilita la opción de reenvío del enlace de activación.

#### CU-04: Subir archivo
**Precondición:** Cliente autenticado con espacio disponible suficiente en su cuota.  
**Flujo Principal:**
1. El cliente selecciona o arrastra uno o más archivos en su directorio actual.
2. El middleware de carga consulta el plan decorado del usuario y ajusta dinámicamente el tamaño máximo y la cantidad de archivos permitidos, respetando el tope global configurado en el servidor.
3. El servicio de almacenamiento comprueba que la suma del espacio consumido y el archivo nuevo no supere la cuota asignada.
4. Se registran los metadatos en PostgreSQL, el Patrón Bridge persiste los bytes en el proveedor configurado y se incrementa el espacio consumido.

**Flujo Alterno:** Si el archivo excede la cuota o posee una extensión ejecutable prohibida, se elimina el temporal y se responde HTTP 400.

#### CU-07: Gestionar papelera de archivos y carpetas
**Precondición:** El archivo o carpeta pertenece al usuario autenticado.  
**Flujo Principal:**
1. Al solicitar la eliminación de un elemento activo, el sistema realiza un borrado lógico marcándolo en papelera con su fecha; en carpetas, su contenido interno permanece intacto pero oculto.
2. Desde la vista de papelera, el usuario puede restaurar el elemento; si se trata de una carpeta cuyo directorio padre continúa en papelera, el sistema la ubica en la raíz del usuario.
3. Si solicita eliminación definitiva o vaciado total, se borran los registros en PostgreSQL, se descuentan los bytes liberados y el Patrón Bridge elimina los binarios físicos.

**Flujo Alterno:** Si el usuario cancela en el diálogo de confirmación visual, el elemento permanece en su estado actual.

#### CU-08: Compartir archivo mediante enlace o invitación
**Precondición:** El archivo debe encontrarse activo fuera de la papelera.  
**Flujo Principal:**
1. Desde el modal de compartición, el usuario decide si desea enviar una invitación por correo a otro usuario registrado o generar únicamente un enlace público.
2. El backend calcula la vigencia del enlace a partir del plan decorado del propietario (24 horas, 7, 30 o 365 días) y firma un token temporal.
3. Cuando se indica un destinatario válido, el sistema despacha un correo de invitación y entrega la URL al cliente para copiarla al portapapeles.
4. El receptor abre el enlace en su navegador, donde la vista compartida consulta los metadatos públicos y habilita la visualización o descarga sin requerir sesión.

**Flujo Alterno:** Si el correo destinatario no existe se devuelve HTTP 404; si el token superó su vigencia al abrirlo se muestra aviso de caducidad.

#### CU-09: Contratar, renovar o cancelar plan de suscripción
**Precondición:** Cliente autenticado con correo verificado.  
**Flujo Principal:**
1. En la sección de suscripciones, el cliente visualiza los planes activos cargados desde PostgreSQL y elige contratar, cambiar o renovar su plan.
2. Completa los datos de tarjeta en la pasarela de pagos conectada a la API REST.
3. El backend aplica el Patrón Decorator para calcular precio y capacidad, ejecuta una transacción ACID registrando la suscripción activa y el pago aprobado, y actualiza la cuota del usuario.
4. La interfaz refresca la barra lateral de almacenamiento con la nueva capacidad y el panel de administrador refleja el ingreso en tiempo real.

**Flujo Alterno:** Si se simula un rechazo bancario (tarjeta terminada en `0000`), el intento se registra en el historial con estado rechazado y se responde HTTP 402 sin activar la suscripción.

#### CU-11: Administrar y editar planes existentes
**Precondición:** Sesión activa con rol Administrador.  
**Flujo Principal:**
1. El administrador ingresa al catálogo de planes dentro de su panel de gestión.
2. Selecciona editar un plan para abrir el modal con sus atributos actuales: nombre, descripción, precio en Quetzales, capacidad en GB, vigencia en días y estado activo.
3. Al confirmar los cambios, el backend actualiza el registro en base de datos y, si se modificó la capacidad en GB, sincroniza la cuota de los usuarios con suscripción activa a ese plan.

**Flujo Alterno:** Si el nombre modificado colisiona con otro plan registrado, la restricción única de PostgreSQL retorna un conflicto HTTP 409.

---

<!-- SALTO DE PÁGINA -->

# Documento de Diseño

## 1. Arquitectura General

### 1.1 Diagrama de Capas del Sistema
El siguiente diagrama actualiza el modelo arquitectónico general para reflejar la estructura modular en capas, la incorporación de los patrones estructurales y la abstracción del almacenamiento en la nube.

```mermaid
flowchart TD
    Cliente["Cliente Web (React + Vite)"]
    API["Rutas y Middlewares (Express 5)"]
    Ctrl["Controladores y Validadores"]
    Servicios["Servicios de Negocio"]
    Patrones["Patrones: Decorator y Bridge"]
    Datos["Repositorios SQL (pg Pool)"]
    Storage["Storage: Disco Local / Supabase"]
    DB[(PostgreSQL Local / Supabase)]

    Cliente -->|HTTP REST / JSON| API
    API --> Ctrl
    Ctrl --> Servicios
    Servicios --> Patrones
    Servicios --> Datos
    Patrones --> Storage
    Datos --> DB
```

### 1.2 Explicación de Cada Capa
La capa de **Cliente Web** se encarga de la interfaz de usuario SPA en React 19, gestionando el estado de sesión, las vistas públicas y privadas, los modales interactivos y la comunicación HTTP asíncrona mediante servicios tipados por dominio. La capa de **Rutas y Middlewares** expone los endpoints RESTful e intercepta cada solicitud para verificar autenticación JWT, permisos de administrador, limitación de tasa en memoria y recepción multiparte de archivos con Multer.

A continuación, los **Controladores y Validadores** reciben las peticiones HTTP, sanean y verifican parámetros de entrada mediante funciones puras antes de delegar en los **Servicios de Negocio**, donde residen las reglas de verificación de cuenta, control de cuotas, facturación simulada y envío de correos transaccionales. Esta capa interactúa directamente con la capa de **Patrones de Diseño** para resolver políticas de planes en tiempo de ejecución y desacoplar el almacenamiento de binarios.

Finalmente, los **Repositorios SQL** aíslan completamente el lenguaje de consultas parametrizadas sobre PostgreSQL y administran transacciones atómicas ACID, mientras que la capa de **Infraestructura y Almacenamiento** separa los metadatos relacionales (en PostgreSQL local o Supabase) de los bytes físicos alojados en disco local o en el bucket privado de Supabase Storage.

### 1.3 Defensa de la Arquitectura
Se adoptó una **arquitectura en capas con backend modular** porque delimita estrictamente las fronteras entre transporte HTTP, reglas de negocio, acceso a datos y proveedores externos. Esta organización permitió que distintos integrantes del equipo trabajaran simultáneamente en autenticación, almacenamiento, suscripciones y administración sin generar colisiones constantes sobre los mismos archivos ni duplicar sentencias SQL.

Durante la evolución del proyecto se descartaron dos alternativas principales. Por un lado, una **arquitectura de microservicios** habría introducido sobrecarga innecesaria de red, despliegue múltiple y complejidad en transacciones distribuidas entre usuarios, pagos y archivos para el alcance de un proyecto semestral. Por otro lado, un **monolito sin separación de capas** ("controladores inteligentes") fue descartado tras el proceso de refactorización documentado en el repositorio (commit `b5ebb40`), pues concentrar validaciones, lógica de negocio y SQL en un solo archivo dificultaba el mantenimiento y provocaba errores de seguridad.

Como compromiso arquitectónico (*trade-off*), las dependencias entre capas en Node.js se resuelven mediante importaciones estáticas de ES Modules en lugar de un contenedor de inyección de dependencias dinámico; no obstante, las fronteras críticas se mantienen flexibles mediante polimorfismo en las clases de los patrones Bridge y Decorator. Asimismo, el limitador de tasa en memoria resulta suficiente para un servidor único de despliegue gratuito, aunque requeriría un almacén compartido como Redis para escalar horizontalmente a múltiples instancias.

### 1.4 Principios de Diseño Aplicados
La base de código prioriza una **alta cohesión** mediante módulos pequeños y focalizados: el manejo criptográfico de contraseñas, la firma de tokens JWT, el despacho SMTP de correos y cada repositorio SQL ejecutan operaciones cohesivas sobre una única responsabilidad. Paralelamente, se mantiene un **bajo acoplamiento** vertical al garantizar que los controladores desconozcan PostgreSQL y que los servicios desconozcan el medio físico donde residen los archivos.

Respecto a los **principios SOLID**, la refactorización aplicada en el repositorio materializa la **Responsabilidad Única (SRP)** separando validadores, controladores, servicios y repositorios en el servidor, así como subcomponentes especializados en la interfaz de administración. El principio **Abierto/Cerrado (OCP)** se evidencia tanto en el registro declarativo de pestañas del dashboard como en los patrones Decorator y Bridge, donde incorporar nuevos planes o proveedores de nube no exige modificar el código cliente existente.

El principio de **Sustitución de Liskov (LSP)** se cumple en las implementaciones de almacenamiento local y en Supabase Storage al respetar íntegramente el contrato base `StorageProvider`, y en todos los decoradores de planes al ser intercambiables bajo la interfaz `Plan`. La **Segregación de Interfaces (ISP)** se refleja en contratos reducidos y específicos para operaciones primitivas de almacenamiento (`put`, `get`, `delete`, `move`), mientras que la **Inversión de Dependencias (DIP)** asegura que el servicio de almacenamiento dependa de abstracciones de alto nivel y no directamente del sistema de archivos ni de peticiones HTTP crudas a terceros.

---

### 1.5 Patrones de Diseño Utilizados: BRIDGE y DECORATOR

#### Patrón Estructural BRIDGE
El patrón Bridge fue implementado en el backend para resolver el desacople entre la lógica de dominio sobre archivos y su almacenamiento físico. En desarrollo local los archivos se guardan en una carpeta del servidor, mientras que en el entorno de despliegue gratuito en Render el sistema de archivos del contenedor es efímero y se borra tras cada reinicio. Sin esta abstracción, cambiar de almacenamiento local a la nube habría obligado a reescribir el servicio de almacenamiento, las rutas de descarga y la purga en papelera.

La estructura del patrón separa dos jerarquías independientes. Por el lado de la **Abstracción**, la clase `FileStorage` ofrece operaciones comprensibles para el negocio (`store`, `open`, `changeExtension`, `remove` y `removeMany`) operando sobre entidades `archivo` y generando claves deterministas con el formato `<id>.<ext>` para evitar colisiones de nombres duplicados entre usuarios. Esta clase delega el trabajo físico a través del puente `this.provider` y limpia el archivo temporal creado por Multer.

Por el lado del **Implementador**, la clase base `StorageProvider` define un contrato primitivo basado exclusivamente en claves y flujos binarios (`put`, `get`, `delete` y `move`), ignorando conceptos de usuarios, cuotas o carpetas. Sus dos implementadores concretos son `LocalDiskProvider`, que utiliza el sistema de archivos del servidor, y `SupabaseStorageProvider`, que consume la API REST autenticada sobre un bucket privado en Supabase Storage. Una fábrica única selecciona el implementador al iniciar el servidor a partir de la variable `STORAGE_DRIVER`.

```mermaid
classDiagram
    direction TD
    class FileStorage {
        -StorageProvider provider
        +keyFor(archivo, ext) string
        +store(archivo, tempPath)
        +open(archivo)
        +changeExtension(archivo, ext)
        +removeMany(archivos)
    }
    class StorageProvider {
        <<interface>>
        +put(key, localPath, type)*
        +get(key)*
        +delete(keys)*
        +move(fromKey, toKey)*
    }
    class LocalDiskProvider {
        -string directory
        +put(key, localPath)
        +get(key)
        +delete(keys)
        +move(fromKey, toKey)
    }
    class SupabaseStorageProvider {
        -string baseUrl
        -string bucket
        +put(key, localPath, type)
        +get(key)
        +delete(keys)
        +move(fromKey, toKey)
    }

    FileStorage o--> StorageProvider : bridge
    StorageProvider <|.. LocalDiskProvider
    StorageProvider <|.. SupabaseStorageProvider
```

#### Patrón Estructural DECORATOR
El patrón Decorator gobierna el módulo de planes, cuotas y políticas técnicas de carga. Su objetivo es extender dinámicamente las capacidades de una cuenta gratuita base en tiempo de ejecución sin recurrir a una explosión combinatoria de subclases estáticas conforme varían los precios, capacidades, tamaños de archivo permitidos o vigencias de compartición.

La jerarquía parte del componente abstracto `Plan`, que declara las operaciones `costo()`, `decripcion()`, `almacenamiento()`, `obtenerPoliticaMulter()` y `toJSON()`. El componente concreto base `PlanGratuito` establece los valores iniciales del sistema sin costo mensual: 5 GB de espacio, límite de 10 MB por archivo, carga de un archivo por petición y enlaces compartidos de 24 horas. La clase `DecoradorPlanes` envuelve una instancia `wrappee` de tipo `Plan` y delega las llamadas por defecto.

Sobre este decorador base extienden los decoradores concretos `PlanBasico` (50 GB, Q25.00, tope 50 MB, hasta 3 archivos, enlaces 7 días), `Profesional` (200 GB, Q60.00, tope 250 MB, hasta 10 archivos, enlaces 30 días) y `Empresarial` (1 TB, Q150.00, tope 1 GB, hasta 25 archivos, enlaces 365 días). En tiempo de ejecución, la función `crearPlanDecorado` envuelve `PlanGratuito` con los valores reales almacenados en PostgreSQL (soportando también planes personalizados creados por el administrador) e inyecta sus reglas directamente en el middleware dinámico de Multer durante cada subida, acotado al límite global `MAX_UPLOAD_MB` del servidor.

```mermaid
classDiagram
    direction TD
    class Plan {
        <<interface>>
        +costo()
        +decripcion()
        +almacenamiento()
        +obtenerPoliticaMulter()
        +toJSON()
    }
    class PlanGratuito {
        +costo()
        +almacenamiento()
        +obtenerPoliticaMulter()
    }
    class DecoradorPlanes {
        +Plan wrappee
        +costo()
        +decripcion()
        +almacenamiento()
        +obtenerPoliticaMulter()
    }
    class PlanBasico {
        +costo()
        +almacenamiento()
    }
    class Profesional {
        +costo()
        +almacenamiento()
    }
    class Empresarial {
        +costo()
        +almacenamiento()
    }

    Plan <|.. PlanGratuito
    Plan <|.. DecoradorPlanes
    DecoradorPlanes o--> Plan : wrappee
    DecoradorPlanes <|-- PlanBasico
    DecoradorPlanes <|-- Profesional
    DecoradorPlanes <|-- Empresarial
```

---

## 2. Diagramas UML
Se incluyen y actualizan todos los diagramas UML de análisis y diseño originalmente planteados en el proyecto, alineándolos con la implementación definitiva del código fuente.

### 2.1 Diagrama de Clases del Dominio
El siguiente diagrama actualiza el modelo de clases conceptual derivado del esquema relacional actual. Cabe aclarar que el backend está desarrollado bajo un paradigma modular funcional y no mediante entidades de dominio orientadas a objetos persistentes, exceptuando las clases de los patrones Bridge y Decorator detalladas previamente. Con respecto al diseño preliminar, se incorporaron el estado de papelera en carpetas, los campos transaccionales reales en pagos y se omitió la clase persistente de invitado al resolverse la compartición mediante tokens sin cuenta registrada.

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
        +boolean correoVerificado
        +bigint espacioDisponible
        +bigint espacioConsumido
    }
    class Carpeta {
        +int id
        +string nombre
        +boolean enPapelera
        +date fechaEliminacion
    }
    class Archivo {
        +int id
        +string nombre
        +bigint tamano
        +boolean enPapelera
        +date fechaEliminacion
    }
    class Plan {
        +int id
        +string nombre
        +decimal precio
        +bigint capacidadAlmacenamiento
        +boolean activo
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
        +string tipo
        +string estado
        +string referencia
    }

    Rol "1" <-- "*" Usuario : asigna
    Usuario "1" --> "*" Carpeta : posee
    Carpeta "0..1" <-- "*" Carpeta : anida
    Usuario "1" --> "*" Archivo : sube
    Carpeta "0..1" <-- "*" Archivo : contiene
    Usuario "1" --> "*" Suscripcion : contrata
    Plan "1" <-- "*" Suscripcion : define
    Suscripcion "1" --> "*" Pago : genera
```

### 2.2 Diagrama de Secuencia: Subida de Archivo
Describe la interacción sincrónica entre el cliente web y las capas del servidor durante la carga de un archivo, incorporando la evaluación de políticas con Decorator y el almacenamiento mediante Bridge.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant MW as uploadMiddleware (Decorator)
    participant Svc as storageService
    participant Bridge as fileStorage (Bridge)
    participant Repo as fileRepository

    Usuario->>UI: Selecciona o arrastra archivo
    UI->>MW: POST /api/storage/upload
    MW->>MW: Resuelve PlanDecorado y limites
    MW->>Svc: uploadFile(usuarioId, file)
    Svc->>Svc: Valida cuota disponible
    alt Cuota insuficiente
        Svc-->>UI: 400 Bad Request (borra temp)
    else Cuota suficiente
        Svc->>Repo: createFile(metadatos)
        Repo-->>Svc: Registro archivo creado
        Svc->>Bridge: store(archivo, tempPath)
        Bridge-->>Svc: Persistido (Local o Supabase)
        Svc-->>UI: 201 Created (JSON)
    end
```

### 2.3 Diagramas de Actividad

#### Actividad (a): Registro, Verificación Obligatoria e Inicio de Sesión
Actualiza el flujo preliminar de autenticación integrando el registro con correo único, la confirmación obligatoria mediante enlace firmado y el bloqueo de acceso con HTTP 403 a cuentas sin verificar.

```mermaid
flowchart TD
    Inicio([Inicio]) --> TieneCuenta{"¿Tiene cuenta?"}
    TieneCuenta -- No --> Reg["Registrar y enviar token 24h"]
    Reg --> ValReg{"¿Correo unico y token OK?"}
    ValReg -- No --> ErrReg["Error 409 o token"] --> Reg
    ValReg -- Si --> Login["Ingresar credenciales Login"]
    TieneCuenta -- Si --> Login
    Login --> CredOK{"¿Credenciales y correo OK?"}
    CredOK -- No --> ErrLogin["Rechazar HTTP 401/403"] --> Login
    CredOK -- Si --> JWT["Emitir JWT y abrir panel"] --> Fin([Fin])
```

#### Actividad (b): Subida de Archivos con Decorator y Bridge
Actualiza el flujo de carga incorporando la aplicación dinámica de límites de tamaño y cantidad definidos por el Patrón Decorator y el guardado físico desacoplado con Bridge.

```mermaid
flowchart TD
    Inicio([Inicio]) --> Subir["Enviar archivo y aplicar Decorator"]
    Subir --> ExtOK{"¿Tamano y extension validos?"}
    ExtOK -- No --> Limp["Borrar temporal y error 400"] --> Fin([Fin])
    ExtOK -- Si --> CuotaOK{"¿Cabe en espacio disponible?"}
    CuotaOK -- No --> Limp
    CuotaOK -- Si --> BD["Insertar metadatos PostgreSQL"]
    BD --> Bridge["Persistir con FileStorage Bridge"]
    Bridge --> Inc["Incrementar espacio_consumido"] --> Fin
```

#### Actividad (c): Compartir Archivo y Enviar Invitación
Actualiza el diagrama preliminar de invitación reflejando el funcionamiento real: envío opcional por correo a usuarios registrados o generación directa de enlace público con token vigente sin exigir sesión al receptor.

```mermaid
flowchart TD
    Inicio([Inicio]) --> Abrir["Abrir ShareModal en archivo"]
    Abrir --> Modo{"¿Enviar a correo?"}
    Modo -- Si --> Existe{"¿Usuario destino existe?"}
    Existe -- No --> Err404["Error 404 usuario inexistente"] --> Abrir
    Existe -- Si --> Enviar["Firmar token, enviar correo y link"]
    Modo -- No --> Gen["Firmar enlace publico segun plan"]
    Enviar --> ValTok{"¿Token vigente en SharedFile?"}
    Gen --> ValTok
    ValTok -- No --> Fin([Fin])
    ValTok -- Si --> Desc["Visualizar o descargar archivo"] --> Fin
```

#### Actividad (d): Administración de Catálogo de Planes y Reportes
Actualiza el diagrama administrativo incorporando la consulta de reportes de ingresos y almacenamiento en nube, la edición completa de planes existentes y la sincronización de cuotas.

```mermaid
flowchart TD
    Inicio([Inicio]) --> EsAdmin{"¿Rol Administrador valido?"}
    EsAdmin -- No --> Deneg["Rechazar HTTP 403"] --> Fin([Fin])
    EsAdmin -- Si --> Accion{"Seleccionar accion"}
    Accion -- Ver reporte --> Rep["Cargar ingresos nube y pagos"] --> Fin
    Accion -- Crear o editar --> Modal["Guardar plan en BD"]
    Modal --> CambCap{"¿Cambio capacidad GB?"}
    CambCap -- Si --> Sync["Sincronizar cuota suscriptores"] --> Fin
    CambCap -- No --> Fin
    Accion -- Activar/Desactivar --> Toggle["Actualizar estado activo"] --> Fin
```

#### Actividad (e): Gestión de Papelera para Archivos y Carpetas
Modela el ciclo de vida completo de los elementos eliminados lógicamente, contemplando el ocultamiento del subárbol de carpetas, la restauración segura a raíz cuando el padre permanece oculto y la purga definitiva.

```mermaid
flowchart TD
    Inicio([Inicio]) --> Accion{"Accion en papelera"}
    Accion -- Eliminar --> Soft["Marcar en_papelera = TRUE"] --> Fin([Fin])
    Accion -- Restaurar --> EsCarp{"¿Carpeta con padre oculto?"}
    EsCarp -- Si --> Raiz["Restaurar en raiz"] --> Fin
    EsCarp -- No --> Rest["Marcar en_papelera = FALSE"] --> Fin
    Accion -- Purgar o vaciar --> Confirm{"¿Confirma eliminacion?"}
    Confirm -- No --> Fin
    Confirm -- Si --> DelBD["Borrar BD y restar bytes"]
    DelBD --> DelFis["Eliminar binarios con Bridge"] --> Fin
```

---

## 3. Modelo Entidad-Relación
El modelo entidad-relación refleja exactamente la estructura definida en la base de datos PostgreSQL, dividida en dos diagramas para garantizar su legibilidad vertical e incluyendo el soporte de papelera lógica en carpetas.

### 3.1 Diagrama ER: Módulo de Usuarios, Planes y Pagos
Agrupa las entidades asociadas al control de acceso, suscripciones comerciales y trazabilidad de pagos.

```mermaid
erDiagram
    ROL ||--o{ USUARIO : asigna
    PLAN ||--o{ SUSCRIPCION : define
    USUARIO ||--o{ SUSCRIPCION : contrata
    USUARIO ||--o{ PAGO : realiza
    SUSCRIPCION ||--o{ PAGO : genera

    ROL {
        int id PK
        string nombre UK
    }
    USUARIO {
        int id PK
        int rol_id FK
        string correo UK
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
        string tipo
        string estado
        string referencia UK
        string tarjeta_ultimos4
    }
```

### 3.2 Diagrama ER: Módulo de Almacenamiento (Carpetas y Archivos)
Describe la jerarquía reflexiva de directorios y el almacenamiento lógico de metadatos e indicadores de papelera.

```mermaid
erDiagram
    USUARIO ||--o{ CARPETA : posee
    USUARIO ||--o{ ARCHIVO : sube
    CARPETA |o--o{ CARPETA : contiene
    CARPETA |o--o{ ARCHIVO : almacena

    CARPETA {
        int id PK
        int usuario_id FK
        int carpeta_padre_id FK
        string nombre
        date fecha_creacion
        boolean en_papelera
        date fecha_eliminacion
    }
    ARCHIVO {
        int id PK
        int usuario_id FK
        int carpeta_id FK
        string nombre
        bigint tamano
        string tipo
        boolean en_papelera
        date fecha_eliminacion
    }
```

---

## 4. Diseño de Base de Datos

### 4.1 Diccionario de Tablas

| Tabla | Propósito | Columnas principales (tipo) | Relaciones |
|---|---|---|---|
| `rol` | Define niveles de autorización (`Administrador`, `Usuario`) | `id` (INT PK), `nombre` (VARCHAR) | `1:N` con `usuario` |
| `usuario` | Credenciales, verificación, rol y cuotas en bytes | `id` (INT PK), `rol_id` (INT FK), `correo` (VARCHAR UK), `espacio_consumido` (BIGINT), `espacio_disponible` (BIGINT) | `N:1` con `rol`, `1:N` con carpetas, archivos, suscripciones y pagos |
| `carpeta` | Organización jerárquica reflexiva con borrado lógico | `id` (INT PK), `usuario_id` (INT FK), `carpeta_padre_id` (INT FK nullable), `nombre` (VARCHAR), `en_papelera` (BOOLEAN), `fecha_eliminacion` (DATE) | `N:1` con `usuario`, reflexiva `1:N` con `carpeta` |
| `archivo` | Metadatos de archivos físicos e indicadores de papelera | `id` (INT PK), `usuario_id` (INT FK), `carpeta_id` (INT FK nullable), `nombre` (VARCHAR), `tamano` (BIGINT), `en_papelera` (BOOLEAN) | `N:1` con `usuario`, `N:1` con `carpeta` |
| `plan` | Catálogo comercial de planes y cuotas en bytes | `id` (INT PK), `nombre` (VARCHAR UK), `precio` (NUMERIC), `capacidad_almacenamiento` (BIGINT), `vigencia_dias` (INT), `activo` (BOOLEAN) | `1:N` con `suscripcion` |
| `suscripcion` | Historial y suscripción activa vigente por usuario | `id` (INT PK), `usuario_id` (INT FK), `plan_id` (INT FK), `fecha_inicio` (DATE), `fecha_renovacion` (DATE), `estado` (VARCHAR) | `N:1` con `usuario`, `N:1` con `plan` |
| `pago` | Registro transaccional de contrataciones y renovaciones | `id` (INT PK), `usuario_id` (INT FK), `suscripcion_id` (INT FK), `monto` (NUMERIC), `tipo` (VARCHAR), `estado` (VARCHAR), `referencia` (VARCHAR UK), `tarjeta_ultimos4` (CHAR(4)) | `N:1` con `usuario` y FK compuesta con `suscripcion` |

### 4.2 Restricciones, Índices y Vistas
Para preservar la integridad de dominio directamente desde el motor relacional, el esquema define múltiples restricciones `CHECK` y `UNIQUE`: valida que los contadores `espacio_consumido`, `espacio_disponible` y `tamano` nunca sean negativos, impide que una carpeta sea padre de sí misma (`chk_carpeta_no_autopadre`), exige montos y capacidades positivas en el catálogo de planes, restringe los estados válidos de suscripciones (`pendiente`, `activa`, `vencida`, `cancelada`) y pagos (`pendiente`, `aprobado`, `rechazado`), verifica la validez cronológica de renovaciones y comprueba mediante expresión regular que los últimos cuatro dígitos de tarjeta correspondan exactamente a cuatro caracteres numéricos. Adicionalmente, la clave foránea compuesta `(suscripcion_id, usuario_id)` asegura que todo pago pertenezca al mismo usuario titular de la suscripción.

En materia de rendimiento y unicidad operativa, existen índices específicos sobre propietarios y jerarquías de carpetas y archivos (`idx_carpeta_usuario_id`, `idx_carpeta_padre_id`, `idx_archivo_usuario_id`, `idx_archivo_carpeta_id`), índices compuestos por estado en papelera (`idx_carpeta_papelera` e `idx_archivo_papelera`) e índices de consulta cronológica de pagos (`idx_pago_usuario_fecha`). Destaca el índice único parcial `uq_suscripcion_activa_por_usuario`, que impide a nivel de base de datos que un usuario posea más de una suscripción en estado activo simultáneamente. Para simplificar consultas recurrentes, el esquema expone dos vistas SQL: `v_suscripcion_actual`, que une las suscripciones vigentes con los atributos de su plan calculando los días restantes, y `v_historial_pagos`, que consolida pagos, usuarios y planes para auditoría y facturación.

### 4.3 Decisiones de Diseño Relevantes
La decisión central de almacenamiento consiste en separar los metadatos relacionales de los bytes físicos: PostgreSQL únicamente conserva identificadores, tamaños y jerarquías, mientras que el Patrón Bridge deposita los contenidos binarios en disco local o Supabase Storage bajo una clave determinista `<id>.<ext>`, evitando degradar la base de datos con columnas binarias extensas o colisiones por archivos homónimos.

Para la papelera de carpetas se optó por un borrado lógico selectivo sobre la propia fila eliminada (`en_papelera = TRUE`) sin modificar individualmente sus elementos internos. Mediante una consulta recursiva (`WITH RECURSIVE`) el sistema oculta automáticamente todo el subárbol descendiente en las vistas y búsquedas activas, garantizando que al restaurar una carpeta recupere íntegra su estructura original y que, si su carpeta padre sigue eliminada, regrese de forma segura al directorio raíz.

Por último, el plan gratuito base de 5 GB no ocupa una fila dentro de la tabla comercial `plan`, sino que constituye el valor por defecto asignado en `usuario.espacio_disponible` y encapsulado en el componente concreto `PlanGratuito` del Patrón Decorator. De este modo, las bajas, cancelaciones o vencimientos de suscripciones retornan al usuario a su cuota base de manera determinista sin depender de identificadores mágicos en el catálogo.

---

<!-- SALTO DE PÁGINA -->

# Manual Técnico

## 1. Tecnologías Utilizadas

| Tecnología | Versión (`package.json`) | Uso en el Sistema | Archivo donde se declara |
|---|---|---|---|
| **Node.js** | `>= 20.x` (Probado en v24) | Entorno de ejecución ES Modules | `Back_/package.json` |
| **Express** | `^5.2.1` | Framework HTTP y enrutamiento REST | `Back_/package.json` |
| **PostgreSQL** | `15+` / `16` | Base de datos relacional | `database/inicializacion/schema.sql` |
| **pg (node-postgres)** | `^8.23.0` | Pool de conexiones y transacciones | `Back_/package.json` |
| **React** | `^19.2.8` | Interfaz gráfica SPA reactiva | `Front_/package.json` |
| **Vite** | `^8.3.0` | Empaquetador y servidor de desarrollo | `Front_/package.json` |
| **Multer** | `^2.4.0` | Carga multiparte con límites dinámicos | `Back_/package.json` |
| **Nodemailer** | `^10.0.11` | Envío SMTP de verificación, recuperación e invitaciones | `Back_/package.json` |
| **jsonwebtoken** | `^9.0.3` | Tokens JWT de sesión y enlaces temporales | `Back_/package.json` |
| **bcryptjs** | `^3.0.3` | Hashing seguro de contraseñas | `Back_/package.json` |
| **Docker** | `Node 20 Alpine` | Empaquetado del backend para Render | `Back_/Dockerfile` |

## 2. Instalación

### 2.1 Requisitos Previos
El despliegue o ejecución local requiere contar con Node.js versión 20.x o superior, el gestor de paquetes `npm`, un motor PostgreSQL en ejecución (local o en la nube mediante Supabase) y credenciales SMTP válidas (por ejemplo Brevo o Mailtrap) para el despacho de correos transaccionales.

### 2.2 Pasos de Instalación
1. Clonar el repositorio y ubicarse en el directorio raíz del proyecto.
2. Instalar dependencias tanto en el servidor como en la aplicación web:
   ```bash
   cd Back_ && npm install
   cd ../Front_ && npm install
   ```
3. Copiar la plantilla de configuración de entorno hacia el archivo activo del backend y completar las credenciales locales.
4. Ejecutar el script idempotente de inicialización para crear tablas, índices, vistas y datos semilla:
   ```bash
   cd Back_ && npm run db:init
   ```

## 3. Configuración

### 3.1 Variables de Entorno del Backend

| Variable | Descripción | Ejemplo ficticio | Obligatoria |
|---|---|---|---|
| `PORT` | Puerto HTTP del servidor Express | `5000` | No (def: 5000) |
| `NODE_ENV` | Entorno (`development` o `production`) | `development` | No |
| `FRONTEND_URL` | URL base para construir enlaces de correo | `http://localhost:5173` | Sí |
| `CORS_ORIGIN` | Origen permitido por política CORS | `http://localhost:5173` | No |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Credenciales PostgreSQL local | `localhost` / `5432` / `postgres` / `clave_local` / `almacenamiento_db` | Sí (sin `DATABASE_URL`) |
| `DATABASE_URL` | URI completa PostgreSQL Cloud (prioritaria) | `postgresql://usr:pwd@host:5432/postgres` | No |
| `DB_SSL` | Habilitar SSL para BD remota | `true` | No |
| `JWT_SECRET` | Clave secreta para firmar JWT | `clave_jwt_ejemplo_segura_123` | Sí |
| `JWT_EXPIRES_IN` | Expiración de sesión | `7d` | No (def: 7d) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Configuración SMTP transaccional | `smtp-relay.brevo.com` / `2525` / `usr` / `token` / `VinCloud <no-reply@ejemplo.com>` | Sí |
| `STORAGE_DRIVER` | Controlador Bridge (`local` o `supabase`) | `local` | No (def: local) |
| `UPLOAD_DIR` / `UPLOAD_TMP_DIR` | Rutas físicas locales y temporales Multer | `Back_/uploads` | No |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_BUCKET` | Credenciales privadas Supabase Storage | `https://xyz.supabase.co` / `sb_secret_ejemplo` / `archivos` | Sí si `supabase` |
| `MAX_UPLOAD_MB` | Tope global en MB por archivo en servidor | `50` | No |
| `STORAGE_CAPACITY_MB` | Capacidad física total del proveedor en MB (métricas admin) | `1024` | No |

### 3.2 Inicialización y Primer Administrador
El inicializador de base de datos aplica los scripts DDL y semilla de forma segura e idempotente sobre entornos nuevos o ya existentes. Para dar de alta al primer administrador del sistema se puede enviar el campo opcional `tipoCuenta: "administrador"` en la petición de registro, o bien promover una cuenta registrada ejecutando en PostgreSQL la actualización directa de su rol y verificación:

```sql
UPDATE usuario
SET rol_id = (SELECT id FROM rol WHERE nombre = 'Administrador'),
    nivel_acceso = 'administrador',
    correo_verificado = TRUE
WHERE correo = 'admin@correo.com';
```

### 3.3 Ejecución en Local
Para levantar el entorno de desarrollo se requieren dos terminales independientes: una en el directorio del backend ejecutando `npm run dev` (disponible en el puerto `5000`) y otra en el directorio del frontend ejecutando `npm run dev` (disponible en el puerto `5173`).

### 3.4 Resumen de Endpoints de la API REST

| Método | Ruta | Rol | Propósito |
|---|---|---|---|
| `POST` | `/api/auth/register` / `/login` / `/verify-email` | Público | Alta, autenticación y verificación de cuenta |
| `POST` | `/api/auth/resend-verification` / `/forgot-password` / `/reset-password` | Público | Reenvío de activación y recuperación de clave |
| `GET` | `/api/auth/me` | Autenticado | Perfil y cuota actualizada del usuario |
| `POST` | `/api/storage/upload` | Autenticado | Carga de archivo con Multer dinámico y Bridge |
| `GET` | `/api/storage/files` / `/recent` / `/search` | Autenticado | Listado por carpeta, recientes y búsqueda |
| `GET` | `/api/storage/files/:id/view` / `/download` | Autenticado | Previsualización inline y descarga binaria |
| `PATCH` | `/api/storage/files/:id` | Autenticado | Renombrar archivo (actualiza extensión en Bridge) |
| `DELETE` | `/api/storage/files/:id` | Autenticado | Borrado lógico de archivo a papelera |
| `POST` | `/api/storage/files/:id/share` | Autenticado | Generar enlace temporal y enviar invitación |
| `GET` | `/api/storage/shared/:token` / `/download` | Público | Consulta y descarga por invitado sin sesión |
| `POST/PATCH/DELETE` | `/api/storage/folders` / `/:id` | Autenticado | Crear, renombrar y enviar carpeta a papelera |
| `GET/POST/DELETE` | `/api/storage/trash` / `/:id/restore` / `/folders/:id/restore` | Autenticado | Listar papelera, restaurar o purgar archivos/carpetas |
| `GET` | `/api/subscriptions/plans` | Público | Catálogo activo evaluado con Patrón Decorator |
| `GET/POST` | `/api/subscriptions/me` / `/subscribe` / `/renew` / `/cancel` / `/payments` | Autenticado | Gestión comercial de suscripciones y pagos |
| `GET` | `/api/admin/reports` | Administrador | Reporte en vivo: almacenamiento nube, MRR, ingresos y pagos |
| `GET/PATCH/DELETE` | `/api/admin/users` / `/:id` | Administrador | Administración de cuentas, roles y cuotas |
| `GET/POST/PATCH` | `/api/admin/plans` / `/:id` | Administrador | Gestión completa de planes y sincronización de cuotas |
| `GET` | `/api/health` | Público | Estado del servicio y conectividad PostgreSQL |

## 4. Despliegue

### 4.1 Infraestructura en la Nube
El repositorio incluye infraestructura declarativa mediante un Blueprint de Render (`render.yaml`) y configuración estática alternativa para Netlify (`netlify.toml`). En producción, el backend se empaqueta en un contenedor Docker sobre Node 20 Alpine como servicio web (`vincloud-api`), mientras que el frontend compilado con Vite se sirve como sitio estático (`vincloud-web`) con reescritura de rutas SPA.

La capa de datos opera sobre PostgreSQL administrado en Supabase utilizando el *Session Pooler* IPv4 con conexión SSL habilitada, y la persistencia física de archivos conmuta automáticamente mediante el Patrón Bridge (`STORAGE_DRIVER=supabase`) hacia un bucket privado, respetando el tope de 50 MB por archivo y 1 GB total del plan gratuito. Asimismo, debido a que Render restringe los puertos SMTP convencionales, el servicio de correos utiliza Brevo sobre el puerto `2525`. Durante las pruebas de conectividad se verificaron las URL de referencia públicas `https://vincloud-web.onrender.com/` y `https://vincloud-api.onrender.com/api`, sujetas a sincronización manual de rama en Render tras los últimos cambios integrados.
