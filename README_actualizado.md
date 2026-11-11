# Rent a Car - Sistema de Alquiler de Vehículos

Plataforma para gestionar alquileres de vehículos con arquitectura DDD, autenticación segura y una interfaz moderna.

**Estado actual:** El sistema cuenta con una Landing Page interactiva (modo oscuro, carruseles y calculadora de reserva UI), autenticación con JWT y Bcrypt, enrutamiento protegido por roles, CRUD de vehículos y base de datos gestionada mediante migraciones y seeders.

---

## Descripción

Plataforma que administra una empresa Rent a Car con:

- Inventario de unidades individuales (no por modelo).
- Tarifas configurables por hora, día, semana o mes.
- Disponibilidad por fecha y hora con prevención de solapamientos.
- Reservas, entregas, devoluciones y pagos.
- Historial completo por cliente y por vehículo.

---

## Stack Tecnológico

### Frontend

- **React 19** - Librería de UI.
- **Vite 8** - Build tool y dev server.
- **React Router 7** - Enrutamiento SPA.
- **Bootstrap 5** - Framework CSS.
- **Font Awesome 6** - Iconografía.
- **Axios** - Cliente HTTP.
- **Yarn 1.22.22** - Gestor de paquetes.

### Backend (Arquitectura DDD)

- **Node.js 22** - Runtime.
- **Express 4** - Framework web.
- **MySQL 8** - Base de datos relacional.
- **Sequelize 6** - ORM, migraciones y seeders.
- **JWT** - Autenticación con tokens.
- **bcryptjs** - Hash de contraseñas; reemplaza el uso anterior de SHA-256.
- **Vitest** - Tests unitarios.
- **Yarn 1.22.22** - Gestor de paquetes.

### DevOps

- **Docker** - Contenedores.
- **Docker Compose** - Orquestación multi-servicio.
- **phpMyAdmin** - Administración de MySQL vía web.
- **Playwright** - Tests End-to-End.

### Testing

- **Vitest** - Tests unitarios y de integración.
- **Playwright** - Tests End-to-End.
- **Testing Library** - Utilidades para testear React.

---

## Estructura del Proyecto

```text
rent-a-car/
├── docker-compose.yml         # Orquestación de servicios
├── README.md                  # Este archivo
├── .gitignore
│
├── backend/                   # API REST (Node.js + Express + DDD)
│   ├── Dockerfile
│   ├── .sequelizerc           # Configuración de Sequelize CLI
│   ├── package.json
│   └── src/
│       ├── index.js                           # Composición e inicio
│       ├── domain/                            # Reglas de negocio
│       │   ├── disponibilidad/                # SolapamientoService
│       │   └── tarifas/                       # TarifaService
│       ├── application/                       # Casos de uso
│       │   ├── flota/                         # Listar/Crear Vehículos
│       │   └── identidad/                     # Login, Registro
│       ├── infrastructure/                    # Implementaciones
│       │   ├── database/                      # Conexión, migraciones y seeders
│       │   ├── models/                        # Modelos Sequelize
│       │   └── repositories/                  # Repositorios
│       └── presentation/                      # Capa HTTP
│           ├── controllers/                   # Controladores
│           ├── middlewares/                   # Auth (JWT) y Roles
│           └── routes/                        # Rutas de la API
│
└── frontend/                  # SPA (React + Vite)
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── assets/            # Imágenes, logos, íconos
        ├── components/        # Componentes reutilizables
        │   ├── home/          # Hero, Brands, FleetCarousel, ReservationForm
        │   └── layout/        # Navbar, Footer, ProtectedRoute, ThemeToggle
        ├── context/           # AuthContext, useAuth
        ├── pages/             # Vistas por roles (admin, client, auth, public)
        ├── services/          # api.js (Axios)
        └── styles/            # globals.css (Variables del modo oscuro)
```

### Arquitectura DDD

El backend separa dominio, aplicación, infraestructura y presentación. Las reglas de negocio se mantienen en la capa `domain`, mientras que los casos de uso coordinan las operaciones y Sequelize queda en infraestructura. Esta es una base DDD inicial; las funciones de disponibilidad, reservas, tarifas y pagos deben completarse con sus respectivos casos de uso y reglas cuando se implementen esos módulos.

---

## Levantar el Proyecto

### Requisitos previos

