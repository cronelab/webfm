import { readdirSync } from 'fs'
export default function handler(req, res) {
  const { subject } = req.query
  const records = readdirSync(`${process.env.DATA_DIR}/${subject}`).filter(
    file => {
      const ext = file.split('.').pop()
      return ext === 'fm' || ext === 'json'
    }
  )
  res.status(200).json(records)
}
