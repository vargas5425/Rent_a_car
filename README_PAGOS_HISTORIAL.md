# Rent a Car — Módulos de pagos e historial de estados

## 1. Objetivo

Documentar las contribuciones realizadas en los módulos de pagos, auditoría de estados y sus interfaces web, así como las modificaciones necesarias para integrarlos con reservas, alquileres y administración de vehículos.

**Rama de trabajo:** `feature/cargos-adicionales` (confirmar antes de subir).

**Estado:** implementación realizada; pruebas automatizadas y validación integral pendientes.

## 2. Backend

Tecnologías: Node.js, Express, Sequelize, MySQL y JWT. Se mantiene la organización por capas de aplicación, dominio, infraestructura y presentación del proyecto.

### 2.1. Archivos creados

| Archivo (relativo a `backend/src/`) | Responsabilidad |
|---|---|
| `application/pagos/CalcularSaldoReserva.js` | Calcula el total base, cargos adicionales, pagos confirmados y saldo pendiente. Valida el monto del pago. |
| `application/pagos/ConsultarSaldoReserva.js` | Consulta la información económica de una reserva. |
| `application/pagos/RegistrarPago.js` | Registra pagos y verifica el saldo disponible dentro de una transacción. |
| `application/Historial/RegistrarCambioEstado.js` | Registra los cambios de estado de reservas, alquileres y vehículos. |
| `infrastructure/models/PagoModel.js` | Modelo ORM de pagos. |
| `infrastructure/models/HistorialEstadoModel.js` | Modelo ORM de auditoría de estados. |
| `infrastructure/repositories/PagosRepository.js` | Acceso a los registros de pagos. |
| `infrastructure/repositories/HistorialRepository.js` | Consultas de auditoría por entidad y por cliente. |
| `presentation/controllers/PagoController.js` | Gestiona las solicitudes HTTP del módulo de pagos. |
| `presentation/controllers/HistorialEstadoController.js` | Gestiona las consultas HTTP de historial. |
| `presentation/routes/pagoRoutes.js` | Define las rutas protegidas de pagos. |
| `presentation/routes/HistorialRoutes.js` | Define las rutas de historial según el rol del usuario. |

### 2.2. Archivos modificados

| Archivo (relativo a `backend/src/`) | Modificación realizada |
|---|---|
| `application/alquileres/CrearAlquilerDesdeReserva.js` | Incorpora auditoría de creación del alquiler. |
| `application/alquileres/RegistrarEntrega.js` | Registra las transiciones de alquiler, reserva y vehículo durante la entrega. |
| `application/alquileres/RegistrarDevolucion.js` | Registra las transiciones de alquiler, reserva y vehículo durante la devolución. |
| `application/reservas/GestionReserva.js` | Integra auditoría de confirmación, cancelación y finalización de reservas. |
| `application/flota/ActualizarVehiculo.js` | Audita cambios manuales de estado y restringe transiciones inconsistentes. |
| `application/flota/CrearVehiculo.js` | Registra el estado inicial del vehículo. |
| `application/flota/EliminarVehiculo.js` | Audita bajas lógicas y valida reservas y alquileres asociados. |
| `infrastructure/models/index.js` | Integra los modelos de pagos e historial y sus relaciones. |
| `infrastructure/repositories/ReservaRepository.js` | Incorpora auditoría transaccional de creación y confirmación de reservas. |
| `infrastructure/repositories/VehiculoRepository.js` | Añade soporte de transacciones en creación y baja lógica. |
| `presentation/controllers/CrearAlquilerController.js` | Transmite el identificador del usuario autenticado al caso de uso. |
| `presentation/controllers/EntregaController.js` | Transmite el usuario responsable de la entrega. |
| `presentation/controllers/DevolucionController.js` | Transmite el usuario responsable de la devolución. |
| `presentation/controllers/ReservaController.js` | Transmite el usuario autenticado en confirmación y finalización. |
| `presentation/controllers/VehiculoController.js` | Transmite el usuario autenticado en creación, actualización y baja. |
| `index.js` | Registra los módulos de rutas de pagos e historial en Express. |

### 2.3. Endpoints incorporados

