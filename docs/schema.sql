-- Esquema inicial de la Ferretería BN (PostgreSQL)
-- Recomendado: usar una base nueva para no chocar con la tabla "productos" de la guía 18.
--   CREATE DATABASE ferreteria_bn;
--   \c ferreteria_bn

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255)
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  precio INTEGER NOT NULL CHECK (precio > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_critico INTEGER NOT NULL DEFAULT 5 CHECK (stock_critico >= 0),
  imagen_url VARCHAR(255),
  categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE solicitudes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'ENVIADA', 'ENTREGADA', 'CANCELADA')),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE detalle_solicitud (
  id SERIAL PRIMARY KEY,
  solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario INTEGER NOT NULL CHECK (precio_unitario > 0),
  UNIQUE (solicitud_id, producto_id)
);

-- Datos iniciales de prueba (los usuarios se crean desde la API, para guardar el hash con bcrypt)
INSERT INTO roles (nombre) VALUES ('ADMIN'), ('CLIENTE');

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Herramientas manuales', 'Martillos, alicates, destornilladores'),
  ('Herramientas eléctricas', 'Taladros, sierras, lijadoras'),
  ('Fijaciones', 'Clavos, tornillos, pernos'),
  ('Pinturas', 'Pinturas, brochas y rodillos');

INSERT INTO productos (nombre, descripcion, precio, stock, stock_critico, categoria_id) VALUES
  ('Martillo carpintero', 'Martillo de acero con mango de fibra', 8990, 25, 5, 1),
  ('Alicate universal', 'Alicate de 8 pulgadas', 4500, 30, 5, 1),
  ('Taladro inalámbrico', 'Taladro de 18V con batería', 49990, 10, 3, 2),
  ('Sierra circular', 'Sierra circular de 7 1/4 pulgadas', 69990, 6, 2, 2),
  ('Caja de clavos', 'Clavos de 2 pulgadas, 1 kg', 2500, 100, 20, 3),
  ('Pintura látex blanca', 'Galón de 4 litros', 15990, 12, 4, 4);
