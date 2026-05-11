import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import '../config/env.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const caPath = path.join(__dirname, '../../certs/ca.pem')
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,

  ssl: {
    ca: fs.readFileSync(caPath),
  },
})

export default pool