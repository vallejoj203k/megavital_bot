# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile – Bot de WhatsApp Gimnasio MEGA VITAL
# ─────────────────────────────────────────────────────────────────────────────

# Imagen base: Node.js LTS sobre Alpine (imagen ligera)
FROM node:20-alpine

# Metadatos
LABEL maintainer="Gimnasio MEGA VITAL" \
      description="Bot de WhatsApp IA para Gimnasio MEGA VITAL – Zarzal, Valle del Cauca"

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (aprovecha caché de capas Docker)
COPY package*.json ./

# Instalar dependencias de producción únicamente
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el resto del código fuente
COPY . .

# Puerto expuesto (debe coincidir con la variable PORT)
EXPOSE 3000

# Usuario no root para mayor seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Healthcheck para orquestadores (Railway, Render, Docker Compose)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["node", "src/index.js"]