- **Docker Desktop** instalado y corriendo.
- **Git** instalado.
- **Node.js 22+** (opcional, solo para desarrollo local sin Docker).

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd rent-a-car

# 2. Levantar todos los servicios
docker-compose up -d --build
```

La primera vez puede tardar varios minutos mientras se descargan las imágenes y se compilan los servicios.

### Ejecutar migraciones y seeders

Después de levantar los contenedores, ejecuta las migraciones y los seeders:

```bash
# 1. Crear/actualizar las tablas según las migraciones
docker exec -it rentacar_backend npx sequelize-cli db:migrate

# 2. Insertar los datos iniciales de prueba
docker exec -it rentacar_backend npx sequelize-cli db:seed:all
```

### Detener los servicios

```bash
# Detener (mantiene los datos)
docker-compose stop

# Detener y eliminar contenedores (mantiene los volúmenes)
docker-compose down

# Detener y eliminar TODO, incluida la base de datos
docker-compose down -v
```

---

## URLs de Acceso

| Servicio | URL | Credenciales |
|---|---|---|
| **Frontend** | http://localhost:5173 | — |
| **Backend API** | http://localhost:4000/api/health | — |
| **phpMyAdmin** | http://localhost:8080 | Usuario: `rentacar` / Contraseña: `rentacar` |
| **MySQL** | `localhost:3306` | Usuario: `rentacar` / Contraseña: `rentacar` |

### phpMyAdmin - Acceso root

| Campo | Valor |
|---|---|
| Servidor | `mysql` |
| Usuario | `root` |
| Password | `root` |

### Usuarios de prueba

Los usuarios disponibles dependen de los seeders configurados. El administrador inicial indicado en el proyecto es:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@rentacar.com` | `admin123` |
| Cliente | Se registra desde la aplicación | La definida durante el registro |

---

## Variables de Entorno

### Backend (`backend/.env`)

```env
PORT=4000
NODE_ENV=development

# Base de datos
DB_HOST=mysql
DB_PORT=3306
DB_NAME=rentacar
DB_USER=rentacar
DB_PASSWORD=rentacar

# Seguridad
JWT_SECRET=rentacar_secret_dev_2025

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env` - opcional)

```env
VITE_API_URL=http://localhost:4000/api
```

> **Importante:** Los valores anteriores son de desarrollo. No utilices estas credenciales ni secretos en un entorno de producción.

---

## Base de Datos

### Motor

- **MySQL 8.0** corriendo en Docker.
- **Sequelize 6** para el mapeo de modelos y la gestión de migraciones.

### Esquema inicial

Las tablas y sus cambios se gestionan mediante migraciones de Sequelize. Entre las entidades/tablas principales del sistema se encuentran:

- `usuarios` - Clientes, empleados y administradores.
- `categorias` - Sedán, SUV, Camioneta, Hatchback.
- `vehiculos` - Inventario individual de unidades.

### Acceder a la base de datos

**Opción 1: phpMyAdmin**

- Abre http://localhost:8080.
- Usuario: `rentacar` / Password: `rentacar`.

**Opción 2: Cliente SQL (DBeaver, MySQL Workbench)**

- Host: `localhost`.
- Puerto: `3306`.
- Usuario: `rentacar`.
- Password: `rentacar`.

**Opción 3: Terminal**

```bash
docker exec -it rentacar_mysql mysql -u rentacar -p
# Password: rentacar
```

---

## Testing

### Tests unitarios y de integración

Las pruebas unitarias del dominio se ejecutan con Vitest.

```bash
# Backend: ejecutar dentro del contenedor
docker exec -it rentacar_backend sh

# Ya dentro del contenedor
yarn test
exit
```

Si ejecutas el proyecto fuera de Docker, utiliza los scripts de prueba configurados en el `package.json` de cada módulo.

### Tests End-to-End (Playwright)

Las pruebas E2E se ejecutan desde el frontend:

```bash
# Entrar al contenedor frontend
docker exec -it rentacar_frontend sh

# Ejecutar Playwright
npx playwright test
exit
```

### Cobertura de código

```bash
yarn test --coverage
```

---

## Comandos Docker Útiles

