# Chat colaborativo - Backend

## 1. Descripcion
Este repositorio contiene la API interna del sistema de chat colaborativo en tiempo real.

Responsabilidades principales:
- autenticacion de usuarios con Google (validacion de `credential` + emision de JWT)
- conexion a MySQL (Aiven) usando `mysql2/promise`
- exposicion de endpoints HTTP con Express
- gestion del canal WebSocket (`ws`) para chat grupal en tiempo real
- persistencia y recuperacion del historial de mensajes

## 2. Tecnologias utilizadas
- Node.js
- Express
- MySQL
- mysql2
- ws
- JWT (`jsonwebtoken`)
- dotenv
- SSL para Aiven (certificado `certs/ca.pem`)

## 3. Estructura de carpetas
```text
activity_7B/
├─ certs/
│  └─ ca.pem
├─ src/
│  ├─ config/
│  │  ├─ db.js
│  │  └─ env.js
│  ├─ controllers/
│  │  ├─ auth.controller.js
│  │  ├─ chat.controller.js
│  │  └─ home.controller.js
│  ├─ routes/
│  │  ├─ auth.routes.js
│  │  └─ home.routes.js
│  ├─ services/
│  │  ├─ auth.service.js
│  │  ├─ chat.service.js
│  │  └─ home.service.js
│  ├─ websocket/
│  │  └─ chat.socket.js
│  ├─ app.js
│  └─ server.js
├─ .env
├─ .env.example
└─ package.json
```

Descripcion breve por capa:
- `src/controllers`: orquestacion de peticiones HTTP y eventos WS.
- `src/services`: acceso a base de datos y logica de datos.
- `src/websocket`: inicializacion del servidor WS y broadcast.
- `src/server.js`: arranque del servidor HTTP y WebSocket.
- `certs`: certificado CA requerido por Aiven para SSL.

## 4. Variables de entorno
Archivo recomendado: `.env`

Ejemplo (sin credenciales reales):
```env
PORT=3000
DB_HOST=tu-host-aiven
DB_PORT=tu-puerto
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=defaultdb
GOOGLE_CLIENT_ID=tu_google_client_id
JWT_SECRET=tu_jwt_secret
```

## 5. Instalacion y ejecucion local
Requisitos:
- Node.js 18+ (recomendado)
- acceso de red al host MySQL en Aiven

Pasos:
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear `.env` a partir de `.env.example` y completar credenciales.
3. Verificar que `certs/ca.pem` exista.
4. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

Servidor por defecto:
- HTTP: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/ws/chat`

## 6. Flujo de ejecucion
1. `src/server.js` carga variables de entorno y crea el servidor HTTP con `app`.
2. `initChatSocket(server)` monta el servidor WS sobre la misma instancia HTTP.
3. `src/app.js` registra middlewares (`cors`, `express.json`) y rutas REST.
4. Al abrir un socket, `handleChatConnection`:
   - resuelve usuario por JWT opcional (`?token=...`)
   - envia historial (`type: history`)
   - notifica evento de sistema de ingreso
   - escucha mensajes y actualizaciones de alias
5. Los mensajes se guardan en `messages.content` como JSON string.

## 7. API HTTP disponible
### `POST /api/auth/google`
Autentica con credencial de Google.

Body:
```json
{
  "credential": "google-id-token"
}
```

Respuesta esperada:
```json
{
  "token": "jwt",
  "user": {
    "id": 1,
    "google_id": "...",
    "email": "usuario@correo.com",
    "name": "Nombre",
    "username": "User_12345",
    "photo": "https://...",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

### `GET /api/home`
Endpoint simple de prueba que devuelve un registro de `messages`.

## 8. Protocolo WebSocket del chat
Endpoint:
- `ws://localhost:3000/ws/chat`

Autenticacion:
- token JWT opcional por query param: `?token=<jwt>`

Mensajes que envia cliente:
```json
{ "type": "message", "text": "Hola equipo" }
```
```json
{ "type": "alias:update", "username": "NuevoAlias" }
```

Mensajes que envia servidor:
```json
{ "type": "history", "messages": [] }
```
```json
{ "type": "message", "message": { "id": 1, "userId": 2, "username": "Ana", "text": "Hola", "createdAt": "...", "system": false } }
```
```json
{ "type": "alias:updated", "userId": 2, "username": "AnaDev" }
```
```json
{ "type": "system", "message": { "userId": null, "username": "Sistema", "text": "Ana se unio al chat", "createdAt": "...", "system": true } }
```

## 9. Modelo de datos
### Tabla `users`
- `id`
- `google_id`
- `email`
- `name`
- `username`
- `photo`
- `created_at`

### Tabla `messages`
- `id`
- `content` (JSON string)

Ejemplo de `messages.content`:
```json
{
  "userId": 2,
  "username": "Ana",
  "text": "Hola equipo",
  "createdAt": "2026-05-12T03:10:00.000Z"
}
```

## 10. Decisiones tecnicas clave
- historial con `ORDER BY id ASC` para mantener orden cronologico consistente.
- el username visible en historial se resuelve contra `users.username`; por eso mensajes antiguos reflejan alias actualizado.
- cuando no hay JWT valido, el chat permite ingreso como usuario anonimo con alias de respaldo.
- eventos `system` modelan entradas/salidas para retroalimentacion en tiempo real.

## 11. Troubleshooting rapido
- Error de conexion MySQL SSL:
  - validar `DB_HOST`, `DB_PORT`, credenciales y presencia de `certs/ca.pem`.
- Login Google falla:
  - verificar `GOOGLE_CLIENT_ID` en backend y frontend (deben coincidir).
- WS no conecta:
  - comprobar que backend este levantado en puerto correcto y que el path sea `/ws/chat`.

## 12. Scripts
- `npm run dev`: inicia servidor con `nodemon` sobre `src/server.js`.
