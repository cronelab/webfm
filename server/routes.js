import path from "path";
import fs from "fs";
import loadJsonFile from "load-json-file";
import bodyParser from 'body-parser'
import multer from 'multer'
const infoDir = "./data/info";
const dataDir = "./data";


const getRecord = async (subject, record) => {
  const recordPath = path.join(dataDir, subject, record);
  let _record = await loadJsonFile(recordPath);
  return _record;
};

const getCortStim = async (subject, results) => {
  const resultsPath = path.join(dataDir, subject, results);
  let _result = await loadJsonFile(resultsPath);
  return _result;
};



const routes = (express) => {
  const router = express.Router();

  router.get("/api/config/", (req, res) => res.sendFile(`${__dirname}/config.json`));


  router.use(bodyParser.json())
  router.get("/map", (req, res) =>
    res.sendFile(path.join(__dirname, "/../dist", "/map.html"))
  );
  router.get("/replay", (req, res) =>
    res.sendFile(path.join(__dirname, "/../dist", "/replay.html"))
  );
  router.get("/cortstim", (req, res) =>
    res.sendFile(path.join(__dirname, "/../dist", "/cortstim.html"))
  );
  router.get("/cceps", (req, res) =>
    res.sendFile(path.join(__dirname, "/../dist", "/CCEPS.html"))
  );

  router.get("/api/CCEPS/:subject/:task/:data",  (req, res) => {
    let subject = req.params.subject;
    let task = req.params.task;
    let data = req.params.data;
    fs.readdir(dataDir,async (err, subjects) => {
      if (subjects.indexOf(subject) > -1) {
        if (data == "img") {
          console.log(data);
          if (fs.existsSync(`${dataDir}/${subject}/CCEPS/${subject}_${task}.jpg`)) {
            res.sendFile(`${subject}_${task}.jpg`, {
              root: `${dataDir}/${subject}/CCEPS`
            });
          }
        } else if (data == "z-scores") {
          if (fs.existsSync(`${dataDir}/${subject}/CCEPS/${subject}_${task}.json`)) {
            let _result = await loadJsonFile(`${dataDir}/${subject}/CCEPS/${subject}_${task}.json`);
            res.status(200).json(_result);

          }
        }
      }

    });
  })

  //Cortstim directory
  router.get("/api/cortstim", (req, res) => {
    fs.readdir(`${infoDir}/PY18N007`, (err, files) => {
      getCortStim('PY18N007', files[4]).then(x => {
        res.send(x.Trial);
      })
    });
  });

  //List of subjects
  router.get("/api/subjects", (req, res) => {
    fs.readdir(dataDir, (err, subjects) => {
      res.status(200).json(subjects);
    });
  });


  //3D brain
  router.get("/3Dbrain/:subject", (req, res) => {
    let subject = req.params.subject;
    fs.readdir(infoDir, (err, subjects) => {
      if (subjects.indexOf(subject) > -1) {
        //Load the fbx file
        if (fs.existsSync(`${infoDir}/${subject}/${subject}.fbx`)) {
          console.log('here')
          res.sendFile(`${subject}.fbx`, {
            root: `${infoDir}/${subject}/`
          });
        }
      } else {
        console.log("subject not found");
      }
    });
  });

  //List of records
  router.get("/api/:subject/records", (req, res) => {
    let subject = req.params.subject;
    let subjectDir = path.join(dataDir, subject);
    fs.readdir(subjectDir, (err, records) => {
      let cleanRecords = records
        .map(e => {
          return path.parse(e).name;
        })
        .filter(f => f != ".metadata");
      res.status(200).json(cleanRecords);
    });
  });

  //Record
  router.get("/api/:subject/:record/:info", (req, res) => {
    let subject = req.params.subject;
    let record = `${req.params.record}.json`;
    let info = req.params.info;
    getRecord(subject, record).then(recordFile => {
      let infoToSend = recordFile.contents[`${info}`];
      res.status(200).json(infoToSend);
    });
  });

  //Geometry
  router.get("/api/:subject/geometry", (req, res) => {
    let subject = req.params.subject;
    fs.readdir(dataDir, (err, subjects) => {
      if (subjects.indexOf(subject) > -1) {
        if (fs.existsSync(`${dataDir}/${subject}/info/channels.json`)) {
          res.sendFile(`channels.json`, {
            root: `${dataDir}/${subject}/info`
          });
        } else {}
      } else {
        console.log("subject not found");
      }
    })
  })
  //Add subjects geometry to the database
  router.put("/api/:subject/geometry", (req, res) => {
    let returnObject = {}
    req.body.electrodeName.forEach((name, i) => {
      returnObject[name] = req.body.electrodePosition[i]
      return returnObject
    })
    fs.writeFile(`./data/${req.params.subject}/info/channels.json`, JSON.stringify(returnObject), (err) => console.log(err))
  });

  //Add subjects geometry to the database
  router.put("/api/:subject/notes", (req, res) => {
    console.log(req.body.note)
    fs.writeFile(`./data/${req.params.subject}/info/notes.txt`, req.body.note, (err) => console.log(err))

  });



  //Brain
  router.get("/api/:subject/brain", (req, res) => {
    let subject = req.params.subject;
    fs.readdir(dataDir, (err, subjects) => {
      if (subjects.indexOf(subject) > -1) {
        //Load the jpg, if jpg doesn't exist, load data from the .metadata file
        if (fs.existsSync(`${dataDir}/${subject}/info/reconstruction.jpg`)) {
          res.sendFile(`reconstruction.jpg`, {
            root: `${dataDir}/${subject}/info`
          });
        }
      } else {
        console.log("subject not found");
      }
    });
  });

  router.post("/api/:subject/brain", (req, res) => {
    if (!fs.existsSync(`./data/${req.params.subject}/info`)) {
      fs.mkdirSync(`./data/${req.params.subject}`)
      fs.mkdirSync(`./data/${req.params.subject}/info`);
    }
    var upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, `./data/${req.params.subject}/info`)
        },
        filename: (req, file, cb) => {
          cb(null, `reconstruction${path.extname(file.originalname)}`);
        }
      }),
      limits: {
        fileSize: 100000000
      }
    }).single('myImage');
    upload(req, res, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.send()
      }
    })
  })

  router.post('/api/:subject/data/save', (req, res) => {
    console.log(req.body)
    fs.writeFile(`./data/${req.params.subject}/data/timeSeries.json`, JSON.stringify(req.body), (err) => console.log(err))

  })







  return router;
};

export default routes