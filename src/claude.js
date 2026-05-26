/**
 * claude.js
 * Servicio de IA usando el SDK oficial de Anthropic (@anthropic-ai/sdk).
 * Genera respuestas del bot usando historial de conversación y el system prompt dinámico.
 * Detecta y gestiona el flag [ESCALAR_HUMANO].
 */

import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./gimnasio.js";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODELO = "claude-opus-4-7";
const MAX_TOKENS = 1024;

/**
 * Genera una respuesta del asistente usando el historial de conversación.
 *
 * @param {Array<{role: string, content: string}>} historial - Mensajes previos de la conversación.
 * @param {string} mensajeUsuario - El nuevo mensaje del cliente.
 * @returns {Promise<{respuesta: string, escalarHumano: boolean}>}
 */
export async function generarRespuesta(historial, mensajeUsuario) {
  try {
    // Construir el arreglo de mensajes: historial previo + nuevo mensaje del usuario
    const messages = [
      ...historial.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: "user",
        content: mensajeUsuario,
      },
    ];

    const response = await client.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: buildSystemPrompt(),
      messages,
    });

    // Extraer el texto de la respuesta (puede haber bloques thinking + text)
    let textoRespuesta = "";
    for (const block of response.content) {
      if (block.type === "text") {
        textoRespuesta += block.text;
      }
    }

    textoRespuesta = textoRespuesta.trim();

    // Detectar flag de escalación (no debe mostrarse al cliente)
    const escalarHumano = textoRespuesta.includes("[ESCALAR_HUMANO]");

    // Limpiar el flag interno antes de enviar al cliente
    const respuestaLimpia = textoRespuesta
      .replace(/\[ESCALAR_HUMANO\]/g, "")
      .trim();

    return {
      respuesta: respuestaLimpia,
      escalarHumano,
    };
  } catch (error) {
    console.error("[claude.js] Error al llamar a la API de Anthropic:", error);

    // Respuesta de fallback amable
    return {
      respuesta:
        "Lo siento, en este momento tengo dificultades técnicas. Por favor comunícate directamente con nosotros al número de atención al cliente. 🙏",
      escalarHumano: false,
    };
  }
}
