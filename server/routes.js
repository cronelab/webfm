import path from "path";
import fs from "fs";
import {
  promises as fsp
} from "fs";
import formidable from "formidable";
// import multer from 'multer'
// import loadJsonFile from "load-json-file";
// const infoDir = "./data/info";
// const dataDir = "./data";
let __dirname = path.resolve(path.dirname(""));

const routes = express => {
  const router = express.Router();

  router.get("/config", (req, res) =>
    res.sendFile(`${__dirname}/server/config.json`)
  );

  router.get("/live", (req, res) =>
    res.sendFile(`${__dirname}/dist/live.html`)
  );
  router.get("/map", (req, res) => res.sendFile(`${__dirname}/dist/map.html`));
  router.get("/record", (req, res) =>
    res.sendFile(`${__dirname}/dist/record.html`)
  );

  router.get("/api/list", (req, res) => {
    fs.readdir("./data", (err, subjects) => {
      let _subjects = subjects.filter(f => f != ".gitignore");
      res.status(200).json(_subjects);
    });
  });

  router.get("/api/list/:subject", (req, res) => {
    let subject = req.params.subject;
    if (subject != "undefined") {
      fs.readdir(`./data/${subject}`, (err, records) => {
        //Need something here if name isn't in the records
        if (err) throw Error;
        let _records = records
          .filter(f => path.extname(f) == ".fm")
          .map(z => z.split(".")[0]);
        res.status(200).json(_records);
      });
    } else {
      res.send(JSON.stringify({
        test: "test"
      }));
    }
  });
  router.get("/api/info/:subject/:record", (req, res) => {
    let subject = req.params.subject;
    let record = req.params.record;
    res.json({
      subject: subject,
      record: record,
      uri: path.join("/", "api", "data", subject, record)
    });
  });

  router.get("/api/brain/:subject", (req, res) => {
    let subject = req.params.subject;
    fs.readdir("./data", (err, subjects) => {
      if (subjects.indexOf(subject) > -1) {
        if (fs.existsSync(`./data/${subject}/.metadata`)) {
          let metadata = JSON.parse(
            fs.readFileSync(`./data/${subject}/.metadata`)
          );
          res.status(200).send(metadata.brainImage);
        } else {
          res.status(400).send({
            message: "This is an error!"
          });
        }
      }
    });
  });

  router.get("/api/geometry/:subject", (req, res) => {
    let subject = req.params.subject;
    fs.readdir("./data", (err, subjects) => {
      if (subjects.indexOf(subject) > -1) {
        if (fs.existsSync(`./data/${subject}/.metadata`)) {
          let metadata = JSON.parse(
            fs.readFileSync(`./data/${subject}/.metadata`)
          );
          res.status(200).send(metadata.sensorGeometry);
        }
      } else {
        console.log("Send it");
        let sensorGeometry = {
          placeHolder: {
            u: 0.0,
            v: 0
          }
        };
        res.send(JSON.stringify(sensorGeometry));
      }
    });
  });

  router.get("/api/data/:subject/:record", (req, res) => {
    var subject = req.params.subject;
    var record = req.params.record;
    let recordData = JSON.parse(
      fs.readFileSync(`./data/${subject}/${record}.fm`)
    );
    res.status(200).send(JSON.stringify(recordData));
  });

  function rawBody(req, res, next) {
    req.setEncoding("utf8");
    req.rawBody = "";
    req.on("data", chunk => (req.rawBody += chunk));
    req.on("end", () => next());
  }

  // Put new brain image data into .metadata
  router.put("/api/brain/:subject", async (req, res) => {
    let subject = req.params.subject;
    if (fs.existsSync(`./data/${subject}`)) {
      let fileContent = await fsp.readFile(`./data/${subject}/.metadata`);
      let metadata = JSON.parse(fileContent);
      let oldMetadata = metadata;
      let newMetadata = Object.assign({}, oldMetadata);
      let form = formidable.IncomingForm();
      form.uploadDir = "./uploads";
      form.on("file", async function (field, file) {
        let fileContent = await fsp.readFile(file.path);
        let imageData2 = new Buffer(fileContent);
        let imageData = imageData2.toString("base64");
        let imageExtension = path.extname(file.name);
        newMetadata.brainImage =
          "data:image/" + imageExtension + ";base64," + imageData;
        fs.writeFile(
          `./data/${subject}/.metadata`,
          JSON.stringify(newMetadata),
          err => {
            if (err) console.log(err);
          }
        );
      });
      form.on("end", () => {
        res.sendStatus(201);
      });
      form.parse(req);
    }
  });

  router.put("/api/geometry/:subject", async (req, res) => {
    let subject = req.params.subject;
    if (fs.existsSync(`./data/${subject}`)) {
      let fileContent = await fsp.readFile(`./data/${subject}/.metadata`);
      let metadata = JSON.parse(fileContent);
      let oldMetadata = metadata;
      let newMetadata = Object.assign({}, oldMetadata);
      let reqContentType = req.headers["content-type"].split(";")[0];
      if (reqContentType == "application/json") {
        newMetadata.sensorGeometry = JSON.stringify(req.body);
        fs.writeFile(
          `./data/${subject}/.metadata`,
          JSON.stringify(newMetadata),
          err => {
            if (err) console.log(err);
          }
        );
      }
      return;
    }
  });

  //Add a new subject
  router.put("/api/data/:subject", rawBody, (req, res) => {
    let subject = req.params.subject;
    if (!fs.existsSync(`./data/${subject}`)) {
      fs.mkdir(`./data/${subject}`, () => {
        let metadata = {
          subject: subject
        };
        if (req.rawBody != "") {
          let bodyData = {};
          bodyData = JSON.parse(req.rawBody);

          Object.assign(metadata, bodyData);
        }
        fs.writeFile(
          `./data/${subject}/.metadata`,
          JSON.stringify(metadata),
          err => res.sendStatus(201)
        );
      });
    }
  });

  //Add a new record
  router.put("/api/data/:subject/:record", rawBody, (req, res) => {
    let subject = req.params.subject;
    let record = req.params.record;
    fs.writeFile(`./data/${subject}/${record}.fm`, req.rawBody, () =>
      res.sendStatus(201)
    );
  });
  return router;
};
export default routes;


