import pool from '../config/db.js'

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  )

  return rows[0]
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