import pool from '../config/db.js'

export const getMessageService = async () => {
  const [rows] = await pool.query(`
    SELECT * FROM messages
    LIMIT 1
  `)

  return rows[0]
}