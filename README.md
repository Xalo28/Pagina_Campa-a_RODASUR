# RODASUR · Portal de Productos en Descuento

Aplicación web completa (base de datos + backend + frontend) para que **RODASUR – Su Aliado Industrial**
publique productos en oferta desde un panel de administrador y sus clientes los vean en un catálogo público.

## 🧱 Tecnología

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Base de datos | SQLite (archivo único, sin instalar nada) vía `better-sqlite3` |
| Backend    | Node.js + Express (API REST)        |
| Auth admin | JWT + contraseñas cifradas (bcrypt) |
| Imágenes   | Subida con Multer + **optimización con `sharp`** (redimensiona y comprime) |
| Seguridad  | `helmet` (headers), `express-rate-limit` (anti fuerza bruta/spam), honeypot |
| Correos    | `nodemailer` (opcional, para campañas a suscriptores) |
| Frontend   | **React (Vite)** + **Tailwind CSS** + React Router |

> El frontend React vive en la carpeta `client/`. Tailwind se **compila** en el build (ya no usa CDN).
> Los colores de marca están en `client/tailwind.config.js`.

## 🚀 Cómo ejecutar

Requisitos: **Node.js 18+** (probado en Node 22).

### Opción A — Producción / uso normal (un solo servidor)

```bash
# 1. Instalar dependencias del backend y del frontend (solo la primera vez)
npm install
npm run client:install

# 2. Compilar el frontend React (genera client/dist)
npm run build

# 3. Cargar el catálogo de ejemplo (16 productos) — solo la primera vez
npm run seed

# 4. Iniciar el servidor (sirve el API + la app React)
npm start
```

> Atajo: `npm run setup` hace los pasos 1–3 de una sola vez.

Luego abre en tu navegador:

- 🛒 **Tienda (clientes):** http://localhost:3000/
- 🔐 **Panel de administrador:** http://localhost:3000/admin

### Opción B — Desarrollo (recarga en caliente)

En **dos terminales**:

```bash
# Terminal 1 — backend/API en :3000
npm start

# Terminal 2 — Vite dev server en :5173 (hace proxy del API a :3000)
npm run client
```

Abre **http://localhost:5173/**. Cada cambio en `client/src` se refleja al instante.

### Credenciales del administrador (por defecto)

```
Usuario:     admin
Contraseña:  rodasur2026
```

> Para cambiarlas, edita `config.js` o define las variables de entorno
> `ADMIN_USER` / `ADMIN_PASSWORD` **antes** de crear la base de datos.
> (Si ya existe la BD, borra `data/rodasur.db` y vuelve a ejecutar `npm run seed`).

## 🗂️ Estructura del proyecto

```
Pagina Descuentos/
├── server.js              # Servidor Express (API + sirve client/dist)
├── config.js              # Puerto, secretos, credenciales
├── package.json
├── db/
│   ├── database.js        # Conexión SQLite + esquema + admin por defecto
│   └── seed.js            # Carga los 16 productos de ejemplo
├── routes/
│   ├── auth.js            # POST /api/auth/login
│   └── products.js        # CRUD de productos (público + protegido)
├── middleware/
│   └── auth.js            # Verificación de token JWT
├── data/
│   └── rodasur.db         # Base de datos (se genera sola)
├── public/
│   └── uploads/           # Imágenes de productos subidas (flyers precargados)
└── client/                # Frontend React (Vite + Tailwind)
    ├── index.html
    ├── vite.config.js     # Proxy /api y /uploads al backend en desarrollo
    ├── tailwind.config.js # Colores de marca
    ├── public/logo.png    # Logo de RODASUR
    ├── dist/              # Build de producción (se genera con npm run build)
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── lib/api.js            # fetch al API + sesión + formato
        ├── components/           # Header, Footer
        └── pages/                # Catalog, ProductDetail, Admin
```

## 🔌 API REST