// const getRecord = async (subject, record) => {
//   const recordPath = path.join(dataDir, subject, record);
//   let _record = await loadJsonFile(recordPath);
//   return _record;
// };

// const getCortStim = async (subject, results) => {
//   const resultsPath = path.join(dataDir, subject, results);
//   let _result = await loadJsonFile(resultsPath);
//   return _result;
// };

// const routes = (express) => {
//   const router = express.Router();

//   router.get("/replay", (req, res) =>
//     res.sendFile(path.join(__dirname, "/dist", "/replay.html"))
//   );
//   router.get("/cortstim", (req, res) =>
//     res.sendFile(path.join(__dirname, "/dist", "/cortstim.html"))
//   );
//   router.get("/cceps", (req, res) =>
//     res.sendFile(path.join(__dirname, "/dist", "/CCEPS.html"))
//   );

//   router.get("/api/CCEPS/:subject/:task/:data", (req, res) => {
//     let subject = req.params.subject;
//     let task = req.params.task;
//     let data = req.params.data;
//     fs.readdir(dataDir, async (err, subjects) => {
//       if (subjects.indexOf(subject) > -1) {
//         if (data == "img") {
//           if (fs.existsSync(`${dataDir}/${subject}/CCEPS/${subject}_${task}.jpg`)) {
//             res.sendFile(`${subject}_${task}.jpg`, {
//               root: `${dataDir}/${subject}/CCEPS`
//             });
//           }
//         } else if (data == "z-scores") {
//           if (fs.existsSync(`${dataDir}/${subject}/CCEPS/${subject}_${task}.json`)) {
//             let _result = await loadJsonFile(`${dataDir}/${subject}/CCEPS/${subject}_${task}.json`);
//             res.status(200).json(_result);

//           }
//         }
//       }

//     });
//   })
//   router.get("/responseInfo/:subject/:task", async (req,res) => {
//     let subject = req.params.subject;
//     let task = req.params.task;
//     const responseInfoPath = path.join(dataDir, subject, 'data','EP');
//     let resInfoFile = `${responseInfoPath}/${subject}_CCEPS_${task}_ResponseInfo.json`;
//     if (fs.existsSync(resInfoFile)) {
//       let _result = await loadJsonFile(resInfoFile);
//       let significantChannels = {}
//       Object.keys(_result.significant).forEach(x => {
//         if(_result.significant[x] ==1 ){
//           return significantChannels[x] = _result.time[x]
//         }
//       })
//       res.send(significantChannels);

//     }

//   //Cortstim directory
//   router.get("/api/cortstim", (req, res) => {
//     fs.readdir(`${infoDir}/PY18N007`, (err, files) => {
//       getCortStim('PY18N007', files[4]).then(x => {
//         res.send(x.Trial);
//       })
//     });
//   });

//   //List of subjects
//   router.get("/api/subjects", (req, res) => {
//     fs.readdir(dataDir, (err, subjects) => {
//       res.status(200).json(subjects);
//     });
//   });

