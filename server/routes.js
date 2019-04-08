const path = require("path");
const fs = require("fs");
var async = require("async");
var jsonfile = require("jsonfile");
const loadJsonFile = require("load-json-file");

const dataDir = "./data";
var metadataFilename = ".metadata";

const getSubjectMetadata = async subject => {
    const metaPath = path.join(dataDir, subject, metadataFilename);
    let metadata = await loadJsonFile(metaPath);
    return metadata;
};

const getRecord = async (subject, record) => {
    const recordPath = path.join(dataDir, subject, record);
    let _record = await loadJsonFile(recordPath);
    return _record;
};


module.exports = express => {
    const router = express.Router();

    // router.get("/map", (req, res) =>
    //     res.sendFile(path.join(__dirname, "/../public", "/map.html"))
    // );

    //     router.get("/", (req, res) =>
    //     res.sendFile(path.join(__dirname, "/../public", "/index.html"))
    // );

    //List of subjects
    // router.get("/api/subjects", (req, res) => {
    router.get("/api/list", (req, res) => {
        fs.readdir(dataDir, (err, subjects) => {
            res.status(200).json(subjects);
        });
    });

    //Geometry
    // router.get("/api/:subject/geometry", (req, res) => {
    router.get("/api/geometry/:subject", (req, res) => {
        let subject = req.params.subject;
        fs.readdir(dataDir, () => {
            getSubjectMetadata(subject)
                .then(metadata => {
                    res.status(200).send(metadata.sensorGeometry);
                })
                .catch(err => console.log(err));
        });
    });

    //Brain
    // router.get("/api/:subject/brain", (req, res) => {
        router.get("/api/brain/:subject/", (req, res) => {
        let subject = req.params.subject;
        fs.readdir(dataDir, (err, subjects) => {
            if (subjects.indexOf(subject) > -1) {
                //Load the jpg, if jpg doesn't exist, load data from the .metadata file
                // if (fs.existsSync(`${dataDir}/${subject}/${subject}.jpg`)) {
                //     res.sendFile(`${subject}.jpg`, {
                //         root: `${dataDir}/${subject}/`
                //     });
                // } else {
                    getSubjectMetadata(subject)
                        .then(metadata => {
                            // console.log(metadata.brainImage)
                            res.status(200).send(metadata.brainImage)
                        })
                        
                        .catch(err => console.log(err));
                // }
            } else {
                console.log("subject not found");
            }
        });
    });
    // router.get("/api/brain/:subject", function (req, res) {
    //     var subject = req.params.subject;

    //     // First check if subject exists
    //     checkSubject(subject, function (err, isSubject) {
    //         if (err) {
    //             // Based on how checkSubject is defined, this shouldn't happen
    //             errOut(
    //                 500,
    //                 "Error determining if " +
    //                 subject +
    //                 " is a subject: " +
    //                 JSON.stringify(err)
    //             );
    //             return;
    //         }

    //         if (!isSubject) {
    //             // Not a subject
    //             errOut(404, "Subject " + subject + " not found.");
    //             return;
    //         }

    //         // We know it's a valid subject, so check if we've got metadata
    //         getSubjectMetadata(subject, function (err, metadata) {
    //             if (err) {
    //                 // TODO Be more granular with error codes based on err
    //                 errOut(
    //                     500,
    //                     "Error loading metadata for " + subject + ": " + JSON.stringify(err)
    //                 );
    //                 return;
    //             }

    //             // We've got metadata, so check that we've got a brain image
    //             if (metadata.brainImage === undefined) {
    //                 // TODO Better error code for this?
    //                 errOut(418, assets.noBrainImage);
    //                 return;
    //             }

    //             res.status(200).send(metadata.brainImage);
    //         });
    //     });
    // });

    //List of records
    // router.get("/api/:subject/records", (req, res) => {
    router.get("/api/list/:subject/", (req, res) => {
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

    //Add new subject to the database
    router.put("/api/data/:subject", (req, res) => {
        let subject = req.params.subject;
        Record.find({
            identifier: subject
        }, (err, record) => {
            if (err) throw err;
            if (record.length) {
                console.log("Record already exists!");
            } else {
                let newRecord = new Record({
                    identifier: subject
                });
                newRecord.save();
            }
        });
    });

    //Add subjects geometry to the database
    router.put("/api/geometry/:subject", (req, res) => {
        var subject = req.params.subject;
        // First check if subject exists
        checkSubject(subject, function (err, isSubject) {
            if (!isSubject) {
                // Not a subject
                errOut(404, "Subject " + subject + " not found.");
                return;
            }
            // Next attempt to get the old metadata
            getSubjectMetadata(subject, function (err, metadata) {
                var oldMetadata = metadata;
                if (err) {
                    // TODO Check err details to determine if we failed because
                    // file doesn't exist or for some other reason; other reasons
                    // should probably return errors
                    oldMetadata = {};
                }
                var newMetadata = Object.assign({}, oldMetadata);
                var reqContentType = req.headers["content-type"].split(";")[0];
                var writeMetadata = function (dataToWrite, onSuccess) {
                    var metadataPath = path.join(dataDir, subject, metadataFilename);
                    jsonfile.writeFile(metadataPath, dataToWrite, function (err) {
                        if (onSuccess !== undefined) {
                            onSuccess();
                        }
                    });
                };
                var handleJSONData = function (data, cb) {
                    // We're given the new metadata straight in the body as JSON;
                    // just incorporate it
                    try {
                        newMetadata.sensorGeometry = JSON.parse(data);
                    } catch (err) {
                        return;
                    }

                    writeMetadata(newMetadata, cb);
                };

                var handleCSVData = function (data, cb) {
                    // We need to reformat the CSV data into JSON

                    var newGeometry = {};

                    // Split according to the CSV format
                    var lines = data.split("\n");
                    var entries = lines.map(function (line) {
                        return line.split(",");
                    });

                    // TODO Implement support for non-UV CSV coordinates
                    // var isUV = true;

                    // For each line
                    for (var i = 0; i < entries.length; i++) {
                        var lineEntries = entries[i];

                        // Ensure that we have the correct number of datapoints
                        if (lineEntries.length < 3) {
                            continue;
                        }

                        // Ensure that entries are the proper type
                        var channelName = lineEntries[0];
                        var channelU = +lineEntries[1];
                        var channelV = +lineEntries[2];
                        if (isNaN(channelU) || isNaN(channelV)) {
                            continue;
                        }

                        // Add the new entry
                        newGeometry[channelName] = {
                            u: channelU,
                            v: channelV
                        };
                    }
                    // Write the newly parsed geometry
                    newMetadata.sensorGeometry = newGeometry;
                    writeMetadata(newMetadata, cb);
                };

                if (reqContentType == "application/json") {
                    // Our body is raw JSON, which we know how to handle
                    handleJSONData(req.rawBody, function () {
                        // On success ...
                        res.sendStatus(201);
                    });
                    return;
                }

                if (reqContentType == "text/csv") {
                    // Our body is raw CSV, which we know how to handle
                    handleCSVData(req.rawBody, function () {
                        // On success ...
                        res.sendStatus(201);
                    });
                    return;
                }

                if (reqContentType == "multipart/form-data") {
                    // We need to load up the file, then deal with the contents
                    var form = formidable.IncomingForm();
                    form.uploadDir = uploadsDir;

                    form.on("file", function (field, file) {
                        // TODO Remove log?
                        console.log(
                            'Received file "' +
                            file.name +
                            '" for field "' +
                            field +
                            '" at path: ' +
                            file.path
                        );
                        // How we process the file depends on the extension
                        var fileExtension = path.extname(file.name);
                        if (fileExtension == ".json") {
                            // Our file data is just JSON, which we can handle
                            // TODO Should move parsing out of called method, so that
                            // it can be handled by jsonfile?
                            fs.readFile(file.path, function (err, data) {
                                // Now, just call our normal handler
                                handleJSONData(data.toString());
                            });
                            return;
                        }
                        if (fileExtension == ".csv") {
                            // Similar to above: our file is just CSV, which we can handle
                            fs.readFile(file.path, function (err, data) {
                                // Now, just call our normal handler
                                handleCSVData(data.toString());
                            });
                            return;
                        }
                    });

                    form.on("error", function (err) {
                        console.log(
                            "Error processing geometry files: " + JSON.stringify(err)
                        );
                    });

                    form.on("end", function () {
                        // TODO Need to verify that onend only gets called when successful
                        res.sendStatus(201);
                    });
                    form.parse(req);
                    return;
                }
            });
        });
    });

    //Add subjects brain image to the databse
    router.post("/api/brain/:subject", (req, res) => {
        var subject = req.params.subject;
        let imageFile = req.files.file;
        Record.find({
            identifier: subject
        }, (err, record) => {
            if (err) throw err;
            record[0].brainImage = imageFile.data;
            record[0].save();
        });
    });

    return router;
};