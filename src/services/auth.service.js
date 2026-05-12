import pool from '../config/db.js'

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  )

  return rows[0]
}

export const findUserById = async (userId) => {
  const [rows] = await pool.query(
    `
      SELECT id, name, username, email
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  )

  return rows[0] ?? null
}

export const createUser = async ({
  googleId,
  email,
  name,
  photo,
  username,
}) => {
  const [result] = await pool.query(
    `
    INSERT INTO users
    (google_id, email, name, username, photo)
    VALUES (?, ?, ?, ?, ?)
  `,
    [googleId, email, name, username, photo]
  )

  return result.insertId
}

export const updateUsernameById = async ({
  userId,
  username,
}) => {
  await pool.query(
    `
      UPDATE users
      SET username = ?
      WHERE id = ?
    `,
    [username, userId]
  )
}
