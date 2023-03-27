import { readFile } from 'fs/promises'
export default async function handler(req, res) {
  var { subject, record } = req.query
  try {
    const file = await readFile(
      `${process.env.DATA_DIR}/${subject}/${record}.fm`,
      'utf8'
    )
    res.send(file)
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        const file = await readFile(
          `${process.env.DATA_DIR}/${subject}/${record}.json`,
          'utf8'
        )
        res.send(file)
      } catch (error) {
        console.error(error)
      }
      res.status(404).send('Not Found')
    }
  }
}
