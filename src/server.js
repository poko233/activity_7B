import './config/env.js'
import http from 'http'


import app from './app.js'
import { initChatSocket } from './websocket/chat.socket.js'

const PORT = process.env.PORT || 3000

const server = http.createServer(app)

initChatSocket(server)

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
