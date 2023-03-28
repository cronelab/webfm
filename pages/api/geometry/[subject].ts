import { readFile, writeFile } from 'fs/promises'
import formidable, { errors as formidableErrors, File } from 'formidable'
import { parse } from 'csv-parse/sync'

export const config = {
  api: {
    bodyParser: false,
  },
}
export default async function handler(req, res) {
  var { subject } = req.query
  const metadata = await readFile(
    `${process.env.DATA_DIR}/${subject}/.metadata`,
    'utf8'
  )

  if (req.method === 'PUT') {
    const form = formidable({
      uploadDir: `${process.env.DATA_DIR}/${subject}`,
      keepExtensions: true,
      filename: (name, ext, part, form) => {
        return part.originalFilename // Will be joined with options.uploadDir.
      },
    })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        // example to check for a very specific error
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' })
        res.end(String(err))
        return
      }
    })
    const newGeometry = {}
    form.on('file', async (formname, file: File) => {
      let sensorGeometry = await readFile(file.filepath, 'utf8')
      const records = parse(sensorGeometry)
      records.forEach(channel => {
        newGeometry[channel[0]] = {
          u: parseFloat(channel[1]),
          v: parseFloat(channel[2]),
        }
      })
      let newMetadata = JSON.parse(metadata)
      newMetadata.sensorGeometry = newGeometry
      await writeFile(
        `${process.env.DATA_DIR}/${subject}/.metadata`,
        JSON.stringify(newMetadata)
      )
      res.status(200).json(newMetadata.sensorGeometry)
    })
  }
  if (req.method === 'GET') {
    let sensorGeometry = JSON.parse(metadata.toString()).sensorGeometry
    res.status(200).send(sensorGeometry)
  }
}
