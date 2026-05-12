import pool from '../config/db.js'

const normalizeText = (value) =>
  typeof value === 'string' ? value.trim() : ''

const resolveVisibleUsername = ({
  user,
  userId,
  storedUsername,
  fallback = 'Usuario',
  allowEmailFallback = false,
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

    if (allowEmailFallback) {
      const email = normalizeText(user.email)
      if (email) {
        return email
      }
    }
  }

  const numericUserId = Number(userId)
  if (Number.isFinite(numericUserId)) {
    return `Usuario_${numericUserId}`
  }

  const normalizedStoredUsername =
    normalizeText(storedUsername)
  if (normalizedStoredUsername) {
    return normalizedStoredUsername
  }

  return fallback
}

export const getMessages = async () => {
  const [rows] = await pool.query(`
    SELECT id, content
    FROM messages
    ORDER BY id ASC
  `)

  const parsedRows = rows.map((row) => {
    try {
      const parsed = JSON.parse(row.content)
      const userId =
        parsed.userId === undefined ||
        parsed.userId === null
          ? null
          : Number(parsed.userId)

      return {
        id: row.id,
        userId: Number.isFinite(userId)
          ? userId
          : null,
        storedUsername:
          parsed.username ?? null,
        text: parsed.text ?? '',
        createdAt: parsed.createdAt ?? null,
        system: !!parsed.system,
        isPlainText: false,
      }
    } catch (_) {
      return {
        id: row.id,
        userId: null,
        storedUsername: 'Sistema',
        text: row.content,
        createdAt: null,
        system: true,
        isPlainText: true,
      }
    }
  })

  const uniqueUserIds = [
    ...new Set(
      parsedRows
        .map((row) => row.userId)
        .filter((id) =>
          Number.isFinite(id)
        )
    ),
  ]

  const usersById = new Map()

  if (uniqueUserIds.length > 0) {
    const placeholders = uniqueUserIds
      .map(() => '?')
      .join(', ')

    const [users] = await pool.query(
      `
        SELECT id, name, username, email
        FROM users
        WHERE id IN (${placeholders})
      `,
      uniqueUserIds
    )

    users.forEach((user) => {
      usersById.set(Number(user.id), user)
    })
  }

  return parsedRows.map((row) => {
    const user = Number.isFinite(row.userId)
      ? usersById.get(row.userId)
      : null

    const username = row.isPlainText
      ? row.storedUsername || 'Sistema'
      : resolveVisibleUsername({
          user,
          userId: row.userId,
          storedUsername: row.storedUsername,
          fallback: 'Usuario',
        })

    return {
      id: row.id,
      userId: row.userId,
      username,
      text: row.text,
      createdAt: row.createdAt,
      system: row.system,
    }
  })
}

export const saveMessage = async ({ userId, username, text }) => {
  const message = {
    userId: userId ?? null,
    username,
    text,
    createdAt: new Date().toISOString(),
  }

  const [result] = await pool.query(
    `
      INSERT INTO messages (content)
      VALUES (?)
    `,
    [JSON.stringify(message)]
  )

  return {
    id: result.insertId,
    ...message,
    system: false,
  }
}
