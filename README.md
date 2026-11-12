# Ferretería BN · Backend

Backend REST del proyecto semestral **Ferretería BN** · DSY1104 Desarrollo Fullstack II · Sección 005D · Duoc UC · 2026.

> **Estado: borrador inicial.** Este README distingue lo que está **propuesto**, **diseñado**, **implementado** y **probado**. Solo se marca como probado lo que se ejecutó de verdad.

## 1. Identificación y alcance

- **Proyecto:** Ferretería BN (tienda en línea de productos de ferretería).
- **Integrante:** Gabriel Fuentes (trabajo individual).
- **Alcance del backend:** autenticación (registro, login, JWT), catálogo de productos y categorías, solicitudes/compras, administración y reportes, según el ERS del proyecto.

## 2. Frontend

- Repositorio del frontend (React + Vite): https://github.com/GabrielIgnacio013D/FerreteriaBn
- El README del frontend enlaza de vuelta a este repositorio.

## 3. Decisiones técnicas

| Tema | Decisión | Justificación (resumen) | Estado |
|---|---|---|---|
| Lenguaje y framework | Node.js + Express | Mismo lenguaje que el frontend; ya trabajado en la guía 18 | Implementado |
| Ejecución | EC2 (proceso Node mantenido activo) | Más simple de depurar que Lambda con API Gateway; ya se usó en la guía 18 | Propuesto |
| Base de datos | PostgreSQL en Amazon RDS | Datos relacionales (usuarios, productos, solicitudes); RDS sin acceso público | Diseñado |
| Acceso a datos | `pg` con consultas parametrizadas | Evita inyección SQL | Implementado (por probar) |
| Contraseñas | Hash con bcrypt, usando la biblioteca `bcryptjs` | Ver sección 7 | Implementado (por probar) |
| Autenticación | JWT firmado (HS256) con `jsonwebtoken`, vigencia de 15 minutos | Ver sección 7 | Implementado (por probar) |
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
server.js                      -> arranque del servidor (exige JWT_SECRET)
src/app.js                     -> Express, CORS, JSON y rutas
src/config/db.js               -> conexión a PostgreSQL (pool)
src/routes/                    -> rutas HTTP (health, auth, productos)
src/controllers/               -> reciben la solicitud y devuelven el estado HTTP
src/services/auth.service.js   -> reglas de registro y login, hash y emisión del JWT
src/repositories/              -> acceso a datos (consultas SQL parametrizadas)
src/middlewares/               -> autenticar (valida el JWT) y requerirRol (permisos)
docs/                          -> diagramas y script SQL
```

Responsabilidades: Gabriel Fuentes asume todas las capas (backend, base de datos, seguridad y documentación).

## 6. API y documentación

Leyenda: Propuesto → Diseñado → Implementado → Probado.

| Método y ruta | Uso | Permiso | Pantalla del frontend | Estado |
|---|---|---|---|---|
| `GET /api/health` | Estado del servicio y de la base | Público | — | Implementado (por probar) |
| `POST /api/auth/register` | Registro de cliente (rol asignado por el servidor) | Público | Registro | Implementado (por probar) |
| `POST /api/auth/login` | Inicio de sesión, entrega JWT | Público | Login | Implementado (por probar) |
| `GET /api/auth/me` | Datos del usuario autenticado | Autenticado (Bearer JWT) | Perfil | Implementado (por probar) |
| `GET /api/productos` | Catálogo (solo productos activos) | Público | Inicio, Categorías | Implementado (por probar) |
| `GET /api/productos/:id` | Detalle de producto | Público | Detalle de producto | Implementado (por probar) |
| `POST/PUT/DELETE /api/productos` | Administración de productos | ADMIN | Admin de productos | Propuesto |
| `/api/categorias`, `/api/solicitudes`, `/api/usuarios` | Categorías, solicitudes y usuarios | Según rol | Admin y checkout | Propuesto |

**Contrato de ejemplo (datos ficticios).**

`POST /api/auth/register` · el cliente envía `nombre`, `correo` y `password`. El servidor genera `id` y `rol` y no devuelve la contraseña ni su hash.

```json
{ "nombre": "Ana Prueba", "correo": "ana@example.com", "password": "ClaveDePrueba123" }
```
Respuesta `201`: `{ "id": 1, "nombre": "Ana Prueba", "correo": "ana@example.com", "rol": "CLIENTE" }`. Errores: `400` datos inválidos, `409` correo ya registrado.

`POST /api/auth/login` · entrada `correo` y `password`. Respuesta `200`: `{ "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": "15m" }`. Error `401` con mensaje genérico "Credenciales inválidas".

`GET /api/auth/me` · cabecera `Authorization: Bearer <jwt>`. Respuesta `200`: id, nombre, correo y rol. Errores: `401` token ausente, inválido o vencido.

- **Swagger UI / OpenAPI:** _pendiente_. Cuando exista, aquí irá la ruta real y cómo abrirla.

## 7. Seguridad

### Contraseñas

- Se guarda solo el **hash bcrypt** (biblioteca `bcryptjs`, costo 10, configurable con `BCRYPT_ROUNDS`). Nunca se guarda ni se devuelve la contraseña en texto plano.
- **Por qué bcrypt:** es un algoritmo diseñado para contraseñas, con sal aleatoria incorporada en cada hash y un costo ajustable que lo hace deliberadamente lento, a diferencia de SHA-256, pensado para ser rápido. Se usa `bcryptjs`, implementación en JavaScript puro, para evitar compilar módulos nativos en EC2. Limitación conocida: bcrypt solo considera los primeros 72 bytes, por eso se acepta un máximo de 72 caracteres.
- **Fuentes de referencia:** OWASP Password Storage Cheat Sheet; Provos y Mazières, "A Future-Adaptable Password Scheme" (1999). _Pendiente: ampliar con las versiones consultadas._

### JWT

- **Quién emite y verifica:** el propio backend. Algoritmo permitido: HS256, con secreto `JWT_SECRET` (mínimo 32 caracteres) guardado en el `.env`, fuera del repositorio y de React. El servidor no arranca si falta.
- **Campos del token:** `sub` (id del usuario), `exp` (15 minutos), `iss` (`ferreteria-bn-backend`) y `aud` (`ferreteria-bn-frontend`). No lleva contraseñas, rol ni datos sensibles.
- **Validación:** en cada ruta protegida se comprueba firma, algoritmo permitido, expiración, emisor y destinatario; luego se consulta al usuario en la base.
- **Rol fuera del token:** el rol se lee de la base en cada solicitud. Así, un cambio de rol o la desactivación de una cuenta surten efecto de inmediato.
- **Vigencia y cierre de sesión:** 15 minutos y sin refresh token; al vencer, se vuelve a iniciar sesión. Un token ya emitido no se puede revocar antes de su expiración; la mitigación es su vida corta y la verificación del estado `activo` en cada solicitud.
- **En el frontend (propuesto):** el token se mantiene en memoria, no en localStorage; al recargar se pide login de nuevo.

### Roles y permisos (propuesto)

| Operación | ADMIN | CLIENTE | Sin sesión |
|---|---|---|---|
| Ver catálogo y detalle | Sí | Sí | Sí |
| Registrarse e iniciar sesión | — | — | Sí |
| Ver su perfil | Sí | Sí | No |
| Crear, editar y desactivar productos y categorías | Sí | No | No |
| Crear una solicitud | Sí | Sí | No |
| Ver solicitudes | Todas | Solo las propias | No |
| Gestionar usuarios y asignar roles | Sí | No | No |

El backend comprueba rol y propiedad del registro en cada solicitud (`requerirRol` ya implementado); la regla de propiedad por id en URL se aplicará con los endpoints de solicitudes. Solo un ADMIN podrá asignar roles. El registro público siempre crea usuarios con rol CLIENTE.

### Controles previstos (pendientes)

HTTPS delante de la API, límite de intentos de login, validación más estricta de entrada, CORS restringido al origen del frontend (ya limitado a `http://localhost:5173`; ajustar al desplegar) y registros que excluyan contraseñas y tokens.

