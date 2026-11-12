# Ferretería BN · Backend

Backend REST del proyecto semestral **Ferretería BN** · DSY1104 Desarrollo Fullstack II · Sección 005D · Duoc UC · 2026.

> **Estado: borrador inicial.** Este README distingue lo que está **propuesto**, **diseñado**, **implementado** y **probado**. Solo se marca como probado lo que se ejecutó de verdad.

## 1. Identificación y alcance

- **Proyecto:** Ferretería BN (tienda en línea de productos de ferretería).
- **Integrante:** Gabriel Fuentes (trabajo individual).
- **Alcance del backend:** autenticación (registro, login, JWT), catálogo de productos y categorías, solicitudes/compras, administración y reportes, según el ERS del proyecto.

## 2. Frontend

- Repositorio del frontend (React + Vite): _[pendiente de enlazar]_
- El README del frontend debe enlazar de vuelta a este repositorio.

## 3. Decisiones técnicas

| Tema | Decisión | Justificación (resumen) | Estado |
|---|---|---|---|
| Lenguaje y framework | Node.js + Express | Mismo lenguaje que el frontend; ya trabajado en la guía 18 | Propuesto |
| Ejecución | EC2 (proceso Node mantenido activo) | Más simple de depurar que Lambda con API Gateway; ya se usó en la guía 18 | Propuesto |
| Base de datos | PostgreSQL en Amazon RDS | Datos relacionales (usuarios, productos, solicitudes); RDS sin acceso público | Propuesto |
| Acceso a datos | `pg` con consultas parametrizadas | Evita inyección SQL | Implementado (conexión por probar) |
| Contraseñas | Hash con bcrypt | _Pendiente investigar y justificar con fuentes_ | Propuesto |
| Autenticación | JWT con expiración corta | _Pendiente definir algoritmo, vigencia y claves_ | Propuesto |
| Documentación de API | OpenAPI + Swagger UI | _Pendiente_ | Propuesto |

## 4. Diseño de datos

- **Diagrama entidad-relación:** `docs/diagrama-er.png` en este repositorio. _[Pendiente: subirlo a Drive y pegar aquí el enlace con acceso de lectura para el docente]_
- **Script SQL:** `docs/schema.sql` (tablas, restricciones y datos iniciales de prueba). _Escrito, aún no ejecutado en RDS._
- **Entidades:** `roles`, `usuarios`, `categorias`, `productos`, `solicitudes` y `detalle_solicitud`. Salen de los módulos del frontend: catálogo, administración de productos y categorías, ítems críticos, usuarios y solicitudes.

### Relaciones y cardinalidades

- Un rol tiene muchos usuarios; cada usuario tiene un solo rol (1:N).
- Un usuario realiza muchas solicitudes (1:N).
- Una solicitud contiene muchos detalles, y cada detalle pertenece a una sola solicitud (1:N).
- Una categoría agrupa muchos productos (1:N).
- Un producto aparece en muchos detalles de solicitud (1:N). La relación entre solicitudes y productos es de muchos a muchos y se resuelve con la tabla `detalle_solicitud`.

### Reglas de integridad

- **No duplicados:** correo de usuario, nombre de rol, nombre de categoría y un mismo producto dentro de una misma solicitud.
- **Valores válidos:** `precio > 0`, `stock >= 0`, `stock_critico >= 0`, `cantidad > 0`, `precio_unitario > 0`, `total >= 0` y `estado` solo con los valores PENDIENTE, CONFIRMADA, ENVIADA, ENTREGADA o CANCELADA.
- **Relaciones obligatorias:** todo producto tiene categoría, todo usuario tiene rol, toda solicitud tiene usuario.
- **Al eliminar:** una categoría con productos, un producto ya vendido y un usuario con solicitudes no se pueden borrar (`RESTRICT`); se desactivan con el campo `activo`, para no perder el historial. Si se elimina una solicitud, sus detalles se eliminan con ella (`CASCADE`).
- **Precio del detalle:** `precio_unitario` guarda el precio al momento de la compra, para que cambios posteriores del precio del producto no alteren solicitudes antiguas.
- **Calculado por el servidor:** `precio_unitario`, `total`, `estado` inicial, rol inicial del usuario y fechas. El cliente solo envía producto y cantidad.

### Del frontend simulado a datos iniciales

Los productos y categorías simulados del frontend pasan a `INSERT` iniciales en `schema.sql`. Los usuarios no se cargan por SQL: se crean desde la API para guardar la contraseña con hash. Todo lo guardado en la base persiste cuando se reinicia el backend.

