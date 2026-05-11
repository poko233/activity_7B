import { WebSocketServer, WebSocket } from 'ws'

import { handleChatConnection } from '../controllers/chat.controller.js'

export const initChatSocket = (server) => {
  const wss = new WebSocketServer({
    server,
    path: '/ws/chat',
  })

  const clients = new Set()

  const broadcast = (payload) => {
    const message = JSON.stringify(payload)

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    }
  }

  wss.on('connection', (ws, req) => {
    clients.add(ws)

    handleChatConnection({
      ws,
      req,
      broadcast,
      onClose: () => {
        clients.delete(ws)
      },
    }).catch((error) => {
      console.error(error)
      ws.close()
    })
  })
}
