/**
 * claude.js
 * Servicio de IA usando el SDK de Groq (groq-sdk).
 * Genera respuestas del bot usando historial de conversación y el system prompt dinámico.
 * Detecta y gestiona el flag [ESCALAR_HUMANO].
 */

import Groq from "groq-sdk";
import { buildSystemPrompt } from "./gimnasio.js";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODELO = "llama-3.3-70b-versatile";
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
    const messages = [
      { role: "system", content: buildSystemPrompt() },
      ...historial.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: mensajeUsuario },
    ];

    const completion = await client.chat.completions.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      messages,
    });

    const textoRespuesta =
      completion.choices[0]?.message?.content?.trim() || "";

    const escalarHumano = textoRespuesta.includes("[ESCALAR_HUMANO]");

    const respuestaLimpia = textoRespuesta
      .replace(/\[ESCALAR_HUMANO\]/g, "")
      .trim();

    return { respuesta: respuestaLimpia, escalarHumano };
  } catch (error) {
    console.error("[claude.js] Error al llamar a la API de Groq:", error);

    return {
      respuesta:
        "Lo siento, en este momento tengo dificultades técnicas. Por favor comunícate directamente con nosotros al número de atención al cliente. 🙏",
      escalarHumano: false,
    };
  }
}
