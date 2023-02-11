import fs from 'fs'
export default function handler(req, res) {
  var { subject } = req.query
  const records = fs.readdirSync(`${process.env.DATA_DIR}/${subject}`).filter(file => file !== '.metadata').sort();
  res.status(200).json(records);
}
