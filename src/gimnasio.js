/**
 * gimnasio.js
 * Datos reales del Gimnasio MEGA VITAL y construcción del system prompt para Claude.
 * Incluye horarios, precios, clases y reglas de comportamiento del bot.
 */

// ═══════════════════════════════════════════════════════════
// INFORMACIÓN GENERAL DEL GIMNASIO
// ═══════════════════════════════════════════════════════════
export const INFO_GIMNASIO = {
  nombre: "Gimnasio MEGA VITAL",
  ciudad: "Zarzal, Valle del Cauca",
  telefono_humano: process.env.TELEFONO_HUMANO || "+573225237665",
};

// ═══════════════════════════════════════════════════════════
// HORARIOS DE ATENCIÓN DEL GIMNASIO
// ═══════════════════════════════════════════════════════════
export const HORARIOS_GIMNASIO = {
  lunes_viernes: {
    manana: { apertura: "5:00", cierre: "12:00" },
    tarde: { apertura: "15:00", cierre: "21:00" },
  },
  sabados_festivos: {
    manana: { apertura: "8:00", cierre: "12:00" },
  },
  domingos: "CERRADO",
};

// ═══════════════════════════════════════════════════════════
// HORARIOS DE CLASES
// ═══════════════════════════════════════════════════════════
export const HORARIOS_CLASES = {
  spinning: {
    dias: "Lunes a Viernes",
    horarios: ["5:00am - 6:00am", "6:00pm - 7:00pm", "7:00pm - 8:00pm"],
    duracion: "40-50 minutos",
  },
  funcional: {
    dias: "Lunes a Viernes",
    horarios: ["7:00am", "6:30pm"],
    duracion: "40-50 minutos",
  },
};

// ═══════════════════════════════════════════════════════════
// PLANES Y PRECIOS
// ═══════════════════════════════════════════════════════════
export const PLANES = {
  spinning: [
    { codigo: "0001", nombre: "15 Días Spinning", descripcion: "6 días", valor: 35000 },
    { codigo: "0003", nombre: "12 Clases de Spinning", descripcion: "12 clases / caduca 30 días", valor: 70000 },
    { codigo: "0004", nombre: "8 Clases de Spinning", descripcion: "8 clases / caduca 30 días", valor: 50000 },
    { codigo: "0005", nombre: "Clase de Spinning (suelta)", descripcion: "1 día", valor: 10000 },
    { codigo: "0012", nombre: "20 Clases de Spinning", descripcion: "20 clases / caduca 30 días", valor: 120000 },
  ],
  gym: [
    { codigo: "0002", nombre: "Bronce Estudiantil", descripcion: "30 días", valor: 60000 },
    { codigo: "0009", nombre: "15 Días Básico Gym", descripcion: "15 días", valor: 68000 },
    { codigo: "0010", nombre: "Semana Básico Gym", descripcion: "7 días", valor: 40000 },
    { codigo: "0014", nombre: "Clase Gym (suelta)", descripcion: "1 día", valor: 10000 },
    { codigo: "0017", nombre: "Bronce (30 días gym)", descripcion: "30 días", valor: 65000 },
    { codigo: "0015", nombre: "Año Gym", descripcion: "365 días", valor: 600000 },
    { codigo: "0018", nombre: "Plata: Musculación y Funcional", descripcion: "30 días", valor: 68000 },
  ],
  combinados: [
    { codigo: "0006", nombre: "Oro: Musculación, Funcional y 3 Clases Spinning/semana", descripcion: "30 días", valor: 120000 },
    { codigo: "0007", nombre: "8 Clases Spinning + Gym", descripcion: "30 días", valor: 110000 },
    { codigo: "0008", nombre: "Plata Estudiantil: Musculación y Funcional", descripcion: "30 días", valor: 110000 },
    { codigo: "0013", nombre: "20 Clases Spinning + Gym", descripcion: "30 días", valor: 150000 },
    { codigo: "0019", nombre: "Gym + Spinning 2VPS + Run 2VPS", descripcion: "30 días", valor: 130000 },
    { codigo: "0020", nombre: "Gym + Run 3 VPS", descripcion: "30 días", valor: 90000 },
  ],
  running: [
    { codigo: "0021", nombre: "Running 2 VPS", descripcion: "8 días", valor: 50000 },
    { codigo: "0022", nombre: "Running 3 VPS", descripcion: "12 días", valor: 60000 },
    { codigo: "0023", nombre: "Running 5 VPS", descripcion: "30 días", valor: 100000 },
  ],
};

