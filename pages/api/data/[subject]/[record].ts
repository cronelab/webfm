import fs from 'fs'
export default function handler(req, res) {
  var { subject, record } = req.query
  const file = fs.readFileSync(`${process.env.DATA_DIR}/${subject}/${record}.fm`).toString()
  res.send(file);
}
