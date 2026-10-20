# Rent a Car - Sistema de Alquiler de Vehículos

Plataforma en desarrollo para gestionar alquileres de vehículos.

**Estado actual:** el frontend contiene una landing page y el backend expone una ruta de salud, crea las tablas de usuarios, categorías y vehículos, y carga datos de demostración. Reservas, tarifas, alquileres, pagos y autenticación todavía no están implementados.

---

## Descripción

Plataforma que administra una empresa Rent a Car con:

- Inventario de unidades individuales (no por modelo)
- Tarifas configurables por hora, día, semana o mes
- Disponibilidad por fecha y hora con prevención de solapamientos
- Reservas, entregas, devoluciones y pagos
- Historial completo por cliente y por vehículo

---

## Stack Tecnológico

### Frontend

- **React 19** - Librería de UI
- **Vite 8** - Build tool y dev server
- **React Router 7** - Enrutamiento SPA
- **Bootstrap 5** - Framework CSS
- **Axios** - Cliente HTTP
- **Yarn 1.22.22** - Gestor de paquetes

### Backend

- **Node.js 22** - Runtime
- **Express 4** - Framework web
- **MySQL 8** - Base de datos relacional
- **mysql2** - Driver MySQL para Node
- **JWT** - Autenticación con tokens
- **SHA-256 + salt** - Hash de contraseñas (crypto nativo)
- **Yarn 1.22.22** - Gestor de paquetes

### Testing

- **Vitest** - Tests unitarios y de integración
- **Playwright** - Tests End-to-End
- **Testing Library** - Utilidades para testear React

### DevOps

- **Docker** - Contenedores
- **Docker Compose** - Orquestación multi-servicio
- **phpMyAdmin** - Administración de MySQL vía web

---

## Estructura del Proyecto

```
rent-a-car/
├── docker-compose.yml         # Orquestación de servicios
├── README.md                  # Este archivo
├── .gitignore
│
├── backend/                   # API REST (Node.js + Express)
│   ├── Dockerfile
│   ├── package.json
│   ├── yarn.lock
│   ├── .env
│   ├── .dockerignore
│   └── src/
│       ├── index.js                           # Composición e inicio
│       ├── domain/vehicle/                    # Entidad e invariantes
│       ├── application/use-cases/             # Casos de uso
│       ├── infrastructure/persistence/        # Sequelize y repositorios
│       ├── infrastructure/security/           # Adaptadores de seguridad
│       └── presentation/http/                 # API Express
│
└── frontend/                  # SPA (React + Vite)
    ├── Dockerfile
    ├── package.json
    ├── yarn.lock
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── assets/            # Imágenes, logos, íconos
        │   ├── images/
        │   ├── icons/
        │   └── brands/
        ├── components/        # Componentes reutilizables
        │   ├── Navbar.jsx
        │   ├── Hero.jsx
        │   ├── Brands.jsx
        │   └── Footer.jsx
        ├── pages/             # Páginas
        │   └── LandingPage.jsx
        └── styles/
            └── globals.css
```

### Arquitectura DDD

El backend separa dominio, aplicación, infraestructura y presentación. El caso de uso de datos demo depende de repositorios inyectados, y Sequelize queda en infraestructura. Esta es una base DDD inicial, no una implementación completa del dominio de alquiler: las reglas de disponibilidad, reservas, tarifas y pagos deben añadirse como casos de uso y entidades cuando se implementen esas funciones.

---

## Levantar el Proyecto

### Requisitos previos

- **Docker Desktop** instalado y corriendo
- **Git** instalado
- **Node.js 22+** (opcional, solo para desarrollo local sin Docker)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd rent-a-car

# 2. Levantar todos los servicios
docker-compose up --build
```

La primera vez tarda **5-8 minutos** (descarga imágenes y compila).

### Detener los servicios

```bash
# Detener (mantiene datos)
docker-compose stop

# Detener y eliminar contenedores (mantiene BD)
docker-compose down

# Detener y eliminar TODO (incluida BD)
docker-compose down -v
```

---

## URLs de Acceso

| Servicio        | URL                              | Credenciales                           |
| --------------- | -------------------------------- | -------------------------------------- |
| **Frontend**    | http://localhost:5173            | —                                      |
| **Backend API** | http://localhost:4000/api/health | —                                      |
| **phpMyAdmin**  | http://localhost:8080            | usuario: `rentacar` / pass: `rentacar` |
| **MySQL**       | `localhost:3306`                 | usuario: `rentacar` / pass: `rentacar` |

### phpMyAdmin - Acceso root

| Campo    | Valor   |
| -------- | ------- |
| Servidor | `mysql` |
| Usuario  | `root`  |
| Password | `root`  |

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
HASH_SALT=rentacar_salt_2025

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env` - opcional)

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Base de Datos

