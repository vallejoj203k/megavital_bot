/**
 * webhook.js
 * Controlador Express para el webhook de WhatsApp (Meta Cloud API).
 *
 * GET  /webhook → Verificación del webhook (hub.mode + hub.verify_token + hub.challenge).
 * POST /webhook → Recepción de mensajes entrantes y actualizaciones de estado.
 *
 * IMPORTANTE: Responde HTTP 200 INMEDIATAMENTE al POST y luego procesa en background.
 * Meta reintenta el webhook si no recibe 200 en menos de 20 segundos.
 * Los webhooks de estado (delivered, read) se descartan silenciosamente en extraerMensaje().
 */

import { extraerMensaje, enviarRespuestaBot } from "./whatsapp.js";
import { generarRespuesta } from "./claude.js";
import {
  upsertCliente,
  obtenerHistorial,
  guardarMensaje,
  limpiarHistorialAntiguo,
  registrarInteraccion,
} from "./memoria.js";

const WEBHOOK_VERIFY_TOKEN =
  process.env.WEBHOOK_VERIFY_TOKEN || "megavital_token_secreto";

/**
 * GET /webhook
 * Verifica el token del webhook enviado por 360dialog / Meta.
 */
export function verificarWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("[webhook.js] ✅ Webhook verificado correctamente.");
    return res.status(200).send(challenge);
  }

  console.warn(
    "[webhook.js] ❌ Verificación de webhook fallida. Token incorrecto o modo inválido."
  );
  return res.status(403).send("Forbidden");
}

/**
 * POST /webhook
 * Recibe mensajes entrantes de WhatsApp.
 * Responde 200 de inmediato y procesa el mensaje en background.
 */
export function recibirMensaje(req, res) {
  // Responder 200 ANTES de procesar para evitar reintentos del webhook
  res.status(200).send("OK");

  // Procesar en background (sin await para no bloquear la respuesta HTTP)
  procesarMensajeBackground(req.body).catch((err) => {
    console.error("[webhook.js] Error no controlado en procesamiento background:", err);
  });
}

/**
 * Procesa el mensaje entrante de forma asíncrona:
 * 1. Extrae teléfono y texto del payload.
 * 2. Obtiene o crea el cliente en Supabase.
 * 3. Recupera el historial de conversación.
 * 4. Llama a Claude para generar la respuesta.
 * 5. Guarda los mensajes en Supabase.
 * 6. Envía la respuesta (y notificación de escalación si aplica) por WhatsApp.
 *
 * @param {object} body - Cuerpo del webhook recibido.
 */
async function procesarMensajeBackground(body) {
  try {
    // 1. Extraer datos del mensaje
    const { telefono, mensaje } = extraerMensaje(body);

    if (!telefono || !mensaje) {
      // No es un mensaje de texto válido; ignorar silenciosamente
      return;
    }

    console.log(`[webhook.js] 📩 Mensaje recibido de ${telefono}: "${mensaje.substring(0, 80)}..."`);

    // 2. Upsert del cliente en la base de datos
    await upsertCliente(telefono);

    // 3. Limpiar historial antiguo y obtener el historial reciente
    await limpiarHistorialAntiguo(telefono);
    const historial = await obtenerHistorial(telefono);

    // 4. Generar respuesta con Claude
    const { respuesta, escalarHumano } = await generarRespuesta(historial, mensaje);

    console.log(
      `[webhook.js] 🤖 Respuesta generada para ${telefono} (escalar: ${escalarHumano})`
    );

    // 5. Guardar mensajes en Supabase (user + assistant)
    await guardarMensaje(telefono, "user", mensaje);
    await guardarMensaje(telefono, "assistant", respuesta);

    // 6. Registrar la interacción completa para análisis
    await registrarInteraccion(telefono, mensaje, respuesta, escalarHumano);

    // 7. Enviar respuesta al cliente (y escalación si aplica)
    await enviarRespuestaBot(telefono, respuesta, escalarHumano);

    console.log(`[webhook.js] ✅ Mensaje procesado correctamente para ${telefono}`);
  } catch (error) {
    console.error("[webhook.js] ❌ Error en procesarMensajeBackground:", error);
  }
}