| Método | Endpoint | Acceso previsto |
|---|---|---|
| POST | `/api/pagos` | Administrador, empleado |
| GET | `/api/pagos` | Administrador, empleado |
| GET | `/api/pagos/reserva/:reservaId/saldo` | Personal autorizado o cliente propietario |
| GET | `/api/pagos/reserva/:reservaId` | Personal autorizado o cliente propietario |
| GET | `/api/pagos/mis-pagos` | Cliente autenticado |
| GET | `/api/historial` | Administrador, empleado |
| GET | `/api/historial/RESERVA/:id` | Administrador, empleado |
| GET | `/api/historial/ALQUILER/:id` | Administrador, empleado |
| GET | `/api/historial/VEHICULO/:id` | Administrador, empleado |
| GET | `/api/historial/mio` | Cliente autenticado |

## 3. Frontend

Tecnologías: React, Vite, React Router, Axios y Bootstrap.

### 3.1. Archivos creados

| Archivo (relativo a `frontend/src/`) | Responsabilidad |
|---|---|
| `services/pagoService.js` | Comunicación con los endpoints de pagos y saldo. |
| `services/historialService.js` | Comunicación con los endpoints de auditoría. |
| `pages/employee/GestionPagosPage.jsx` | Listado, filtros, indicadores y formulario de registro de pagos. |
| `pages/employee/GestionPagosPage.css` | Estilos responsive compartidos por las interfaces de pagos. |
| `pages/employee/DetallePagosReservaPage.jsx` | Detalle económico de una reserva e historial de pagos. |
| `pages/client/MisPagosPage.jsx` | Consulta y filtrado de pagos propios del cliente. |
| `pages/client/MiHistorialPage.jsx` | Línea de tiempo de reservas y alquileres del cliente. |
| `pages/client/MiHistorialPage.css` | Estilos de la línea de tiempo y adaptación responsive. |
| `pages/admin/HistorialVehiculoPage.jsx` | Búsqueda de vehículos y consulta de sus cambios de estado. |
| `pages/admin/HistorialVehiculoPage.css` | Estilos del historial de vehículos, incluidos ajustes de modo oscuro. |

### 3.2. Archivos modificados

| Archivo (relativo a `frontend/src/`) | Modificación realizada |
|---|---|
| `App.jsx` | Incorpora las cinco rutas protegidas de pagos e historial. |
| `components/layout/Navbar/Navbar.jsx` | Añade enlaces de navegación según el rol del usuario. |
| `components/layout/Navbar/Navbar.css` | Mejora la distribución, legibilidad y adaptación de la navegación. |

### 3.3. Rutas de navegación

| Ruta | Página | Roles |
|---|---|---|
| `/dashboard/pagos` | Gestión de pagos | Administrador, empleado |
| `/dashboard/pagos/reserva/:reservaId` | Detalle de pagos | Administrador, empleado |
| `/mis-pagos` | Mis Pagos | Cliente |
| `/mi-historial` | Mi Historial | Cliente |
| `/dashboard/historial-vehiculos` | Historial de vehículos | Administrador, empleado |

## 4. Base de datos

Se incorporaron las tablas `pagos` e `historial_estados` en MySQL. La primera almacena los importes, métodos, estados y referencias de pagos vinculados a reservas. La segunda almacena la entidad auditada, estado anterior, estado nuevo, responsable, observación y fecha del movimiento.

**Requisito de entrega:** incluir o verificar los scripts SQL o migraciones versionadas de ambas tablas. Los cambios realizados directamente en la base de datos local no se transfieren mediante Git.

## 5. Pruebas pendientes

- Tests unitarios: total pagado y saldo, prevención de saldo negativo y cálculo de total final con cargos.
- Tests de integración: historial por vehículo, registro de pago y saldo, rechazo de sobrepago e historial por cliente.
- Tests E2E: pago, historial y flujo integral.

La visualización de las interfaces no sustituye la validación funcional de las operaciones.

## 6. Verificación del inventario antes del commit

Este inventario recoge los 41 archivos identificados durante el desarrollo (28 del Backend y 13 del Frontend). Debe contrastarse con el estado real de la rama para confirmar nombres, mayúsculas, clasificación de archivos nuevos/modificados y posibles cambios adicionales. No constituye una lectura directa del repositorio local.

Desde la raíz del proyecto:

```powershell
git status --short
git diff --name-status
git ls-files --others --exclude-standard
```

Comprobar especialmente que `ReservaRepository.js` conserve los métodos y asociaciones del repositorio original, que las rutas estén registradas y que los scripts de base de datos estén incluidos. No incorporar credenciales, archivos `.env` privados, dependencias ni compilaciones generadas.

## 7. Commits propuestos

- `feat(backend): implementar pagos y auditoría de estados`
- `feat(frontend): implementar interfaces de pagos e historial`
- `docs: documentar archivos creados y modificados en pagos e historial`