- **Estado:** diseñado. Pendiente: ejecutar el script en RDS y verificar.

## 5. Organización y responsabilidades

```
server.js                 -> arranque del servidor
src/app.js                -> Express, CORS, JSON y rutas
src/config/               -> conexión a la base de datos
src/routes/               -> rutas HTTP
src/controllers/          -> reciben la solicitud y devuelven el estado HTTP
src/services/             -> reglas del negocio
src/repositories/         -> acceso a datos (consultas SQL)
src/middlewares/          -> autenticación, permisos y validación
src/models/               -> forma de los datos de entrada/salida
docs/                     -> especificación OpenAPI
```

Responsabilidades: Gabriel Fuentes asume todas las capas (backend, base de datos, seguridad y documentación).

## 6. API y documentación

Leyenda: Propuesto → Diseñado → Implementado → Probado.

| Método y ruta | Uso | Permiso | Estado |
|---|---|---|---|
| `GET /api/health` | Estado del servicio y de la base | Público | Implementado (por probar en EC2) |
| `POST /api/auth/register` | Registro de cliente | Público | Propuesto |
| `POST /api/auth/login` | Inicio de sesión, entrega JWT | Público | Propuesto |
| `GET /api/auth/me` | Datos del usuario autenticado | Autenticado | Propuesto |
| `GET /api/productos` | Catálogo | Público | Propuesto |
| `GET /api/productos/:id` | Detalle de producto | Público | Propuesto |
| `POST/PUT/DELETE /api/productos` | Administración de productos | Administrador | Propuesto |

- **Swagger UI / OpenAPI:** _pendiente_. Cuando exista, aquí irá la ruta real y cómo abrirla.

## 7. Seguridad

- **Contraseñas:** hash con bcrypt; nunca texto plano. _Investigación y fuentes: pendiente._
- **JWT:** firma con secreto fuera del repositorio (`JWT_SECRET` en `.env`), expiración corta, validación de firma, algoritmo, expiración, emisor y destinatario. _Pendiente de implementar._
- **Permisos:** el backend comprueba rol y propiedad del registro en cada solicitud. _Pendiente._
- **Otros controles previstos:** HTTPS, límite de intentos de login, validación de entrada, CORS restringido al frontend.
- **Diagrama de secuencia (login y ruta protegida):** _[enlace de Drive]_

## 8. Cómo ejecutar y comprobar

Requisitos: Node.js 20.6 o superior y acceso a una base PostgreSQL.

```bash
npm install
cp .env.example .env      # completar los valores (sin subir el .env)
npm run dev               # http://localhost:3000
curl http://localhost:3000/api/health
```

Resultado esperado: `{"estado":"ok","servicio":"ferreteria-bn-backend","baseDeDatos":"ok"}`. Si la base no es alcanzable (por ejemplo, RDS privada desde un PC local), `baseDeDatos` indica `no disponible`.

Despliegue en EC2: _pendiente de documentar con pasos reproducibles._

**Pruebas realizadas:** _ninguna registrada todavía._

## 9. Estado del trabajo

- **Hecho:** repositorio y estructura base, conexión a la base preparada, `GET /api/health`; modelo de datos diseñado (diagrama y script SQL escritos).
- **Pendiente:** ejecutar el esquema en RDS, endpoints de catálogo, autenticación y JWT, roles, Swagger, pruebas, integración con el frontend.
- **Dificultades:** _se irán registrando_.

## 10. Checklist

- [ ] Repositorio nuevo para el backend, separado del frontend
- [ ] README con proyecto, caso, alcance e integrantes
- [ ] README del backend enlaza al frontend y viceversa
- [ ] Tecnología y ejecución (EC2 o Lambda) justificadas
- [ ] Base de datos definida y diagrama actualizado (sin diccionario de datos)
- [ ] Diagramas en Drive con acceso de lectura para el docente
- [ ] Responsabilidades del backend y de los integrantes explicadas
- [ ] Estructura, conexión a datos y primeros endpoints, con su estado real
- [ ] API documentada con OpenAPI/Swagger
- [ ] Operaciones de la API relacionadas con el frontend
- [ ] Protección de contraseñas investigada y justificada, sin credenciales reales
- [ ] Flujo JWT y permisos diseñados; implementado vs pendiente
- [ ] Diagrama de secuencia propio con casos de rechazo
- [ ] Pruebas reales registradas
- [ ] README explica cómo ejecutar o desplegar
- [ ] Trabajo organizado para dos semanas, con próximos pasos
- [ ] Todos pueden explicar decisiones, código y avance
