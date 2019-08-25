import path from 'path'
import fs from 'fs';
import jsonfile from 'jsonfile'
let __dirname = path.resolve(path.dirname(''));


const routes = (express) => {
    const router = express.Router();

    router.get('/map/config/ui', (req, res) => {
        res.sendFile(`${__dirname}/server/config/fmui.json`)
    });

    router.get('/index/config/online', (req, res) => {
        res.sendFile(`${__dirname}/server/config/fmonline.json`)
    });
    router.get('/map/config/online', (req, res) => {
        res.sendFile(`${__dirname}/server/config/fmonline.json`)
    });
    router.get('/map/config/tasks', (req, res) => {
        res.sendFile(`${__dirname}/server/config/tasks.json`)
    });


    router.get('/live', function (req, res) {
        res.sendFile(path.join(__dirname, "/public", "live.html"))
    });
    router.get('/map', function (req, res) {
        res.sendFile(`${__dirname}/dist/map.html`)
    });

    router.get('/record', function (req, res) {
        res.sendFile(`${__dirname}/dist/record.html`)
    });

    router.get('/map/online', function (req, res) {
        res.sendFile(`${__dirname}/dist/map.html`)
    });

    // router.get('/map/:subject/:record', function (req, res) {
    //     res.sendFile(`${__dirname}/dist/map.html`)
    // });


    router.get("/api/list", (req, res) => {
        fs.readdir('./data', (err, subjects) => {
            let _subjects = subjects.filter(f => f != '.gitignore')
            res.status(200).json(_subjects);
        });
    });

    router.get('/api/list/:subject', (req, res) => {
        let subject = req.params.subject;
        let recordDir = `./data/${subject}`;
        fs.readdir(recordDir, (err, records) => {
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
                    jsonfile.readFile(`./data/${subject}/.metadata`, function (err, metadata) {
                        res.status(200).send(metadata.brainImage);
                    });
                }
            }
        });
    });

    router.get('/api/geometry/:subject', function (req, res) {
        var subject = req.params.subject;
        fs.readdir('./data', (err, subjects) => {
            if (subjects.indexOf(subject) > -1) {
                if (fs.existsSync(`./data/${subject}/.metadata`)) {
                    jsonfile.readFile(`./data/${subject}/.metadata`, function (err, metadata) {
                        res.status(200).send(metadata.sensorGeometry);
                    });
                }
            }
        });
    });

    router.get('/api/data/:subject/:record', function (req, res) {

        var subject = req.params.subject;
        var record = req.params.record;
        let recordData = JSON.parse(fs.readFileSync(`./data/${subject}/${record}.fm`));
        res.status(200).send(JSON.stringify(recordData));

    });

    return router;

}
export default routes