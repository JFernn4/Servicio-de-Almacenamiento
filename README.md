# Plataforma como Servicio (PaaS) - Almacenamiento como Servicio

> Proyecto Final de Ingenieria de Software I (2026)  
> Universidad Rafael Landivar - Facultad de Ingenieria en Informatica y Sistemas

---

## Estructura del Proyecto

El repositorio esta organizado de forma modular para separar claramente las responsabilidades tecnicas:

```text
Servicio-de-Almacenamiento/
│
├── .github/
│   └── workflows/              # Automatizacion de CI/CD (GitHub Actions)
│
├── docs/                       # Documentacion del proyecto
│   ├── 01-requisitos/          # Requisitos funcionales (RF), no funcionales (RNF) y casos de uso
│   ├── 02-diseno/              # Arquitectura de software, diagramas UML y Modelo Entidad-Relacion
│   ├── 03-manuales/            # Manual tecnico y Manual de usuario
│   └── 04-entregables-sprints/ # Entregables academicos por fase y sprint
│
├── backend/                    # API REST y Logica de Servidor
│   ├── src/
│   │   ├── config/             # Configuracion de variables de entorno, base de datos y JWT
│   │   ├── controllers/        # Controladores que gestionan las peticiones HTTP
│   │   ├── middlewares/        # Middlewares de autenticacion, autorizacion y validaciones
│   │   ├── models/             # Definicion de modelos y esquemas de datos
│   │   ├── routes/             # Definicion de rutas y endpoints de la API
│   │   ├── services/           # Logica de negocio (gestion de cuotas, almacenamiento, pagos)
│   │   └── utils/              # Funciones auxiliares y utilidades
│   └── tests/                  # Pruebas unitarias y de integracion
│
├── frontend/                   # Aplicacion Web (React)
│   ├── public/                 # Archivos estaticos publicos (HTML base, favicon)
│   └── src/
│       ├── assets/             # Recursos estaticos (imagenes, iconos, estilos globales)
│       ├── components/         # Componentes reutilizables de interfaz
│       │   ├── comunes/        # Elementos basicos (botones, modales, alertas, campos de texto)
│       │   ├── layout/         # Estructura general (barra de navegacion, barra lateral, pie de pagina)
│       │   └── almacenamiento/ # Componentes del gestor de archivos y visor de cuota
│       ├── context/            # Manejo de estado global (autenticacion, estado de almacenamiento)
│       ├── hooks/              # Hooks personalizados
│       ├── pages/              # Vistas de la aplicacion
│       │   ├── admin/          # Panel administrativo, gestion de usuarios y planes
│       │   ├── auth/           # Inicio de sesion, registro y recuperacion de contrasena
│       │   ├── cliente/        # Dashboard del cliente, explorador de archivos y suscripcion
│       │   └── landing/        # Pagina de inicio y catalogo publico
│       ├── routes/             # Configuracion y proteccion de rutas
│       ├── services/           # Servicios de comunicacion con la API REST (Axios/Fetch)
│       └── utils/              # Funciones de formateo (tamanos de archivo, fechas)
│
├── database/                   # Base de Datos Relacional (PostgreSQL)
│   ├── init/                   # Scripts de inicializacion para contenedores
│   ├── migrations/             # Control de cambios en la estructura de la base de datos
│   └── seeds/                  # Datos iniciales para pruebas (roles, planes por defecto)
│
├── docker/                     # Configuraciones de Despliegue y Contenedores
│   ├── backend/                # Archivos de configuracion Docker para Backend
│   ├── frontend/               # Archivos de configuracion Docker para Frontend
│   └── database/               # Configuraciones y persistencia para PostgreSQL
│
├── .gitignore                  # Exclusion de dependencias, logs y archivos de entorno
└── README.md                   # Descripcion general y guia de carpetas
```

---

## Stack Tecnologico

- **Frontend:** React, React Router, Axios/Fetch.
- **Backend:** Node.js con Express (API RESTful, JWT).
- **Base de Datos:** PostgreSQL (Metadatos, usuarios, planes, pagos) y almacenamiento de archivos binarios.
- **Contenedores y Despliegue:** Docker, Docker Compose, GitHub Actions.
