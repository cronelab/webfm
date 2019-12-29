import path from "path";
import fs from "fs";
import {
	promises as fsp
} from "fs";
import formidable from "formidable";
// import multer from 'multer'
let __dirname = path.resolve(path.dirname(""));

// const getCortStim = async (subject, results) => {
// 	const resultsPath = path.join(dataDir, subject, results);
// 	let _result = await loadJsonFile(resultsPath);
// 	return _result;
// };

const routes = express => {
	const router = express.Router();

	router.get("/config", (req, res) =>
		res.sendFile(`${__dirname}/server/config.json`)
	);
	router.get("/loader_nifti", (req, res) =>
		res.sendFile(path.join(__dirname, "/dist", "/loader_nifti.html"))
	);
	router.get("/live", (req, res) =>
		res.sendFile(`${__dirname}/dist/live.html`)
	);
	router.get("/map", (req, res) => res.sendFile(`${__dirname}/dist/map.html`));
	router.get("/ML", (req, res) => res.sendFile(`${__dirname}/dist/ml.html`));
	router.get("/record", (req, res) =>
		res.sendFile(`${__dirname}/dist/record.html`)
	);

	router.get("/api/list", (req, res) => {
		fs.readdir("./data", (err, subjects) => {
			let _subjects = subjects.filter(f => f != ".gitignore");
			res.status(200).json(_subjects);
		});
	});
	//List of subjects
	router.get("/api/subjects", (req, res) => {
		fs.readdir('./data', (err, subjects) => {
			res.status(200).json(subjects);
		});
	});

	router.get("/cortstim", (req, res) =>
		res.sendFile(path.join(__dirname, "/dist", "/cortstim.html"))
	);
	router.get("/3D", (req, res) =>
		res.sendFile(path.join(__dirname, "/dist", "/threeD.html"))
	);

	router.get("/cceps", (req, res) =>
		res.sendFile(path.join(__dirname, "/dist", "/cceps.html"))
	);

	router.get("/api/brain/:subject", (req, res) => {
		let subject = req.params.subject;
		fs.readdir("./data", (err, subjects) => {
			if (subjects.indexOf(subject) > -1) {
				if (fs.existsSync(`./data/${subject}/info/reconstruction.jpg`)) {
					res.sendFile(`reconstruction.jpg`, {
						root: `./data/${subject}/info/`
					});
				} else {
					if (fs.existsSync(`./data/${subject}/.metadata`)) {
						let metadata = JSON.parse(
							fs.readFileSync(`./data/${subject}/.metadata`, 'utf8')
						);
						res.status(200).send(metadata.brainImage);
					} else {
						res.status(400).send({
							message: "This is an error!"
						});
					}
				}
			}
		});
	});

	router.get("/api/geometry/:subject", (req, res) => {
		let subject = req.params.subject;
		fs.readdir("./data", (err, subjects) => {
			if (subjects.indexOf(subject) > -1) {
				if (fs.existsSync(`./data/${subject}/info/channels.json`)) {
					res.sendFile(`channels.json`, {
						root: `./data/${subject}/info`
					});
				} else if (fs.existsSync(`./data/${subject}/.metadata`)) {
					let metadata = JSON.parse(
						fs.readFileSync(`./data/${subject}/.metadata`, 'utf8')
					);
					res.status(200).send(metadata.sensorGeometry);
				}
			} else {
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


	//Cortstim directory
	router.get("/api/:subject/records/cortstim", (req, res) => {
		let subject = req.params.subject;
		fs.readdir(`./data/${subject}/data/cortstim`, (err, files) => {
			if (files != undefined) {
				let _records = files.filter(f => path.extname(f) == ".pdf").map(z => z.split(".")[0]);
				res.status(200).json(_records)
			}
			else {
				res.status(204).end()
			}
		});
	});
	//Cortstim pdf
	router.get("/api/:subject/cortstim", (req, res) => {
		let subject = req.params.subject;
		fs.readdir(`./data/${subject}/data/cortstim`, (err, files) => {
			if (files != undefined) {
				let _records = files.filter(f => path.extname(f) == ".pdf");
				var file = fs.readFileSync(`./data/${subject}/data/cortstim/${_records[0]}`);
				res.setHeader('Content-Type', 'application/pdf');
				res.send(file)
			}
		});
	});
	//Send a list of high gamma records
	router.get("/api/:subject/records/HG", (req, res) => {
		let subject = req.params.subject;
		fs.readdir(`./data/${subject}/data/HG`, (err, records) => {
			if (records != undefined) {
				if (records.length != 0) {
					let cleanRecords = records.map(f => f.split('.')[0])
					res.status(200).json(cleanRecords)
				} else {
					res.status(404).end()
				}
			} else {
				res.status(204).end()
			}
		});
	});
	//Send a list of evoked potential records
	router.get("/api/:subject/records/EP", (req, res) => {
		let subject = req.params.subject;
		fs.readdir(`./data/${subject}/data/EP`, (err, records) => {
			if (records != undefined) {
				let cleanRecords = records.filter(e => path.extname(e) == '.json').map(f => f.split('.')[0])
				let recordsToSend = cleanRecords.map(f => {
					let split = f.split('_');
					return `${split[1]}_${split[2]}_${split[3]}`
				})
				res.status(200).json(recordsToSend)
			} else {
				res.status(204).end()
			}
		});
	});

	router.get("/responseInfo/:subject/:task", async (req, res) => {
		let subject = req.params.subject;
		let task = req.params.task;
		const responseInfoPath = `./data/${subject}/data/EP`;
		let resInfoFile = `${responseInfoPath}/${subject}_${task}_ResponseInfo.json`;
		if (fs.existsSync(resInfoFile)) {
			let _result = JSON.parse(
				fs.readFileSync(resInfoFile, 'utf8')
			);
			let significantChannels = {}
			Object.keys(_result.significant).forEach(x => {
				if (_result.significant[x] == 1) {
					return significantChannels[x] = _result.significant[x]
				}
			})
			res.send(Object.keys(significantChannels));
		}
	})

	router.get("/z-score/:subject/:task", async (req, res) => {
		let subject = req.params.subject;
		let task = req.params.task;
		const responseInfoPath = `./data/${subject}/data/EP`;
		let resInfoFile = `${responseInfoPath}/${subject}_${task}_ResponseInfo.json`;
		if (fs.existsSync(resInfoFile)) {
			let _result = JSON.parse(
				fs.readFileSync(resInfoFile, 'utf8')
			);
			let sigResponses = {}
			Object.keys(_result.significant).forEach(val => {
				if (_result.significant[val] > 0) {

					sigResponses[val] = { timeToPeak: _result.zscores[val].overall[0], peak: _result.zscores[val].overall[1] }
				}
			})
			res.send(JSON.stringify(sigResponses));
		}
	})
	//Send a list of HG records (v1 format)
	router.get("/api/:subject/records/FM", (req, res) => {
		let subject = req.params.subject;
		fs.readdir(`./data/${subject}`, (err, records) => {
			if (records != undefined) {
				if (records.length != 0) {
					let _records = records.filter(f => path.extname(f) == ".fm").map(z => z.split(".")[0]);
					res.status(200).json(_records);
				} else {
					res.status(404).end()

				}
			} else {
				res.status(204).end()
			}
		});
	})

	//Send a list of CCEP records
	router.get("/api/:subject/records/CCEPS", (req, res) => {
		let subject = req.params.subject;
		fs.readdir(`./data/${subject}/data/CCEPS`, (err, records) => {
			if (records != undefined) {
				if (records.length != 0) {
					let _records = records.filter(f => !f.includes("map")).map(z => z.split(".")[0])
					res.status(200).json(_records);
				} else {
					res.status(404).end()
				}
			} else {
				res.status(204).end()
			}
		})
	})
	//Send CCEP images
	router.get("/api/:subject/CCEPS_response/:record", (req, res) => {
		let subject = req.params.subject;
		let record = req.params.record;
		fs.readdir(`./data/${subject}/data/CCEPS/`, (err, subjects) => {
			if (fs.existsSync(`./data/${subject}/data/CCEPS/${record}.jpg`)) {
				res.sendFile(`${record}.jpg`, {
					root: `./data/${subject}/data/CCEPS/`
				});
			}
		});
	})
	//Send CCEP images
	router.get("/api/:subject/CCEPS_map/:record", (req, res) => {
		let subject = req.params.subject;
		let record = req.params.record;
		console.log(record)
		fs.readdir(`./data/${subject}/data/CCEPS/`, (err, subjects) => {
			if (fs.existsSync(`./data/${subject}/data/CCEPS/${record}_map.jpg`)) {
				res.sendFile(`${record}_map.jpg`, {
					root: `./data/${subject}/data/CCEPS/`
				});
			}
		});
	})
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
	router.get("/api/info/:subject/:record", (req, res) => {
		let subject = req.params.subject;
		let record = req.params.record;
		res.json({
			subject: subject,
			record: record,
			uri: path.join("/", "api", "data", subject, record)
		});
	});


	router.get("/api/data/:subject/:record", (req, res) => {
		var subject = req.params.subject;
		var record = req.params.record;
		let recordData = JSON.parse(
			fs.readFileSync(`./data/${subject}/${record}.fm`, 'utf8')
		);
		res.status(200).send(JSON.stringify(recordData));
	});

	router.get("/api/data/:subject/:record/HG", (req, res) => {
		var subject = req.params.subject;
		var record = req.params.record;
		let filetoread = fs.readFileSync(`./data/${subject}/data/HG/${record}.json`, 'utf8');
		let recordData = JSON.parse(filetoread);
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
			let fileContent = await fsp.readFile(`./data/${subject}/.metadata`, 'utf8');
			let metadata = JSON.parse(fileContent);
			let oldMetadata = metadata;
			let newMetadata = Object.assign({}, oldMetadata);
			let form = new formidable.IncomingForm();
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

	//Add a new geometry file
	router.put("/api/geometry/:subject", async (req, res) => {
		let subject = req.params.subject;
		if (fs.existsSync(`./data/${subject}`)) {
			let fileContent = await fsp.readFile(`./data/${subject}/.metadata`, 'utf8');
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
	//3D brain
	router.get("/api/:subject/brain3D", (req, res) => {
		let subject = req.params.subject;
		fs.readdir('./data', (err, subjects) => {
			if (subjects.indexOf(subject) > -1) {
				//Load the fbx file
				if (fs.existsSync(`./data/${subject}/info/reconstruction.fbx`)) {
					res.sendFile(`reconstruction.fbx`, {
						root: `./data/${subject}/info`
					});
				}
			} else {
				console.log("subject not found");
			}
		});
	});

	//3D brain
	router.get("/api/:subject/brain3D_g", (req, res) => {
		let subject = req.params.subject;
		fs.readdir('./data', (err, subjects) => {
			if (subjects.indexOf(subject) > -1) {
				//Load the fbx file
				res.set('Content-Type', 'model/fbx')
				if (fs.existsSync(`./data/${subject}/info/reconstruction.gltf`)) {
					res.sendFile(`reconstruction.gltf`, {
						root: `./data/${subject}/info`
					});
				}
			} else {
				console.log("subject not found");
			}
		});
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


//   router.post('/api/:subject/data/save', (req, res) => {
//     console.log(req.body)
//     fs.writeFile(`./data/${req.params.subject}/data/timeSeries.json`, JSON.stringify(req.body), (err) => console.log(err))
//   })


/*react-conversion project
const Record            = require('./schemas/mongo')


    //Sends an array of all subjects in the database
    router.get( '/api/subjects', ( req, res )=> {
        Record.find({},((err,record)=>{
        res.send(record.map((a)=> {return a.identifier}))
        }))
    } );

    //Sends a blob of the subjects brain image
    router.get( '/api/brain/:subject', ( req, res ) => {
        let subject = req.params.subject;
        Record.find({identifier: subject},((err,record)=>{
        if (err) throw err;
            res.contentType('image/png');
            res.end(record[0].brainImage,'binary')
        }))
    } );
    //Sends a list of all records in the subjects database document
    router.get( '/api/list/:subject', ( req, res ) => {
        let subject     = req.params.subject;
        Record.find({identifier: subject},((err,record)=>{
        if (err) throw err;
        res.send(record.map( a => {return Object.keys(a.task)})[0])
        }))
    });

    //Sends a particular record
    router.get( '/api/data/:subject/:record', ( req, res ) => {

        var subject = req.params.subject;
        var record = req.params.record;
    });
    //Sends the electrode montage
    router.get( '/api/geometry/:subject', ( req, res ) => {
        var subject = req.params.subject;
        Record.find({identifier: subject},((err,record)=>{
        if (err) throw err;
        res.send(record.map( a => {return a.geometry})[0])
        }))
    });

    //Add new subject to the database
    router.put( '/api/data/:subject', ( req, res ) => {
        let subject = req.params.subject;
        Record.find({identifier: subject},((err,record)=>{
        if (err) throw err;
        if(record.length){
            console.log("Record already exists!")
        }
        else{
            let newRecord= new Record({
            identifier: subject})
            newRecord.save();
        }
        }))
    })

    //Add subjects brain image to the databse
    router.post( '/api/brain/:subject', ( req, res ) => {
        var subject = req.params.subject;
        let imageFile = req.files.file;
        Record.find({identifier: subject},((err,record)=>{
        if (err) throw err;
        record[0].brainImage = imageFile.data;
        record[0].save();
        }))
    });

    return router;
 }
*/




// const routes = (express) => {
// 	const router = express.Router();

// 	router.get("/api/config/", (req, res) => res.sendFile(`${__dirname}/config.json`));


// 	router.use(bodyParser.json())
// 	router.get("/map", (req, res) =>
// 	  res.sendFile(path.join(__dirname, "/dist", "/map.html"))
// 	);
// 	router.get("/replay", (req, res) =>
// 	  res.sendFile(path.join(__dirname, "/dist", "/replay.html"))
// 	);
// 	router.get("/cortstim", (req, res) =>
// 	  res.sendFile(path.join(__dirname, "/dist", "/cortstim.html"))
// 	);
// 	router.get("/cceps", (req, res) =>
// 	  res.sendFile(path.join(__dirname, "/dist", "/CCEPS.html"))
// 	);

// 	router.get("/responseInfo/:subject/:task", async (req, res) => {
// 	  let subject = req.params.subject;
// 	  let task = req.params.task;
// 	  const responseInfoPath = path.join(dataDir, subject, 'data', 'EP');
// 	  let resInfoFile = `${responseInfoPath}/${subject}_CCEPS_${task}_ResponseInfo.json`;
// 	  if (fs.existsSync(resInfoFile)) {
// 		let _result = await loadJsonFile(resInfoFile);
// 		let significantChannels = {}
// 		Object.keys(_result.significant).forEach(x => {
// 		  if (_result.significant[x] == 1) {
// 			return significantChannels[x] = _result.time[x]
// 		  }
// 		})
// 		res.send(significantChannels);

// 	  }
// 	})

// 	router.get("/api/CCEPS/:subject/:task/:data", (req, res) => {
// 	  let subject = req.params.subject;
// 	  let task = req.params.task;
// 	  let data = req.params.data;
// 	  fs.readdir(dataDir, async (err, subjects) => {
// 		if (subjects.indexOf(subject) > -1) {
// 		  if (data == "img") {
// 			if (fs.existsSync(`${dataDir}/${subject}/data/EP/${subject}_${task}.jpg`)) {
// 			  res.sendFile(`${subject}_${task}.jpg`, {
// 				root: `${dataDir}/${subject}/data/EP`
// 			  });
// 			}
// 		  } else if (data == "z-scores") {
// 			if (fs.existsSync(`${dataDir}/${subject}/data/EP/${subject}_${task}.json`)) {

// 			  let _result = await loadJsonFile(`${dataDir}/${subject}/data/EP/${subject}_${task}.json`);
// 			  res.status(200).json(_result);

// 			}
// 		  }
// 		}

// 	  });
// 	})

// 	//Cortstim directory
// 	router.get("/api/cortstim", (req, res) => {
// 	  fs.readdir(`${infoDir}/PY18N007`, (err, files) => {
// 		getCortStim('PY18N007', files[4]).then(x => {
// 		  res.send(x.Trial);
// 		})
// 	  });
// 	});

// 	//List of subjects
// 	router.get("/api/subjects", (req, res) => {
// 	  fs.readdir(dataDir, (err, subjects) => {
// 		res.status(200).json(subjects);
// 	  });
// 	});




// 	//List of records
// 	router.get("/api/:subject/records/HG", (req, res) => {
// 	  let subject = req.params.subject;
// 	  let epDir = path.join(dataDir, subject, 'data', 'HG');
// 	  fs.readdir(epDir, (err, records) => {
// 		let cleanRecords = records.map(f => f.split('.')[0])
// 		res.status(200).json(cleanRecords)
// 	  });
// 	});

// 	router.get("/api/:subject/records/EP", (req, res) => {
// 	  let subject = req.params.subject;
// 	  let epDir = path.join(dataDir, subject, 'data', 'EP');
// 	  fs.readdir(epDir, (err, records) => {
// 		let cleanRecords = records.filter(e => path.extname(e) == '.json').map(f => f.split('.')[0])
// 		res.status(200).json(cleanRecords)
// 	  });
// 	});

// 	//Record
// 	router.get("/api/:subject/:record/:info", (req, res) => {
// 	  let subject = req.params.subject;
// 	  let record = `${req.params.record}.json`;
// 	  let info = req.params.info;
// 	  getRecord(subject, record).then(recordFile => {
// 		let infoToSend = recordFile.contents[`${info}`];
// 		res.status(200).json(infoToSend);
// 	  });
// 	});

// 	//Geometry
// 	router.get("/api/:subject/geometry", (req, res) => {
// 	  let subject = req.params.subject;
// 	  fs.readdir(dataDir, (err, subjects) => {
// 		if (subjects.indexOf(subject) > -1) {
// 		  if (fs.existsSync(`${dataDir}/${subject}/info/channels.json`)) {
// 			res.sendFile(`channels.json`, {
// 			  root: `${dataDir}/${subject}/info`
// 			});
// 		  } else { }
// 		} else {
// 		  console.log("subject not found");
// 		}
// 	  })
// 	})



// 	return router;
//   };

//   export default routes