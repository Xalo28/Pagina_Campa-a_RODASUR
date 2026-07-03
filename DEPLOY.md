# 🚀 Cómo desplegar RODASUR en otra máquina

## ⚠️ Importante antes de copiar
NO copies estas carpetas/archivos entre máquinas (se regeneran o son propios de cada equipo):

- `node_modules/` y `client/node_modules/` → se reinstalan con `npm install` (contienen módulos
  nativos como `better-sqlite3` y `sharp` que dependen del sistema operativo).
- `client/dist/` → se regenera con `npm run build`.
- `.env` → créalo en la máquina nueva (contiene tus secretos).

**Sí conserva** (si quieres mantener tus datos):
- `data/rodasur.db` → tu base de datos (productos, cotizaciones, suscriptores, packs).
- `public/uploads/` → las fotos de productos que subiste.

---

## 🅰️ Opción 1 — Correrlo en otra PC (local / red interna)

Requisito: instalar **Node.js 18 o superior** (https://nodejs.org).

```bash
# 1. Copia la carpeta del proyecto (sin node_modules ni dist).
# 2. Dentro de la carpeta, crea el archivo .env (copia de .env.example) y edita tus secretos.
copy .env.example .env        # Windows   (o:  cp .env.example .env  en Mac/Linux)

# 3. Instala todo, compila el frontend y carga datos de ejemplo (solo la 1ª vez):
npm run setup

# 4. Inicia el servidor:
npm start
```

Abre **http://localhost:3000/** (tienda) y **http://localhost:3000/admin** (panel).

> Si copiaste tu propia `data/rodasur.db`, **omite el seed** para no sobrescribir:
> ejecuta `npm install`, `npm run client:install`, `npm run build` y `npm start` (sin `npm run seed`).

> Para que otras PCs de la red entren: usa la IP de la máquina, ej. `http://192.168.1.50:3000`
> (abre el puerto 3000 en el firewall de Windows).

---

## 🅱️ Opción 2 — Servidor real con dominio e internet (producción)

1. **Servidor**: un VPS/servidor con Linux (o Windows) y Node.js 18+.
2. **Sube el proyecto** (por git, `scp` o FTP), sin `node_modules` ni `dist`.
3. **Crea el `.env`** con secretos fuertes y, si usarás correos, los `SMTP_*`.
4. **Instala y compila**:
   ```bash
   npm run setup      # o sin seed si traes tu propia BD
   ```
5. **Mantén el proceso vivo con PM2** (se reinicia solo si se cae o si reinicias el servidor):
   ```bash
   npm install -g pm2
   pm2 start server.js --name rodasur
   pm2 save
   pm2 startup        # sigue la instrucción que imprime, para que arranque al encender
   ```
6. **Pon un nginx delante** como proxy inverso y activa **HTTPS** con Let's Encrypt (Certbot):
   ```nginx
   server {
     server_name rodasur.com www.rodasur.com;
     location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     }
     client_max_body_size 12M;   # para subir fotos
   }
   ```
   ```bash
   sudo certbot --nginx -d rodasur.com -d www.rodasur.com
   ```
7. Como está detrás de un proxy, en `server.js` (antes de las rutas) agrega:
   ```js
   app.set('trust proxy', 1);
   ```
   (así el límite de intentos y la IP registrada funcionan bien).

---

## 🔁 Actualizar a una versión nueva del código

```bash
# trae los cambios (git pull o copia los archivos nuevos), luego:
npm install                 # por si hay dependencias nuevas
npm run build               # recompila el frontend
pm2 restart rodasur         # (en producción)   o   npm start   (local)
```

## 💾 Respaldos
- Se crea un respaldo automático de la BD al arrancar (`data/backups/`).
- Respaldo manual: `npm run backup`.
- Antes de migrar, **copia `data/rodasur.db` y `public/uploads/`**.

## ✅ Checklist de producción
- [ ] `.env` con `JWT_SECRET` largo y aleatorio.
- [ ] Cambiar la contraseña del admin (botón del candado en el panel).
- [ ] HTTPS activo (Certbot).
- [ ] `app.set('trust proxy', 1)` si hay nginx delante.
- [ ] Respaldos programados (Programador de tareas / cron) ejecutando `npm run backup`.