| Método | Ruta                     | Acceso   | Descripción                          |
|--------|--------------------------|----------|--------------------------------------|
| POST   | `/api/auth/login`        | Público  | Inicia sesión, devuelve un token JWT |
| GET    | `/api/products`          | Público  | Lista productos (`?search=` `?brand=` `?category=` `?discount=1` `?all=1`) |
| GET    | `/api/products/meta`     | Público  | Marcas, categorías y totales         |
| GET    | `/api/products/:id`      | Público  | Detalle de un producto               |
| POST   | `/api/products`          | 🔒 Admin | Crea un producto (multipart; galería en `newImages` + orden en `gallery`) |
| PUT    | `/api/products/:id`      | 🔒 Admin | Actualiza un producto                |
| DELETE | `/api/products/:id`      | 🔒 Admin | Elimina un producto                  |
| POST   | `/api/analytics/track`   | Público  | Registra una visita (lo llama el frontend) |
| GET    | `/api/analytics/stats`   | 🔒 Admin | Estadísticas agregadas para el dashboard |
| POST   | `/api/quotes`            | Público  | El cliente envía una solicitud de cotización |
| GET    | `/api/quotes`            | 🔒 Admin | Lista de leads/cotizaciones          |
| PATCH  | `/api/quotes/:id`        | 🔒 Admin | Cambia el estado (nuevo/contactado/cerrado) |
| DELETE | `/api/quotes/:id`        | 🔒 Admin | Elimina una cotización               |

Las rutas 🔒 requieren la cabecera `Authorization: Bearer <token>`.

## 📊 Estadísticas y captura de leads

**Analítica propia** (sin terceros, todo en tu SQLite): el frontend registra cada visita
(página/producto) y el panel admin muestra un dashboard en la pestaña **Estadísticas** con un
**filtro por periodo (Hoy / 7 días / 30 días)**. Métricas: visitas (por hora si es "hoy", por día
si no), visitantes únicos, cotizaciones, solicitudes de asesor, productos más vistos y asesores
más solicitados — todo dentro del periodo elegido (`GET /api/analytics/stats?range=today|7d|30d`).

> Nota de privacidad: se registra un id **anónimo** por navegador, no la identidad de la persona.
> En `localhost` la ubicación sale como "Local/Desconocido" (no hay IP pública que geolocalizar).

**Captura de leads**: la ficha de producto tiene un botón **"Cotizar ahora"** que abre un
formulario (nombre, empresa, teléfono, correo, mensaje) y un botón **"WhatsApp"** que abre un
chat con un mensaje pre-armado del producto. Las solicitudes del formulario se guardan en la BD y
aparecen en la pestaña **Cotizaciones** del panel admin, donde puedes marcarlas como
contactado/cerrado y **exportarlas a Excel (CSV)**.

> 📱 **Configura tu número de WhatsApp** en `client/src/lib/config.js` (constante `WHATSAPP_NUMBER`,
> formato internacional sin `+`, ej. `51987654321`) y vuelve a compilar con `npm run build`.

## 💬 Chatbot de atención

Un asistente virtual (burbuja flotante abajo a la derecha, y se abre también con los botones
**"Contactar ventas"** / **"Contáctanos"**) que:

- Saluda al visitante y muestra un menú.
- **Deriva a un asesor**: lista los 11 ejecutivos de ventas y abre WhatsApp/correo con cada uno.
- Responde **preguntas frecuentes** (envíos, garantía, originalidad, pagos, etc.).
- Muestra **ubicación y horario**.

Los datos de asesores, FAQs y la dirección/horario están en `client/src/lib/asesores.js`
(edítalos ahí y vuelve a compilar). No usa IA ni servicios externos: es un bot guiado por menús,
100% dentro de tu app.

Cada vez que un visitante pide hablar con un asesor, se **registra en la base de datos**
(tabla `advisor_requests`, endpoint `POST /api/analytics/advisor`) y se mide en el dashboard de
**Estadísticas**: tarjeta "Solicitudes de asesor" + ranking "Asesores más solicitados".

