# 🏋️ Bot de WhatsApp – Gimnasio MEGA VITAL

Bot de atención al cliente por WhatsApp impulsado por IA (Claude de Anthropic) para el **Gimnasio MEGA VITAL** ubicado en Zarzal, Valle del Cauca, Colombia.

## ✨ Características

- 🤖 Respuestas inteligentes usando **Claude Opus 4.7** (Anthropic)
- 💬 Integración con **WhatsApp Business API** directa vía Meta Cloud API
- 🧠 **Memoria de conversación** por número (historial de 24 horas, máximo 20 mensajes)
- 🕐 **Conciencia horaria en tiempo real** (zona horaria Colombia / America/Bogota)
- 📋 Información completa de horarios, clases y planes de precios
- 🔔 **Escalación automática a humano** cuando el cliente lo requiere
- 🗄️ Persistencia con **Supabase** (modo degradado si la BD no está disponible)
- 🐳 **Dockerizado** para despliegue sencillo en Railway, Render u otros

---

## 🚀 Instalación y configuración

### Prerrequisitos

- Node.js ≥ 18.0.0
- Cuenta en [Anthropic](https://console.anthropic.com) (API Key)
- Cuenta en [Supabase](https://supabase.com) (URL + Service Key)
- Cuenta en [Meta for Developers](https://developers.facebook.com) con app de tipo Business y WhatsApp habilitado

### 1. Clonar el repositorio

```bash
git clone https://github.com/vallejoj203k/megavital_bot.git
cd megavital_bot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales reales:

```env
PORT=3000
NODE_ENV=production

# Anthropic / Claude API
ANTHROPIC_API_KEY=sk-ant-...

# WhatsApp Business (Meta Cloud API)
WHATSAPP_TOKEN=EAAxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxx
WEBHOOK_VERIFY_TOKEN=tu_token_secreto_para_verificacion

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...

# Config del bot
MAX_HISTORIAL_MENSAJES=20
TIMEOUT_CONVERSACION_HORAS=24
TELEFONO_HUMANO=+573225237665
```

### 4. Configurar la base de datos en Supabase

1. Ve a tu proyecto en [app.supabase.com](https://app.supabase.com)
2. Abre **SQL Editor**
3. Ejecuta el contenido de `supabase/schema.sql`

Esto creará las tablas `clientes`, `conversaciones` e `interacciones`, junto con sus índices.

### 5. Iniciar el servidor

```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`.

---

## 📡 Configuración de WhatsApp con Meta Cloud API

### Paso 1 — Crear la app en Meta for Developers

1. Ve a [developers.facebook.com](https://developers.facebook.com) e inicia sesión.
2. Clic en **"Mis apps" → "Crear app"**.
3. Selecciona tipo **"Business"** y completa el nombre (ej: `megavital-bot`).
4. En el panel de la app, busca el producto **"WhatsApp"** y clic en **"Configurar"**.

### Paso 2 — Obtener Phone Number ID y Business Account ID

1. En el menú izquierdo → **WhatsApp → Configuración de la API**.
2. En la sección **"Enviar y recibir mensajes"** encontrarás:
   - **ID de número de teléfono** → `WHATSAPP_PHONE_NUMBER_ID`
   - **ID de cuenta de WhatsApp Business** → `WHATSAPP_BUSINESS_ACCOUNT_ID`

### Paso 3 — Generar token de acceso permanente (System User)

> El token temporal de prueba expira en 24 horas. Para producción usa un System User:

1. Ve a [business.facebook.com](https://business.facebook.com) → **Configuración del negocio**.
2. En **"Usuarios" → "Usuarios del sistema"** → **"Agregar"**.
3. Crea un usuario con rol **Administrador**.
4. Clic en **"Generar nuevo token"** → selecciona tu app → activa el permiso **`whatsapp_business_messaging`**.
5. Copia el token → `WHATSAPP_TOKEN=EAAxxxxxxx`

### Paso 4 — Configurar el webhook

1. En tu app → **WhatsApp → Configuración → Webhooks**.
2. Clic en **"Editar"** e ingresa:
   - **URL de devolución de llamada:**
     ```
     https://tu-app.up.railway.app/webhook
     ```
   - **Token de verificación:** el valor de `WEBHOOK_VERIFY_TOKEN` en tu `.env`
3. Clic en **"Verificar y guardar"** → Meta hará un GET automático y el bot responderá con el challenge ✅.
4. En la sección **"Campos de webhook"** → activa el campo **`messages`** → clic en **"Suscribirse"**.

---

## 🐳 Despliegue con Docker

```bash
# Construir la imagen
docker build -t megavital-bot .

# Ejecutar con variables de entorno
docker run -d \
  --name megavital-bot \
  -p 3000:3000 \
  --env-file .env \
  megavital-bot
```

---

## 🚂 Despliegue en Railway

1. Conecta tu repositorio de GitHub a Railway.
2. Railway detectará el `Dockerfile` automáticamente.
3. Agrega todas las variables de entorno en el panel de Railway.
4. El despliegue se realizará automáticamente en cada push a `main`.

**Variables de entorno requeridas en Railway:**
- `ANTHROPIC_API_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WEBHOOK_VERIFY_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `TELEFONO_HUMANO`

---

## 🌐 Despliegue en Render

1. Crea un nuevo **Web Service** en [render.com](https://render.com).
2. Conecta el repositorio de GitHub.
3. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Agrega las variables de entorno en el panel de Render.

---

## 📁 Estructura del proyecto

```
megavital_bot/
├── src/
│   ├── index.js       # Servidor Express (punto de entrada)
│   ├── webhook.js     # Controlador del webhook (GET verificación + POST mensajes)
│   ├── claude.js      # Servicio de IA (Anthropic SDK)
│   ├── memoria.js     # Gestión del historial en Supabase
│   ├── whatsapp.js    # Envío de mensajes via Meta Cloud API
│   └── gimnasio.js    # Datos del gimnasio y system prompt dinámico
├── supabase/
│   └── schema.sql     # Esquema de base de datos
├── .env.example       # Plantilla de variables de entorno
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

---

## 🔄 Flujo de una conversación

```
Cliente WhatsApp
      │
      ▼ POST /webhook
Express (index.js)
      │
      ├─► HTTP 200 OK (inmediato, evita reintentos de Meta)
      │
      └─► [Background] webhook.js
               │
               ├── Extrae teléfono + mensaje (whatsapp.js)
               ├── Upsert cliente (memoria.js → Supabase)
               ├── Obtiene historial (memoria.js → Supabase)
               ├── Genera respuesta (claude.js → Anthropic API)
               ├── Guarda mensajes (memoria.js → Supabase)
               └── Envía respuesta (whatsapp.js → Meta Cloud API)
                        │
                        ├── Si [ESCALAR_HUMANO]: mensaje al cliente + notificación al asesor
                        └── Respuesta llega al cliente WhatsApp
```

---

## 🧪 Verificar que el servidor funciona

```bash
# Health check
curl http://localhost:3000/health

# Respuesta esperada:
# {"status":"ok","service":"megavital-bot","timestamp":"...","uptime":42}
```

---

## 📋 Tablas de Supabase

| Tabla | Descripción |
|-------|-------------|
| `clientes` | Registro de clientes únicos por número de WhatsApp |
| `conversaciones` | Historial de mensajes (ventana de 24h, máx 20 mensajes) |
| `interacciones` | Log completo de interacciones para análisis y auditoría |

---

## ⚙️ Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor (default: 3000) | No |
| `NODE_ENV` | Entorno (`development`/`production`) | No |
| `ANTHROPIC_API_KEY` | API Key de Anthropic | **Sí** |
| `WHATSAPP_TOKEN` | Token permanente de Meta for Developers (System User) | **Sí** |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de teléfono en Meta | **Sí** |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ID de la cuenta WhatsApp Business en Meta | **Sí** |
| `WEBHOOK_VERIFY_TOKEN` | Token secreto para verificación del webhook | **Sí** |
| `SUPABASE_URL` | URL del proyecto Supabase | **Sí** |
| `SUPABASE_SERVICE_KEY` | Service Key de Supabase | **Sí** |
| `MAX_HISTORIAL_MENSAJES` | Máximo de mensajes en historial (default: 20) | No |
| `TIMEOUT_CONVERSACION_HORAS` | Horas de timeout de conversación (default: 24) | No |
| `TELEFONO_HUMANO` | Número de WhatsApp del asesor humano | **Sí** |

---

## 📄 Licencia

Proyecto privado – Gimnasio MEGA VITAL, Zarzal, Valle del Cauca, Colombia.
