const path = require("path");
const fs = require("fs");
var async = require("async");
var jsonfile = require("jsonfile");
const loadJsonFile = require("load-json-file");
var mapExtension = ".fm";
var bundleExtension = ".fmbundle";

const dataDir = "./data";
var metadataFilename = ".metadata";

const getSubjectMetadata = async subject => {
    const metaPath = path.join(dataDir, subject, metadataFilename);
    let metadata = await loadJsonFile(metaPath);
    return metadata;
};

const getRecord = async (subject, record) => {
    const recordPath = path.join(dataDir, subject, record);
    let _record = await loadJsonFile(`${recordPath}.fm`);
    return _record;
};
var checkRecord = function (subject, record, cb) {
    var checker = function (checkPath, checkKind) {
        return function (innerCB) {
            fs.stat(checkPath, function (err, stats) {
                if (err) {
                    // We don't want to kick back an error, because that would
                    // short-circuit our parallel call
                    innerCB(null, false);
                    return;
                }
                // Check that the thing we found is the kind of thing we want
                innerCB(
                    null,
                    checkKind == "bundle" ? stats.isDirectory() : stats.isFile()
                );
            });
        };
    };

    var checkOrder = {
        map: checker(path.join(dataDir, subject, record + mapExtension), "map"),
        bundle: checker(
            path.join(dataDir, subject, record + bundleExtension),
            "bundle"
        )
    };

    async.parallel(checkOrder, function (err, results) {
        // This should ostensibly never happen.
        if (err) {
            cb(err);
            return;
        }
        // TODO More elegantly
        if (results.map && results.bundle) {
            console.log(
                "WARNING Both map and bundle exist with same name. Bundle takes precedence."
            );
        }
        // WOMP WOMP
        if (!results.map && !results.bundle) {
            cb(null, "none");
            return;
        }
        // Bundle
        if (results.bundle) {
            cb(null, "bundle");
            return;
        }
        // Must be a map
        cb(null, "map");
    });
};

module.exports = express => {
    const router = express.Router();

    // router.get("/map", (req, res) =>
    //     res.sendFile(path.join(__dirname, "/../public", "/map.html"))
    // );

    //     router.get("/", (req, res) =>
    //     res.sendFile(path.join(__dirname, "/../public", "/index.html"))
    // );
    // Get info on particular record.
    router.get("/api/info/:subject/:record", function (req, res) {
        var errOut = function (code, msg) {
            console.log(msg);
            res.status(code).send(msg);
        };

        var subject = req.params.subject;
        var record = req.params.record;

        // Check and see what kind of thing we are
        checkRecord(subject, record, function (err, recordType) {
            if (err) {
                // Couldn't determine for some reason
                errOut(500, "Couldn't determine record type: /" + subject + "/" + record);
                return;
            }

            if (recordType == "none") {
                // Not found
                errOut(404, "Record not found: /" + subject + "/" + record);
                return;
            }

            var recordInfo = {
                subject: subject,
                record: record,
                isBundle: recordType == "bundle",
                uri: path.join("/", "api", "data", subject, record)
            };

            res.json(recordInfo);

            // TODO This should be exhaustive ... Right?
        });
    });
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

    router.get("/api/data/:subject/:record", function (req, res) {
        var subject = req.params.subject;
        var record = req.params.record;

        var errOut = function (code, msg) {
            console.log("[GET " + req.originalUrl + "] " + msg);
            res.status(code).send(msg);
        };

        checkRecord(subject, record, function (err, recordType) {
            if (err) {
                errOut(
                    500,
                    "Error determining if " +
                    subject +
                    "/" +
                    record +
                    " is a record: " +
                    err
                );
                return;
            }

            if (recordType == "none") {
                errOut(404, "Record not found: " + subject + "/" + record);
                return;
            }

            if (recordType == "bundle") {
                errOut(501, "Bundle server not yet implemented.");
                return;
            }

            // recordType == 'map'

            // Load the record
            var recordPath = path.join(dataDir, subject, record + mapExtension);
            jsonfile.readFile(recordPath, function (err, recordData) {
                // Make a deep copy
                var sendData = JSON.parse(JSON.stringify(recordData));

                // Check for metadata imports
                if (recordData.metadata !== undefined) {
                    if (recordData.metadata["_import"] !== undefined) {
                        // Execute metadata imports

                        var imports = recordData.metadata["_import"];

                        // Put all imports on the same footing
                        if (!Array.isArray(imports)) {
                            imports = [imports];
                        }

                        // Create promises
                        var importPromise = function (relPath) {
                            // Absolut-ize import path
                            var absPath = path.normalize(path.join(dataDir, subject, relPath));

                            return new Promise(function (resolve, reject) {
                                jsonfile.readFile(absPath, function (err, data) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    resolve(data);
                                });
                            });
                        };

                        Promise.all(imports.map(importPromise)).then(function (importData) {
                            // Execute the imports on the metadata being sent
                            for (var i = 0; i < importData.length; i++) {
                                Object.assign(sendData.metadata, importData[i]);
                            }

                            // Unset the _import field
                            sendData.metadata["_import"] = undefined;

                            // Send the data!
                            res.status(200).send(JSON.stringify(sendData));
                        });
                    }
                }
            });
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