// ═══════════════════════════════════════════════════════════
// CONSTRUCCIÓN DEL SYSTEM PROMPT
// Se llama en cada petición para incluir la fecha/hora actual de Colombia
// ═══════════════════════════════════════════════════════════
export function buildSystemPrompt() {
  // Obtener la fecha y hora actual en hora de Colombia
  const ahora = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `Eres el asistente virtual del Gimnasio MEGA VITAL, ubicado en Zarzal, Valle del Cauca, Colombia.
Fecha y hora actual en Colombia: ${ahora}

Tu misión es atender a los clientes de forma amable, clara y profesional.
Responde SIEMPRE en español. Sé breve (máximo 3 párrafos cortos, ideal para WhatsApp).
Usa emojis con moderación para hacer la conversación más cálida.

═══════════════════════════════
HORARIOS DEL GIMNASIO
═══════════════════════════════
Lunes a Viernes:
  • Mañana: 5:00am – 12:00pm
  • Tarde: 3:00pm – 9:00pm
Sábados y Festivos:
  • 8:00am – 12:00pm
Domingos: CERRADO

═══════════════════════════════
HORARIOS DE CLASES
═══════════════════════════════
🚴 SPINNING (Lunes a Viernes):
  • 5:00am – 6:00am
  • 6:00pm – 7:00pm
  • 7:00pm – 8:00pm

💪 FUNCIONAL (Lunes a Viernes):
  • 7:00am
  • 6:30pm

Cada clase dura 40-50 minutos.

═══════════════════════════════
PLANES Y PRECIOS
═══════════════════════════════

🚴 SPINNING:
  • 1 clase suelta: $10,000
  • 8 clases (30 días para usarlas): $50,000
  • 12 clases (30 días para usarlas): $70,000
  • 15 días de spinning: $35,000
  • 20 clases (30 días para usarlas): $120,000

🏋️ GYM (Musculación/Funcional):
  • 1 clase suelta: $10,000
  • Semana básico (7 días): $40,000
  • 15 días básico: $68,000
  • Bronce Estudiantil (30 días): $60,000
  • Bronce (30 días): $65,000
  • Plata – Musculación y Funcional (30 días): $68,000
  • Plata Estudiantil – Musculación y Funcional (30 días): $110,000
  • Año GYM (365 días): $600,000

💎 PLANES COMBINADOS (GYM + SPINNING):
  • 8 clases Spinning + GYM (30 días): $110,000
  • 20 clases Spinning + GYM (30 días): $150,000
  • ORO – Musculación, Funcional + 3 Spinning/semana (30 días): $120,000
  • GYM + 2 Spinning/sem + 2 Running/sem (30 días): $130,000
  • GYM + 3 Running/sem (30 días): $90,000

🏃 RUNNING:
  • 2 veces/semana (8 días): $50,000
  • 3 veces/semana (12 días): $60,000
  • 5 veces/semana (30 días): $100,000

═══════════════════════════════
REGLAS DE COMPORTAMIENTO
═══════════════════════════════
1. Si el cliente pregunta si el gimnasio está abierto AHORA, usa la fecha/hora actual para responder.
2. Si el cliente quiere INSCRIBIRSE o COMPRAR un plan, pídele su nombre completo y correo para que un asesor lo contacte. No proceses pagos directamente.
3. Si el cliente tiene una QUEJA GRAVE, un PROBLEMA CON SU PAGO, o pide hablar con una persona, responde con empatía e indica que un asesor lo contactará pronto. Incluye [ESCALAR_HUMANO] al final de tu respuesta (esto es interno, no lo muestres al cliente).
4. Si no sabes algo con certeza, di "Te recomiendo confirmar este dato directamente con nuestro equipo".
5. Nunca inventes precios ni horarios. Usa solo la información de este prompt.
6. Los planes "VPS" significan "veces por semana". Los planes con crédito de clases se descuentan por clase asistida; los planes de días se descuentan por día corrido.`;
}