**Suscripciones**: los clientes pueden dejar sus datos (nombre, correo, teléfono) en la sección
"Recibe nuestras ofertas antes que nadie" para recibir novedades y campañas. Se guardan en la tabla
`subscribers` (`POST /api/subscribers`) y se gestionan/exportan en la pestaña **Suscriptores** del admin.

**Notificaciones del admin**: una campanita en el panel muestra un contador de novedades y un feed con
las **cotizaciones**, **solicitudes de asesor** y **nuevos suscriptores** más recientes
(`GET /api/analytics/notifications`, se actualiza cada 30 s).

## ✍️ Gestión de productos (admin)

En el panel puedes registrar, por cada producto:

- Código, nombre, **marca** y **categoría**
- Descripción
- **Características** (lista, tantas como quieras)
- **Especificaciones técnicas** (parámetro · valor · descripción)
- **Precio regular** y **precio con descuento** (el % se calcula solo)
- Stock y fecha de "válido hasta"
- **Varias imágenes** (galería): sube múltiples fotos, elige la portada y reordénalas
- Si se muestra en el catálogo de ofertas y si está activo/visible

La ficha del producto muestra una **galería** con miniaturas, flechas, **zoom al pasar el cursor**
y un **visor a pantalla completa** (clic para acercar/alejar, ← → para navegar, Esc para cerrar).

## 🔐 Seguridad

- **Secretos por variables de entorno**: copia `.env.example` a `.env` y cambia `JWT_SECRET`,
  `ADMIN_USER` y `ADMIN_PASSWORD`. El servidor **avisa al arrancar** si sigues con los valores por defecto.
- **Contraseña del admin**: se puede cambiar desde el panel (botón del candado en la cabecera).
- **Anti fuerza bruta**: el login está limitado a pocos intentos por minuto (`express-rate-limit`).
- **Anti spam**: los formularios públicos (cotización, suscripción) tienen límite de tasa y un
  campo *honeypot* oculto que descarta bots.
- **Headers de seguridad** con `helmet`.

## ⚙️ Otras características

- **Optimización de imágenes**: al subir una foto se redimensiona (máx. 1400 px) y comprime con `sharp`
  (un flyer de ~2 MB baja a ~0,5 MB), acelerando el catálogo.
- **Compartir en redes**: al compartir el enlace de un producto por WhatsApp/Facebook se muestra su
  **imagen, nombre y precio** (meta-tags Open Graph inyectados por el servidor).
- **Catálogo**: buscador, filtros, **ordenar** (precio, descuento, nombre), **paginación** ("Ver más")
  y estado **Disponible/Agotado** según el stock.
- **Campañas por correo**: escribe y envía un correo a todos los suscriptores desde la pestaña
  *Suscriptores* (requiere configurar `SMTP_*` en `.env`).

## 💾 Respaldos

- Se crea un **respaldo automático de la BD** al arrancar el servidor (1 vez al día) en `data/backups/`
  (conserva los últimos 14).
- Respaldo manual en cualquier momento: `npm run backup`.

## 🚀 Despliegue a un servidor (resumen)

1. Instala Node 18+ en el servidor y sube el proyecto.
2. Crea el archivo `.env` con tus secretos (y `SMTP_*` si usarás correos).
3. `npm run setup` (instala todo, compila el frontend y carga datos la primera vez).
4. Ejecútalo con un gestor de procesos, p. ej. **PM2**: `pm2 start server.js --name rodasur`.
5. Pon un **nginx** por delante como *reverse proxy* al puerto 3000 y activa **HTTPS**
   (Let's Encrypt / Certbot). Si usas proxy, añade `app.set('trust proxy', 1)` en `server.js`.

- La base de datos SQLite vive en `data/rodasur.db`; las imágenes subidas en `public/uploads/`.
