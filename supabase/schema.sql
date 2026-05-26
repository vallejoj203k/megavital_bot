-- ═══════════════════════════════════════════════════════════════════════════
-- schema.sql
-- Esquema de base de datos para el Bot de WhatsApp – Gimnasio MEGA VITAL
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: clientes
-- Registro de clientes que han interactuado con el bot.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id                BIGSERIAL PRIMARY KEY,
  telefono          TEXT NOT NULL UNIQUE,          -- Número WhatsApp (ej: "573001234567")
  nombre            TEXT,                           -- Nombre capturado durante la conversación
  correo            TEXT,                           -- Correo capturado durante la conversación
  ultima_actividad  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes (telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_ultima_actividad ON clientes (ultima_actividad);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: conversaciones
-- Historial de mensajes de cada conversación (ventana deslizante de 24 horas).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversaciones (
  id          BIGSERIAL PRIMARY KEY,
  telefono    TEXT NOT NULL,            -- Número WhatsApp del cliente
  role        TEXT NOT NULL             -- "user" o "assistant"
              CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,            -- Contenido del mensaje
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversaciones_telefono ON conversaciones (telefono);
CREATE INDEX IF NOT EXISTS idx_conversaciones_telefono_created ON conversaciones (telefono, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: interacciones
-- Registro de interacciones completas para análisis y auditoría.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interacciones (
  id               BIGSERIAL PRIMARY KEY,
  telefono         TEXT NOT NULL,
  mensaje_usuario  TEXT NOT NULL,       -- Mensaje del cliente
  respuesta_bot    TEXT NOT NULL,       -- Respuesta generada por el bot
  escalado         BOOLEAN NOT NULL DEFAULT FALSE,  -- ¿Se activó [ESCALAR_HUMANO]?
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interacciones_telefono ON interacciones (telefono);
CREATE INDEX IF NOT EXISTS idx_interacciones_escalado ON interacciones (escalado) WHERE escalado = TRUE;
CREATE INDEX IF NOT EXISTS idx_interacciones_created ON interacciones (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Se usa la service key en el backend, por lo que se deshabilita RLS.
-- Si en el futuro se usan claves anónimas, habilitar y configurar policies.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE clientes       DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones  DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCIÓN DE LIMPIEZA AUTOMÁTICA
-- Elimina mensajes de conversación más antiguos que 24 horas.
-- Puede configurarse como un cron job en Supabase (pg_cron).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION limpiar_conversaciones_antiguas()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM conversaciones
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Para habilitar limpieza automática con pg_cron (opcional):
-- SELECT cron.schedule('limpiar-conversaciones', '0 * * * *', 'SELECT limpiar_conversaciones_antiguas()');