- **Diagrama de secuencia (login y ruta protegida, con casos de rechazo):** `docs/diagrama-secuencia-jwt.png`. _[Pendiente: subirlo a Drive y pegar aquí el enlace]_

## 8. Cómo ejecutar y comprobar

Requisitos: Node.js 20.6 o superior y una base PostgreSQL con el esquema de `docs/schema.sql` aplicado.

```bash
npm install
cp .env.example .env      # completar valores (sin subir el .env)
npm run dev               # http://localhost:3000
curl http://localhost:3000/api/health
```

Resultado esperado de `health`: `{"estado":"ok","servicio":"ferreteria-bn-backend","baseDeDatos":"ok"}`. Si la base no es alcanzable (por ejemplo, RDS privada desde un PC local), `baseDeDatos` indica `no disponible`.

Despliegue en EC2: clonar el repositorio, `npm install`, crear el `.env` en el servidor y ejecutar `npm start`. _Pasos con evidencia: pendiente._

### Pruebas realizadas

_Todavía no se han ejecutado. Se completará esta tabla con los resultados reales._

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Login válido | 200 con accessToken | Pendiente |
| Login con contraseña incorrecta | 401 "Credenciales inválidas" | Pendiente |
| Ruta protegida sin token | 401 | Pendiente |
| Ruta protegida con token alterado | 401 | Pendiente |
| Registro con correo repetido | 409 | Pendiente |
| Registro con datos inválidos | 400 | Pendiente |
| `GET /api/productos` | 200 con la lista | Pendiente |
| `GET /api/productos/999` | 404 | Pendiente |

## 9. Estado del trabajo

- **Hecho (escrito, por probar):** estructura del proyecto, conexión a la base, `health`, registro, login con JWT, `me`, catálogo de lectura, middlewares de autenticación y roles; modelo de datos y diagrama de secuencia diseñados.
- **Pendiente:** ejecutar el esquema en RDS y probar todo en EC2, endpoints de administración, categorías y solicitudes, Swagger/OpenAPI, límite de intentos de login, integración con el frontend.
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
