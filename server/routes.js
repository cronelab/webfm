import path from 'path'
import fs from 'fs';
import {
    promises as fsp
} from 'fs';
import formidable from 'formidable';
let __dirname = path.resolve(path.dirname(''));


const routes = (express) => {
    const router = express.Router();

    router.get('/config', (req, res) => res.sendFile(`${__dirname}/server/config.json`));

    router.get('/live', (req, res) => res.sendFile(`${__dirname}/dist/live.html`));
    router.get('/map', (req, res) => res.sendFile(`${__dirname}/dist/map.html`));
    router.get('/record', (req, res) => res.sendFile(`${__dirname}/dist/record.html`));

    router.get("/api/list", (req, res) => {
        fs.readdir('./data', (err, subjects) => {
            let _subjects = subjects.filter(f => f != '.gitignore')
            res.status(200).json(_subjects);
        });
    });

    router.get('/api/list/:subject', (req, res) => {
        let subject = req.params.subject;
        fs.readdir(`./data/${subject}`, (err, records) => {
            //Need something here if name isn't in the records
            if (err) throw Error;
            let _records = records.filter(f => path.extname(f) == '.fm').map(z => z.split('.')[0]);
            res.status(200).json(_records)
        })
    })
    router.get('/api/info/:subject/:record', (req, res) => {
        let subject = req.params.subject;
        let record = req.params.record;
        res.json({
            'subject': subject,
            'record': record,
            'uri': path.join('/', 'api', 'data', subject, record)
        });
    })

    router.get('/api/brain/:subject', (req, res) => {
        let subject = req.params.subject;
        fs.readdir('./data', (err, subjects) => {
            if (subjects.indexOf(subject) > -1) {
                if (fs.existsSync(`./data/${subject}/.metadata`)) {
                    let metadata = JSON.parse(fs.readFileSync(`./data/${subject}/.metadata`))
                    res.status(200).send(metadata.brainImage);
                }
            }
        });
    });

    router.get('/api/geometry/:subject', (req, res) => {
        let subject = req.params.subject;
        fs.readdir('./data', (err, subjects) => {
            if (subjects.indexOf(subject) > -1) {
                if (fs.existsSync(`./data/${subject}/.metadata`)) {
                    let metadata = JSON.parse(fs.readFileSync(`./data/${subject}/.metadata`))
                    res.status(200).send(metadata.sensorGeometry);
                }
            }
        });
    });

    router.get('/api/data/:subject/:record', (req, res) => {
        var subject = req.params.subject;
        var record = req.params.record;
        let recordData = JSON.parse(fs.readFileSync(`./data/${subject}/${record}.fm`));
        res.status(200).send(JSON.stringify(recordData));
    });

    function rawBody(req, res, next) {
        req.setEncoding('utf8');
        req.rawBody = '';
        req.on('data', chunk => req.rawBody += chunk);
        req.on('end', () => next());
    }



    // Put new brain image data into .metadata
    router.put('/api/brain/:subject', async (req, res) => {
        let subject = req.params.subject;
        if (fs.existsSync(`./data/${subject}`)) {
            let fileContent = await fsp.readFile(`./data/${subject}/.metadata`)
            let metadata = JSON.parse(fileContent)
            let oldMetadata = metadata;
            let newMetadata = Object.assign({}, oldMetadata);
            let form = formidable.IncomingForm();
            form.uploadDir = './uploads';
            form.on('file', async function (field, file) {
                let fileContent = await fsp.readFile(file.path)
                let imageData2 = new Buffer(fileContent)
                let imageData = imageData2.toString('base64')
                let imageExtension = path.extname(file.name);
                newMetadata.brainImage = 'data:image/' + imageExtension + ';base64,' + imageData;
                fs.writeFile(`./data/${subject}/.metadata`, JSON.stringify(newMetadata), (err) => {
                    if (err) console.log(err)
                });
            })
            form.on('end', () => {
                res.sendStatus(201)
            });
            form.parse(req);
        }

    });

    router.put('/api/geometry/:subject', async (req, res) => {
        let subject = req.params.subject;
        if (fs.existsSync(`./data/${subject}`)) {
            let fileContent = await fsp.readFile(`./data/${subject}/.metadata`)
            let metadata = JSON.parse(fileContent)
            let oldMetadata = metadata;
            let newMetadata = Object.assign({}, oldMetadata);
            if (req.headers['content-type'] === undefined) {
                errOut(400, 'No geometry content-type specified; cannot interpret.');
                return;
            }
            let reqContentType = req.headers['content-type'].split(';')[0];
            let writeMetadata = function (dataToWrite, onSuccess) {
                fs.writeFile(`./data/${subject}/.metadata`, JSON.stringify(dataToWrite), (err) => {
                    // if (err) {
                    //     errOut(500, 'Could not update metadata for "' + subject + '": ' + JSON.stringify(err));
                    //     return;
                    // }
                    if (onSuccess !== undefined) {
                        onSuccess();
                    }
                });
            };
            let handleJSONData = function (data, cb) {
                try {
                    newMetadata.sensorGeometry = JSON.parse(data);
                } catch (err) {
                    errOut(400, 'New geometry JSON could not be parsed: ' + JSON.stringify(err));
                    return;
                }
                writeMetadata(newMetadata, cb);
            };
            let handleCSVData = function (data, cb) {
                let newGeometry = {};
                let lines = data.split('\n');
                let entries = lines.map(function (line) {
                    return line.split(',');
                });
                for (let i = 0; i < entries.length; i++) {
                    let lineEntries = entries[i];
                    if (lineEntries.length < 3) {
                        continue;
                    }
                    let channelName = lineEntries[0];
                    let channelU = +lineEntries[1];
                    let channelV = +lineEntries[2];
                    if (isNaN(channelU) || isNaN(channelV)) {
                        continue;
                    }
                    newGeometry[channelName] = {
                        u: channelU,
                        v: channelV
                    };
                }
                newMetadata.sensorGeometry = newGeometry;
                writeMetadata(newMetadata, cb);
            };
            if (reqContentType == 'application/json') {
                handleJSONData(req.rawBody, () => res.sendStatus(201));
                return;
            }
            if (reqContentType == 'text/csv') {
                handleCSVData(req.rawBody, () => res.sendStatus(201));
                return;
            }
            if (reqContentType == 'multipart/form-data') {
                let form = formidable.IncomingForm();
                form.uploadDir = './uploads';
                form.on('file', (field, file) => {
                    let fileExtension = path.extname(file.name);
                    if (fileExtension == '.json') {
                        fs.readFile(file.path, (err, data) => handleJSONData(data.toString()));
                        return;
                    }
                    if (fileExtension == '.csv') {
                        fs.readFile(file.path, (err, data) => handleCSVData(data.toString()));
                        return;
                    }
                });
                form.on('error', err => {});
                form.on('end', () => res.sendStatus(201));
                form.parse(req);
                return;
            }
            errOut(400, 'Request content-type, "' + reqContentType + '", is not supported.');
        };
    });

    //Add a new subject
    router.put('/api/data/:subject', rawBody, (req, res) => {
        let subject = req.params.subject;
        if (!fs.existsSync(`./data/${subject}`)) {
            fs.mkdir(`./data/${subject}`, () => {
                let metadata = {
                    'subject': subject
                };
                if (req.rawBody != '') {
                    let bodyData = {};
                    bodyData = JSON.parse(req.rawBody);

                    Object.assign(metadata, bodyData);
                }
                fs.writeFile(`./data/${subject}/.metadata`, JSON.stringify(metadata), err => res.sendStatus(201));
            });
        };
    })

    //Add a new record
    router.put('/api/data/:subject/:record', rawBody, (req, res) => {
        let subject = req.params.subject;
        let record = req.params.record;
        fs.writeFile(`./data/${subject}/${record}.fm`, req.rawBody, () => res.sendStatus(201));
    });
    return router;

}
export default routes