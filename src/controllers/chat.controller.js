import jwt from 'jsonwebtoken'

import {
  getMessages,
  saveMessage,
} from '../services/chat.service.js'
import {
  findUserById,
  updateUsernameById,
} from '../services/auth.service.js'

const createFallbackUsername = () =>
  `Usuario_${Math.floor(1000 + Math.random() * 9000)}`

const normalizeText = (value) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeAlias = (value) => {
  const alias = normalizeText(value)

  if (!alias) {
    return ''
  }

  return alias.slice(0, 30)
}

const resolveVisibleUsernameFromUser = ({
  user,
  userId,
  decoded,
}) => {
  if (user) {
    const username = normalizeText(user.username)
    if (username) {
      return username
    }

    const name = normalizeText(user.name)
    if (name) {
      return name
    }

    const numericUserId = Number(user.id)
    if (Number.isFinite(numericUserId)) {
      return `Usuario_${numericUserId}`
    }
  }

  const numericUserId = Number(userId)
  if (Number.isFinite(numericUserId)) {
    return `Usuario_${numericUserId}`
  }

  const decodedUsername =
    normalizeText(decoded?.username) ||
    normalizeText(decoded?.name)
  if (decodedUsername) {
    return decodedUsername
  }

  const decodedEmail = normalizeText(decoded?.email)
  if (decodedEmail) {
    return decodedEmail
  }

  return createFallbackUsername()
}

const resolveUserFromRequest = async (req) => {
  const requestUrl = new URL(req.url, 'http://localhost')
  const token = requestUrl.searchParams.get('token')

  // El chat permite conexiones sin token para no bloquear sesiones invitadas.
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

    const decodedUserId = Number(decoded?.id)
    const userId = Number.isFinite(decodedUserId)
      ? decodedUserId
      : null
    const user = userId
      ? await findUserById(userId)
      : null
    const username = resolveVisibleUsernameFromUser({
      user,
      userId,
      decoded,
    })

    return {
      userId,
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

      if (data.type === 'message') {
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

        return
      }

      if (data.type === 'alias:update') {
        const username = normalizeAlias(data.username)

        if (!username) {
          return
        }

        chatUser.username = username

        if (chatUser.userId) {
          await updateUsernameById({
            userId: chatUser.userId,
            username,
          })
        }

        // Se propaga para que todos los clientes refresquen alias en historial local.
        broadcast({
          type: 'alias:updated',
          userId: chatUser.userId,
          username,
        })
      }
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
        text: `${chatUser.username} salio del chat`,
        createdAt: new Date().toISOString(),
        system: true,
      },
    })
  })

  ws.on('error', (error) => {
    console.error(error)
  })

  const history = await getMessages()
  // Se envia primero el historial para hidratar el chat antes de eventos en vivo.
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
        text: 'Te uniste al chat',
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
      text: `${chatUser.username} se unio al chat`,
      createdAt: new Date().toISOString(),
      system: true,
    },
  })
}
