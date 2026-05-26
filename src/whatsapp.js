/**
 * whatsapp.js
 * Servicio para enviar mensajes a través de la API de 360dialog (WhatsApp Business API).
 * Gestiona el envío de respuestas del bot y mensajes de escalación al humano.
 */

import axios from "axios";
import { INFO_GIMNASIO } from "./gimnasio.js";

const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL || "https://waba.360dialog.io/v1/messages";
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "";

/**
 * Envía un mensaje de texto simple a un número de WhatsApp.
 *
 * @param {string} telefono - Número del destinatario (ej: "573001234567").
 * @param {string} texto - Contenido del mensaje a enviar.
 * @returns {Promise<boolean>} true si se envió correctamente, false en caso de error.
 */
export async function enviarMensaje(telefono, texto) {
  if (!WHATSAPP_API_KEY) {
    console.warn(
      "[whatsapp.js] WHATSAPP_API_KEY no configurada. Mensaje no enviado."
    );
    console.log(`[whatsapp.js] Mensaje simulado → ${telefono}: ${texto}`);
    return false;
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telefono,
      type: "text",
      text: {
        preview_url: false,
        body: texto,
      },
    };

    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        "D360-API-KEY": WHATSAPP_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(
        `[whatsapp.js] ✅ Mensaje enviado a ${telefono} (status: ${response.status})`
      );
      return true;
    } else {
      console.error(
        `[whatsapp.js] ❌ Respuesta inesperada al enviar a ${telefono}: status ${response.status}`
      );
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.error(
        `[whatsapp.js] ❌ Error API WhatsApp al enviar a ${telefono}:`,
        error.response.status,
        error.response.data
      );
    } else {
      console.error(
        `[whatsapp.js] ❌ Error de red al enviar a ${telefono}:`,
        error.message
      );
    }
    return false;
  }
}

/**
 * Envía la respuesta del bot al cliente.
 * Si hay escalación, envía un segundo mensaje informando que un asesor lo contactará,
 * y notifica al número humano configurado.
 *
 * @param {string} telefono - Número del cliente.
 * @param {string} respuesta - Texto de la respuesta del bot (ya sin el flag interno).
 * @param {boolean} escalarHumano - Indica si se debe escalar la conversación.
 * @returns {Promise<void>}
 */
export async function enviarRespuestaBot(telefono, respuesta, escalarHumano) {
  // Enviar la respuesta principal del bot al cliente
  await enviarMensaje(telefono, respuesta);

  if (escalarHumano) {
    // Pequeña pausa para que los mensajes lleguen en orden
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mensaje de escalación al cliente
    const mensajeEscalacion =
      "Un asesor de nuestro equipo se comunicará contigo muy pronto. ¡Gracias por tu paciencia! 🙏";
    await enviarMensaje(telefono, mensajeEscalacion);

    // Notificar al número humano configurado
    const telefonoHumano = INFO_GIMNASIO.telefono_humano;
    if (telefonoHumano) {
      const notificacion = `⚠️ *ESCALACIÓN* ⚠️\nEl cliente con número *${telefono}* requiere atención humana.\nÚltimo mensaje: se ha activado la escalación automática del bot.`;
      await enviarMensaje(telefonoHumano, notificacion);
    }

    console.log(
      `[whatsapp.js] 🔔 Escalación registrada para el número: ${telefono}`
    );
  }
}

/**
 * Extrae el número de teléfono y el texto del mensaje entrante del payload de 360dialog.
 *
 * @param {object} body - Cuerpo del webhook recibido.
 * @returns {{ telefono: string|null, mensaje: string|null }} Datos extraídos del mensaje.
 */
export function extraerMensaje(body) {
  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const mensajeObj = value?.messages?.[0];

    if (!mensajeObj) {
      return { telefono: null, mensaje: null };
    }

    // Solo procesamos mensajes de tipo texto
    if (mensajeObj.type !== "text") {
      console.log(
        `[whatsapp.js] Mensaje de tipo "${mensajeObj.type}" ignorado (solo se procesan textos).`
      );
      return { telefono: null, mensaje: null };
    }

    const telefono = mensajeObj.from;
    const mensaje = mensajeObj.text?.body?.trim();

    if (!telefono || !mensaje) {
      return { telefono: null, mensaje: null };
    }

    return { telefono, mensaje };
  } catch (error) {
    console.error("[whatsapp.js] Error al extraer mensaje del payload:", error);
    return { telefono: null, mensaje: null };
  }
}
