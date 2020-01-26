import path from "path";
import fs from "fs";
import {
	promises as fsp
} from "fs";
import formidable from "formidable";
// import multer from 'multer'
let __dirname = path.resolve(path.dirname(""));

function rawBody(req, res, next) {
	req.setEncoding("utf8");
	req.rawBody = "";
	req.on("data", chunk => (req.rawBody += chunk));
	req.on("end", () => next());
}

const routes = express => {
	const router = express.Router();

	//Sends configurations
	router.get("/config", (req, res) => res.sendFile(`${__dirname}/server/config.json`));

	//Sends 3D recon route
	router.get("/reconstruction3D", (req, res) => res.sendFile(path.join(__dirname, "/dist", "/reconstruction3D.html")));

	//Sends list of subjects
	router.get("/api/list", (req, res) => {
		fs.readdir("./data", (err, subjects) => {
			let _subjects = subjects.filter(f => f != ".gitignore");
			res.status(200).json(_subjects);
		});
	});
	//Sends 2D brain
	router.get("/api/brain/:subject", (req, res) => {
		let subject = req.params.subject;
		fs.readdir("./data", (err, subjects) => {
			if (subjects.indexOf(subject) > -1) {
				if (fs.existsSync(`./data/${subject}/info/reconstruction.jpg`)) {
					res.sendFile(`reconstruction.jpg`, {
						root: `./data/${subject}/info/`
					});
				}
			}
			else {
				res.status(204).end()

			}
		});
	});
	//Sends 2D geometry
	router.get("/api/geometry/:subject", (req, res) => {
		let subject = req.params.subject;
		fs.readdir("./data", (err, subjects) => {
			if (subjects.indexOf(subject) > -1) {
				if (fs.existsSync(`./data/${subject}/info/channels.json`)) {
					res.sendFile(`channels.json`, {
						root: `./data/${subject}/info`
					});
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
	//Send a list of high gamma records
	router.get("/api/:subject/records/HG", (req, res) => {
		let subject = req.params.subject;
		let _records = fs.readdirSync(`./data/${subject}/data/HG`)
		let records = _records.map(f => f.split('.')[0])
		if (records.length > 0) {
			res.status(200).json(records)
		} else {
			res.status(204).end()
		}
	});
	//Send the actual HG record
	router.get("/api/data/:subject/:record/HG", (req, res) => {
		var subject = req.params.subject;
		var record = req.params.record;
		let filetoread = fs.readFileSync(`./data/${subject}/data/HG/${record}.json`, 'utf8');
		let recordData = JSON.parse(filetoread);
		res.status(200).send(JSON.stringify(recordData));
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

	//Send the actual EP record
	router.get("/api/data/:subject/:record/EP", (req, res) => {
		let subject = req.params.subject;
		let task = req.params.record;
		const responseInfoPath = `./data/${subject}/data/EP`;
		let resInfoFile = `${responseInfoPath}/${subject}_${task}_ResponseInfo.json`;
		if (fs.existsSync(resInfoFile)) {
			let _result = JSON.parse(
				fs.readFileSync(resInfoFile, 'utf8')
			);
			let significantChannels = {}
			Object.keys(_result.significant).forEach(x => {
				if (_result.significant[x] == 1) {
					return significantChannels[x] = {
						times: _result.time[x],
						zscores: _result.zscores[x].overall
					}
					// 
					// sigResponses[val] = { timeToPeak: _result.zscores[val].overall[0], peak: _result.zscores[val].overall[1] }
				}
			})
			res.send(significantChannels);
		}
	})

	//Send a list of CCSRs
	router.get("/api/:subject/records/CCSR", (req, res) => {
		let subject = req.params.subject;
		fs.readdir(`./data/${subject}/data/CCSR`, (err, records) => {
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

	//Send the actual CCSR record
	router.get("/api/data/:subject/:record/CCSR", (req, res) => {
		let subject = req.params.subject;
		let task = req.params.record;
		const responseInfoPath = `./data/${subject}/data/CCSR`;
		let resInfoFile = `${responseInfoPath}/${subject}_${task}_CCSR_ResponseInfo.json`;
		if (fs.existsSync(resInfoFile)) {
			let _result = JSON.parse(
				fs.readFileSync(resInfoFile, 'utf8')
			);

			let lgData = {
				frequencyBand: _result["lowGamma"]["frequencyBand"],
				sscore: _result["lowGamma"]["sscores"],
				times: _result["lowGamma"]["time"]
			}
			let hgData = {
				frequencyBand: _result["highGamma"]["frequencyBand"],
				sscore: _result["highGamma"]["sscores"],
				times: _result["highGamma"]["time"]
			}
			res.send({ lgData, hgData });
		}
	})





	router.get("/api/:subject/nifti", (req, res) => {
		let subject = req.params.subject;
		if (fs.existsSync(`./data/${subject}/info/reconstruction.nii`)) {
			res.sendFile(`reconstruction.nii`, {
				root: `./data/${subject}/info`
			})
		} else {
			res.status(204).end()

		}

	})

	//3D brain
	router.get("/api/:subject/brain3D_g", (req, res) => {
		let subject = req.params.subject;
		fs.readdir('./data', (err, subjects) => {
			if (subjects.indexOf(subject) > -1) {
				//Load the fbx file
				// res.set('Content-Type', 'model/fbx')
				if (fs.existsSync(`./data/${subject}/info/reconstruction.glb`)) {
					console.log("File exists")
					res.sendFile(`reconstruction.glb`, {
						root: `./data/${subject}/info`
					});
				}
			} else {
				console.log("subject not found");
			}
		});
	});

	//* PUT routes

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

			let returnObject = {}
			req.body.electrodeName.forEach((name, i) => {
				returnObject[name] = req.body.electrodePosition[i]
				return returnObject
			})
			fs.writeFile(`./data/${req.params.subject}/info/channels.json`, JSON.stringify(returnObject), (err) => console.log(err))

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

	//Notes
	router.put("/api/:subject/notes", (req, res) => {
		console.log(req.body.note)
		fs.writeFile(`./data/${req.params.subject}/info/notes.txt`, req.body.note, (err) => console.log(err))
	});

	return router;
};
export default routes;




	//TODO Multer uploads

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

