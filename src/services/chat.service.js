import pool from '../config/db.js'

export const getMessages = async () => {
  const [rows] = await pool.query(`
    SELECT id, content
    FROM messages
    ORDER BY id ASC
  `)

  return rows.map((row) => {
    try {
      const parsed = JSON.parse(row.content)

      return {
        id: row.id,
        userId: parsed.userId ?? null,
        username: parsed.username ?? 'Usuario',
        text: parsed.text ?? '',
        createdAt: parsed.createdAt ?? null,
        system: !!parsed.system,
      }
    } catch (_) {
      return {
        id: row.id,
        userId: null,
        username: 'Sistema',
        text: row.content,
        createdAt: null,
        system: true,
      }
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
