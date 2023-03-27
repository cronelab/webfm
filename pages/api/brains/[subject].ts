import { readFile, rename } from 'fs/promises'
import formidable, { errors as formidableErrors } from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}
export default async function handler(req, res) {
  var { subject } = req.query
  if (req.method === 'GET') {
    // if metadata contains brainImage, return it
    try {
      const metadata = await readFile(
        `${process.env.DATA_DIR}/${subject}/.metadata`,
        'utf8'
      )
      let brainImage = JSON.parse(metadata.toString()).brainImage
      if (brainImage === undefined) {
        // if no metadata entry, serve the png
        try {
          const brain = await readFile(
            `${process.env.DATA_DIR}/${subject}/${subject}.png`
          )
          brainImage = `data:img/png;base64,${Buffer.from(brain).toString('base64')}`
          res.status(200).json(brainImage)
        } catch (e) {
          console.log(e)
          res.status(418).json({ error: 'No brain image found' })
        }
      }
      else {
        res.status(200).json(brainImage)
      }
    } catch (e) {
      res.status(500).json({ error: e })
    }
  }
  if (req.method === 'PUT') {
    const form = formidable({
      uploadDir: `${process.env.DATA_DIR}/${subject}`,
      keepExtensions: true,
      filename: (name, ext, part, form) => {
        return part.originalFilename // Will be joined with options.uploadDir.
      },
    })

    // form.on('fileBegin', (name, file) => {
    //   //rename the incoming file to the file's name
    //   file.path = form.uploadDir + '/' + file.name
    // })

    form.parse(req, (err, fields, files) => {
      if (err) {
        // example to check for a very specific error
        if (err.code === formidableErrors.maxFieldsExceeded) {
        }
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' })
        res.end(String(err))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ fields, files }, null, 2))
    })

    return
  }
}