### Motor

- **MySQL 8.0** corriendo en Docker

### Esquema inicial

Actualmente Sequelize crea las tablas al iniciar el backend; todavía no hay migraciones versionadas. Las tablas existentes son:

- `usuarios` - Clientes, empleados y administradores
- `categorias` - Sedán, SUV, Camioneta, Hatchback
- `vehiculos` - Inventario individual de unidades

### Acceder a la BD

**Opción 1: phpMyAdmin**

- Abre http://localhost:8080
- Usuario: `rentacar` / Password: `rentacar`

**Opción 2: Cliente SQL (DBeaver, MySQL Workbench)**

- Host: `localhost`
- Puerto: `3306`
- Usuario: `rentacar`
- Password: `rentacar`

**Opción 3: Terminal**

```bash
docker exec -it rentacar_mysql mysql -u rentacar -p
# Password: rentacar
```

---

## Testing

### Tests unitarios y de integración

```bash
# En el frontend
cd frontend
yarn test

# En el backend (cuando se configuren)
cd backend
yarn test
```

### Tests End-to-End (Playwright)

```bash
cd frontend
yarn test:e2e
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

Si prefieres desarrollar sin Docker (más rápido para iterar):

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

| Script       | Descripción                         |
| ------------ | ----------------------------------- |
| `yarn dev`   | Desarrollo con hot reload (nodemon) |
| `yarn start` | Producción                          |

### Frontend (`frontend/package.json`)

| Script          | Descripción              |
| --------------- | ------------------------ |
| `yarn dev`      | Desarrollo con Vite      |
| `yarn build`    | Build de producción      |
| `yarn preview`  | Preview del build        |
| `yarn test`     | Tests con Vitest         |
| `yarn test:e2e` | Tests E2E con Playwright |

---

## Seguridad

- **Contraseñas:** SHA-256 con salt (crypto nativo)
- **Autenticación:** JWT con expiración
- **Autorización:** Por roles (CLIENTE, EMPLEADO, ADMINISTRADOR)
- **CORS:** Configurado para el frontend
- **Validaciones:** En todos los endpoints

> **Nota:** Para producción, se recomienda migrar a **bcrypt** o **argon2** para el hash de contraseñas.

---

## Roles de Usuario

| Rol               | Permisos                                                                       |
| ----------------- | ------------------------------------------------------------------------------ |
| **Cliente**       | Registrarse, buscar disponibilidad, reservar, ver sus reservas/pagos/historial |
| **Empleado**      | Gestionar reservas, entregar/recibir vehículos, registrar pagos                |
| **Administrador** | Todo lo anterior + gestionar usuarios, vehículos, tarifas, reportes            |

---

## Estado del Proyecto

### Completado

- [x] Configuración de Docker Compose
- [x] Backend con Express + MySQL
- [x] Frontend con React + Vite
- [x] Landing Page inicial
- [x] Health check del backend
- [x] phpMyAdmin integrado

### En Desarrollo

- [ ] Autenticación (registro, login, JWT)
- [ ] Migraciones de BD
- [ ] CRUD de vehículos
- [ ] Gestión de tarifas
- [ ] Disponibilidad y solapamientos
- [ ] Reservas
- [ ] Entrega y devolución
- [ ] Pagos e historial
- [ ] Tests unitarios, integración y E2E

---

## Equipo

Proyecto Final - Taller de Actualización V

| Integrante | Rol                             |
| ---------- | ------------------------------- |
| **A**      | Backend / Lógica de negocio     |
| **B**      | Base de datos / Persistencia    |
| **C**      | API / Autenticación / Seguridad |
| **D**      | QA / Testing / Frontend         |

---

## Documentación Adicional

- [Guía de Testing](./docs/testing.md)
- [Reglas de Tarifas](./docs/tarifas.md)
- [Reglas de Cargos](./docs/cargos.md)
- [Esquema de BD](./docs/base-datos.md)

---

## Licencia

Proyecto académico - Taller de Actualización V

---

## Soporte

Si tienes problemas:

1. Verifica que Docker Desktop esté corriendo
2. Revisa los logs: `docker-compose logs <servicio>`
3. Verifica los puertos: `netstat -ano | findstr :4000`
4. Reinicia todo: `docker-compose down -v && docker-compose up --build`
