import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'

import {
  findUserByEmail,
  createUser,
} from '../services/auth.service.js'

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
)

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    const {
      sub,
      email,
      name,
      picture,
    } = payload

    let user = await findUserByEmail(email)

    if (!user) {
      const username =
        'User_' +
        Math.floor(Math.random() * 100000)

      await createUser({
        googleId: sub,
        email,
        name,
        photo: picture,
        username,
      })

      user = await findUserByEmail(email)
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    )

    res.json({
      token,
      user,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: 'Error autenticando con Google',
    })
  }
}