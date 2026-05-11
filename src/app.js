import express from 'express'
import cors from 'cors'

import homeRoutes from './routes/home.routes.js'
import authRoutes from './routes/auth.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/home', homeRoutes)
app.use('/api/auth', authRoutes)

export default app