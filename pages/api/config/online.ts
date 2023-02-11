import fs from 'fs'
export default function handler(req, res) {
  const config = fs.readFileSync(`${process.env.CONFIG_DIR}/fmonline.json`, 'utf8');
  res.send(config);
}
