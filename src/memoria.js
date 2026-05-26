/**
 * memoria.js
 * Gestión del historial de conversaciones y datos de clientes usando Supabase.
 * Incluye modo degradado: si Supabase no está disponible, el bot responde sin memoria.
 */

import { createClient } from "@supabase/supabase-js";

const MAX_HISTORIAL = parseInt(process.env.MAX_HISTORIAL_MENSAJES || "20", 10);
const TIMEOUT_HORAS = parseInt(process.env.TIMEOUT_CONVERSACION_HORAS || "24", 10);

let supabase = null;

/**
 * Inicializa el cliente de Supabase.
 * Si las variables de entorno no están configuradas, el módulo opera en modo degradado.
 */
function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn(
      "[memoria.js] SUPABASE_URL o SUPABASE_SERVICE_KEY no configuradas. Operando sin memoria persistente."
    );
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * Obtiene o crea un registro de cliente por número de teléfono.
 *
 * @param {string} telefono - Número de WhatsApp del cliente (ej: "573001234567").
 * @returns {Promise<object|null>} Registro del cliente o null en modo degradado.
 */
export async function upsertCliente(telefono) {
  const db = getSupabase();
  if (!db) return null;

  try {
    const { data, error } = await db
      .from("clientes")
      .upsert(
        { telefono, ultima_actividad: new Date().toISOString() },
        { onConflict: "telefono", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) {
      console.error("[memoria.js] Error en upsertCliente:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[memoria.js] Error inesperado en upsertCliente:", err);
    return null;
  }
}

/**
 * Obtiene el historial reciente de una conversación.
 * Filtra mensajes que superen el timeout de conversación.
 *
 * @param {string} telefono - Número de WhatsApp del cliente.
 * @returns {Promise<Array<{role: string, content: string}>>} Lista de mensajes ordenados cronológicamente.
 */
export async function obtenerHistorial(telefono) {
  const db = getSupabase();
  if (!db) return [];

  try {
    const limiteTimestamp = new Date(
      Date.now() - TIMEOUT_HORAS * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await db
      .from("conversaciones")
      .select("role, content, created_at")
      .eq("telefono", telefono)
      .gte("created_at", limiteTimestamp)
      .order("created_at", { ascending: true })
      .limit(MAX_HISTORIAL);

    if (error) {
      console.error("[memoria.js] Error en obtenerHistorial:", error.message);
      return [];
    }

    return (data || []).map((m) => ({ role: m.role, content: m.content }));
  } catch (err) {
    console.error("[memoria.js] Error inesperado en obtenerHistorial:", err);
    return [];
  }
}

/**
 * Guarda un mensaje (user o assistant) en el historial de conversación.
 *
 * @param {string} telefono - Número de WhatsApp del cliente.
 * @param {"user"|"assistant"} role - Rol del mensaje.
 * @param {string} content - Contenido del mensaje.
 * @returns {Promise<void>}
 */
export async function guardarMensaje(telefono, role, content) {
  const db = getSupabase();
  if (!db) return;

  try {
    const { error } = await db.from("conversaciones").insert({
      telefono,
      role,
      content,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[memoria.js] Error en guardarMensaje:", error.message);
    }
  } catch (err) {
    console.error("[memoria.js] Error inesperado en guardarMensaje:", err);
  }
}

/**
 * Elimina mensajes más antiguos que el timeout de conversación para un número.
 * Puede usarse en limpieza periódica o al procesar cada mensaje.
 *
 * @param {string} telefono - Número de WhatsApp del cliente.
 * @returns {Promise<void>}
 */
export async function limpiarHistorialAntiguo(telefono) {
  const db = getSupabase();
  if (!db) return;

  try {
    const limiteTimestamp = new Date(
      Date.now() - TIMEOUT_HORAS * 60 * 60 * 1000
    ).toISOString();

    const { error } = await db
      .from("conversaciones")
      .delete()
      .eq("telefono", telefono)
      .lt("created_at", limiteTimestamp);

    if (error) {
      console.error("[memoria.js] Error en limpiarHistorialAntiguo:", error.message);
    }
  } catch (err) {
    console.error("[memoria.js] Error inesperado en limpiarHistorialAntiguo:", err);
  }
}

/**
 * Registra una interacción completa (mensaje + respuesta) para análisis.
 *
 * @param {string} telefono - Número de WhatsApp del cliente.
 * @param {string} mensajeUsuario - Mensaje enviado por el cliente.
 * @param {string} respuestaBot - Respuesta generada por el bot.
 * @param {boolean} escalado - Si fue escalado a humano.
 * @returns {Promise<void>}
 */
export async function registrarInteraccion(
  telefono,
  mensajeUsuario,
  respuestaBot,
  escalado = false
) {
  const db = getSupabase();
  if (!db) return;

  try {
    const { error } = await db.from("interacciones").insert({
      telefono,
      mensaje_usuario: mensajeUsuario,
      respuesta_bot: respuestaBot,
      escalado,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[memoria.js] Error en registrarInteraccion:", error.message);
    }
  } catch (err) {
    console.error("[memoria.js] Error inesperado en registrarInteraccion:", err);
  }
}
