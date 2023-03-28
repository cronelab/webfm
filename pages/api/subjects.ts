import { readdirSync } from 'fs'
export default function handler(req, res) {
  const subjects = readdirSync(process.env.DATA_DIR).filter(file => file !== '.gitignore').sort();
  res.status(200).json(subjects)
}
