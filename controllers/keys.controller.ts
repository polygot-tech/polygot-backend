import type { Request, Response } from "express"
import { generateApiKey } from "../utils/generators"
import { pool } from "../config/pool.config"

export const checkApiKeyExists = async (req:Request, res:Response) => {
  try {

    const {email} = req.body

    console.log(req.headers)
    if (!email) {res.status(401).json({ message: 'Unauthorized' })
        return
    }

    const result = await pool.query(
      'SELECT api_key FROM api_keys WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
        res.status(404).json({ message: 'API key not found' })
      return 
    }

    res.json({ api_key: result.rows[0].api_key })
    return 
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}


export const createApiKey = async (req:Request, res:Response) => {
  try {
    const { email, password } = req.body
    const api_key = generateApiKey()

    if (!email || !password || !api_key) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const check = await pool.query(
      'SELECT * FROM api_keys WHERE email = $1',
      [email]
    )

    if (check.rows.length > 0) {
      return res.status(409).json({ message: 'API key already exists for this user' })
    }

    await pool.query(
      'INSERT INTO api_keys (email, password, api_key) VALUES ($1, $2, $3)',
      [email, password, api_key]
    )

    res.status(201).json({ message: 'API key created successfully', api_key })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}


export const getApiKeyByCredentials = async (req:Request, res:Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const result = await pool.query(
      'SELECT api_key FROM api_keys WHERE email = $1 AND password = $2',
      [email, password]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    return res.json({ api_key: result.rows[0].api_key });
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}
