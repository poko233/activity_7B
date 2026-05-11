import { getMessageService } from '../services/home.service.js'

export const getHome = async (req, res) => {
  try {
    const message = await getMessageService()

    res.json(message)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      error: 'Error del servidor',
    })
  }
}