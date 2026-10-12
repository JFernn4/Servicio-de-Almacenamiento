>Este archivo tipo markdown funge como archivo para brindar contexto a todo agente y/o modelo LLM, si eres uno lee esto para ahorar tiempo, tokens y poder comprender el contexto y utilidad del modelo. 

# CONTEXTO: 

## Que es este proyecto: 
El proyecto es, valga la redundancia, un proyecto universitario desarollado por estudiantes de 6to semestre de ingenieria. Este consiste en un PaaS (Platform as a Service), en el cual usuarios podran: Crear cuentas, subir archivos.

## Roles dentro del proyecto:
- Administrador: Usuario con control total sobre la plataforma. Puede gestionar cuentas de clientes, administrar el catálogo de planes de almacenamiento, supervisar el consumo de recursos de la infraestructura y consultar reportes generales del servicio.
- Cliente: Usuario con acceso a limitado a un plan, sujeto a la gestion de un administrador. Es capaza de subir archivos y eliminarlos de la plataforma, asi como hacer invitaciones. 
- Invitado: Usuario unicamente con acceso a visualizacion de un unico documento por medio de un enlace de inviatcion, no requiere de registrarse para poder ingresar al portal. 

# IMPORTANTE: 

## Cosas que no debes de hacer (¡NUNCA!):
+ Modificar la apriencia o estructura del frontend 

## Tecnologias trabajadas:

### Frontend
+ React: El motor de nuestro back
+ React Router
+ Axios/Fetch
### Backend
+ Node JS con Express (API RESTful, JWT): Es el lenguaje en el que se esta trabajando en el backend, rapido y consiso, nos facilita el trabajo y la eficincia
+ NodeMailer: Es usado como complemento de Node JS para poder trabajar el envio de correos electronicos a los usuarios de nuestro sistema. 

### Data Base
+ PostgreSQL: El motor encargado de gestionar los datos de la plataforma (Metadatos, usuarios, planes, pagos) y almacenamiento de archivos binarios.

### Contenedores y Despliegue
+ Docker
+ Docker Compose
+ GitHub Actions

## Guiate para los cambios segun lo existente en docs. 

# Asegurate de que tus cambios queden registrados en ARQUITECTURA_BACKEND.md