//   //List of records
//   router.get("/api/:subject/records/HG", (req, res) => {
//     let subject = req.params.subject;
//     let epDir = path.join(dataDir, subject, 'data', 'HG');
//     fs.readdir(epDir, (err, records) => {
//       let cleanRecords = records.map(f => f.split('.')[0])
//       res.status(200).json(cleanRecords)
//     });
//   });

//   router.get("/api/:subject/records/EP", (req, res) => {
//     let subject = req.params.subject;
//     let epDir = path.join(dataDir, subject, 'data', 'EP');
//     fs.readdir(epDir, (err, records) => {
//       let cleanRecords = records.filter(e => path.extname(e) == '.json').map(f => f.split('.')[0])
//       res.status(200).json(cleanRecords)
//   });
//   });

//   //Record
//   router.get("/api/:subject/:record/:info", (req, res) => {
//     let subject = req.params.subject;
//     let record = `${req.params.record}.json`;
//     let info = req.params.info;
//     getRecord(subject, record).then(recordFile => {
//       let infoToSend = recordFile.contents[`${info}`];
//       res.status(200).json(infoToSend);
//     });
//   });

//   //Geometry
//   router.get("/api/:subject/geometry", (req, res) => {
//     let subject = req.params.subject;
//     fs.readdir(dataDir, (err, subjects) => {
//       if (subjects.indexOf(subject) > -1) {
//         if (fs.existsSync(`${dataDir}/${subject}/info/channels.json`)) {
//           res.sendFile(`channels.json`, {
//             root: `${dataDir}/${subject}/info`
//           });
//         } else {}
//       } else {
//         console.log("subject not found");
//       }
//     })
//   })
//   router.put("/api/:subject/geometry", (req, res) => {
//     let returnObject = {}
//     req.body.electrodeName.forEach((name, i) => {
//       returnObject[name] = req.body.electrodePosition[i]
//       return returnObject
//     })
//     fs.writeFile(`./data/${req.params.subject}/info/channels.json`, JSON.stringify(returnObject), (err) => console.log(err))
//   });
//   //Notes
//   router.put("/api/:subject/notes", (req, res) => {
//     console.log(req.body.note)
//     fs.writeFile(`./data/${req.params.subject}/info/notes.txt`, req.body.note, (err) => console.log(err))
//   });
//   //Brain
//   router.get("/api/:subject/brain", (req, res) => {
//     let subject = req.params.subject;
//     fs.readdir(dataDir, (err, subjects) => {
//       if (subjects.indexOf(subject) > -1) {
//         //Load the jpg, if jpg doesn't exist, load data from the .metadata file
//         if (fs.existsSync(`${dataDir}/${subject}/info/reconstruction.jpg`)) {
//           res.sendFile(`reconstruction.jpg`, {
//             root: `${dataDir}/${subject}/info`
//           });
//         }
//       } else {
//         console.log("subject not found");
//       }
//     });
//   });
//   router.post("/api/:subject/brain", (req, res) => {
//     if (!fs.existsSync(`./data/${req.params.subject}/info`)) {
//       fs.mkdirSync(`./data/${req.params.subject}`)
//       fs.mkdirSync(`./data/${req.params.subject}/info`);
//     }
//     var upload = multer({
//       storage: multer.diskStorage({
//         destination: (req, file, cb) => {
//           cb(null, `./data/${req.params.subject}/info`)
//         },
//         filename: (req, file, cb) => {
//           cb(null, `reconstruction${path.extname(file.originalname)}`);
//         }
//       }),
//       limits: {
//         fileSize: 100000000
//       }
//     }).single('myImage');
//     upload(req, res, (err) => {
//       if (err) {
//         console.log(err);
//       } else {
//         res.send()
//       }
//     })
//   })
//   //3D brain
//   router.get("/api/:subject/brain3D", (req, res) => {
//     let subject = req.params.subject;
//     fs.readdir(dataDir, (err, subjects) => {
//       if (subjects.indexOf(subject) > -1) {
//         //Load the fbx file
//         if (fs.existsSync(`${dataDir}/${subject}/info/reconstruction.fbx`)) {
//           res.sendFile(`reconstruction.fbx`, {
//             root: `${dataDir}/${subject}/info`
//           });
//         }
//       } else {
//         console.log("subject not found");
//       }
//     });
//   });

//   router.post('/api/:subject/data/save', (req, res) => {
//     console.log(req.body)
//     fs.writeFile(`./data/${req.params.subject}/data/timeSeries.json`, JSON.stringify(req.body), (err) => console.log(err))
//   })

//   return router;
// };

// export default routes