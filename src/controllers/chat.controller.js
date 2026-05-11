import jwt from 'jsonwebtoken'

import {
  getMessages,
  saveMessage,
} from '../services/chat.service.js'

const createFallbackUsername = () =>
  `Usuario_${Math.floor(1000 + Math.random() * 9000)}`

const resolveUserFromRequest = async (req) => {
  const requestUrl = new URL(req.url, 'http://localhost')
  const token = requestUrl.searchParams.get('token')

  if (!token) {
    return {
      userId: null,
      username: createFallbackUsername(),
    }
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    const username =
      decoded?.username ||
      decoded?.name ||
      decoded?.email ||
      createFallbackUsername()

    return {
      userId: decoded?.id ?? null,
      username,
    }
  } catch (_) {
    return {
      userId: null,
      username: createFallbackUsername(),
    }
  }
}

export const handleChatConnection = async ({
  ws,
  req,
  broadcast,
  onClose,
}) => {
  const chatUser = await resolveUserFromRequest(req)

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw.toString())

      if (data.type !== 'message') {
        return
      }

      const text = data.text?.trim()

      if (!text) {
        return
      }

      const savedMessage = await saveMessage({
        userId: chatUser.userId,
        username: chatUser.username,
        text,
      })

      broadcast({
        type: 'message',
        message: savedMessage,
      })
    } catch (error) {
      console.error(error)
    }
  })

  ws.on('close', () => {
    onClose()

    broadcast({
      type: 'system',
      message: {
        userId: null,
        username: 'Sistema',
        text: `${chatUser.username} salió del chat`,
        createdAt: new Date().toISOString(),
        system: true,
      },
    })
  })

  ws.on('error', (error) => {
    console.error(error)
  })

  const history = await getMessages()
  ws.send(
    JSON.stringify({
      type: 'history',
      messages: history,
    })
  )

  ws.send(
  JSON.stringify({
    type: 'system',
    message: {
      userId: null,
      username: 'Sistema',
      text: `Te uniste al chat`,
      createdAt: new Date().toISOString(),
      system: true,
    },
  })
)

broadcast({
  type: 'system',
  message: {
    userId: null,
    username: 'Sistema',
    text: `${chatUser.username} se unió al chat`,
    createdAt: new Date().toISOString(),
    system: true,
  },
  })
}