```bash
# Ver contenedores corriendo
docker ps

# Ver logs de un servicio
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
docker-compose logs phpmyadmin

# Ver logs en tiempo real
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Reconstruir sin caché
docker-compose build --no-cache

# Entrar al contenedor del backend
docker exec -it rentacar_backend sh

# Entrar al contenedor del frontend
docker exec -it rentacar_frontend sh

# Ejecutar un comando dentro de un contenedor
docker exec -it rentacar_backend yarn install

# Ver estadísticas de uso
docker stats
```

---

## Desarrollo Local (sin Docker)

Si prefieres desarrollar sin Docker:

### 1. Levantar MySQL con Docker

```bash
docker-compose up mysql phpmyadmin -d
```

### 2. Backend

```bash
cd backend
yarn install
yarn dev
```

### 3. Frontend

```bash
cd frontend
yarn install
yarn dev
```

---

## Scripts Disponibles

### Backend (`backend/package.json`)

| Script | Descripción |
|---|---|
| `yarn dev` | Desarrollo con hot reload (nodemon). |
| `yarn start` | Producción. |
| `yarn test` | Ejecución de tests con Vitest, si está definido en el `package.json`. |

### Frontend (`frontend/package.json`)

| Script | Descripción |
|---|---|
| `yarn dev` | Desarrollo con Vite. |
| `yarn build` | Build de producción. |
| `yarn preview` | Preview del build. |
| `yarn test` | Tests con Vitest. |
| `yarn test:e2e` | Tests E2E con Playwright, si está definido en el `package.json`. |

---

## Seguridad

- **Contraseñas:** Hash con `bcryptjs` (salt rounds: 10).
- **Autenticación:** JWT (JSON Web Tokens) con expiración de 24 horas.
- **Autorización:** Middleware que valida roles (`CLIENTE`, `EMPLEADO`, `ADMINISTRADOR`).
- **Rutas protegidas:** Implementadas en el frontend (`ProtectedRoute`) y en el backend (`verifyToken`, `authorizeRole`).
- **CORS:** Configurado para aceptar peticiones desde el frontend.
- **Validaciones:** Aplicadas en los endpoints.

---

## Roles de Usuario

| Rol | Permisos |
|---|---|
| **Cliente** | Registrarse, buscar disponibilidad, reservar y ver sus reservas, pagos e historial. |
| **Empleado** | Gestionar reservas, entregar/recibir vehículos y registrar pagos. |
| **Administrador** | Todo lo anterior, además de gestionar usuarios, vehículos, tarifas y reportes. |

---

## Estado del Proyecto

### Completado

- [x] Configuración de Docker Compose y servicios.
- [x] Backend con Express + MySQL + Sequelize.
- [x] Frontend con React + Vite.
- [x] Landing Page (Hero, Brands, carrusel y calculadora de reserva UI).
- [x] Modo oscuro global y persistente.
- [x] Migraciones y seeders de base de datos.
- [x] Reglas de dominio implementadas y pruebas unitarias correspondientes.
- [x] Autenticación backend (registro, login, JWT y Bcrypt).
- [x] Middleware de autorización por roles.
- [x] Autenticación frontend (Context, LoginPage y RegisterPage).
- [x] Navbar dinámico según el estado de sesión.
- [x] CRUD de vehículos (backend + frontend de administración).

### En desarrollo

- [ ] Gestión de tarifas.
- [ ] Disponibilidad y reservas (backend).
- [ ] Entrega y devolución.
- [ ] Pagos e historial.
- [ ] Tests de integración y E2E completos.

---

## Equipo

Proyecto Final - Taller de Actualización V

| Integrante | Rol |
|---|---|
| **A** | Backend / Lógica de negocio |
| **B** | Base de datos / Persistencia |
| **C** | API / Autenticación / Seguridad |
| **D** | QA / Testing / Frontend |

---

## Documentación Adicional

- [Guía de Testing](./docs/testing.md)
- [Reglas de Tarifas](./docs/tarifas.md)
- [Reglas de Cargos](./docs/cargos.md)
- [Esquema de BD](./docs/base-datos.md)

---

## Licencia

Proyecto académico - Taller de Actualización V.

---

## Soporte

Si tienes problemas:

1. Verifica que Docker Desktop esté corriendo.
2. Revisa los logs: `docker-compose logs <servicio>`.
3. Verifica los puertos: `netstat -ano | findstr :4000`.
4. Si necesitas reiniciar los contenedores, ejecuta `docker-compose down` y luego `docker-compose up --build`. Usa `docker-compose down -v` únicamente si deseas borrar también los datos de la base de datos.
