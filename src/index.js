/**
 * index.js
 * Punto de entrada del servidor Express para el bot de WhatsApp de Gimnasio MEGA VITAL.
 * Configura middlewares, rutas y arranca el servidor HTTP.
 */

import "dotenv/config";
import express from "express";
import { verificarWebhook, recibirMensaje } from "./webhook.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rutas del webhook ────────────────────────────────────────────────────────

/**
 * GET /webhook
 * Verificación del webhook por parte de 360dialog / Meta.
 */
app.get("/webhook", verificarWebhook);

/**
 * POST /webhook
 * Recepción de mensajes entrantes de WhatsApp.
 */
app.post("/webhook", recibirMensaje);

// ─── Health check ─────────────────────────────────────────────────────────────

/**
 * GET /health
 * Endpoint de salud para monitorización (Railway, Render, UptimeRobot, etc.).
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "megavital-bot",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

/**
 * GET /
 * Ruta raíz con información básica del servicio.
 */
app.get("/", (_req, res) => {
  res.status(200).json({
    nombre: "Gimnasio MEGA VITAL – Bot de WhatsApp",
    version: "1.0.0",
    estado: "activo",
  });
});

// ─── Manejo de rutas no encontradas ──────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ─── Arranque del servidor ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏋️  Gimnasio MEGA VITAL – Bot de WhatsApp`);
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`📡 Webhook:      POST /webhook`);
  console.log(`✅ Health check: GET  /health`);
  console.log(`\nEntorno: ${process.env.NODE_ENV || "development"}\n`);
});

export default app;
