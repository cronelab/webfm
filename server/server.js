import fs from 'fs';
import path from 'path';
import express from 'express'
import formidable from 'formidable';
import async from 'async';
import jsonfile from 'jsonfile';
import base64 from 'node-base64-image';
import routes from './routes.js'
import config from '../webpack.config.js'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import merge from 'webpack-merge'
import webpack from 'webpack'

const app = express();

let newConfig = merge(config, {
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
});



if (process.env.NODE_ENV == "development") {
    const compiler = webpack(newConfig);
    app.use(webpackDevMiddleware(compiler, {
        noInfo: true
    }));
    app.use(webpackHotMiddleware(compiler));
} else {
    app.use('/', express.static('./dist'));

}
app.use("/", routes(express));

var rootDir = path.resolve('./public');
var dataDir = path.resolve('./data');
var uploadsDir = path.resolve('./uploads');

function rawBody(req, res, next) {

    req.setEncoding('utf8');
    req.rawBody = '';

    req.on('data', function (chunk) {
        req.rawBody += chunk;
    });
    req.on('end', function () {
        next();
    });
}

// app.use('/', express.static(rootDir));
// app.get('/', (req, res) => {
//     res.sendFile(path.join(rootDir, 'index.html'))
// });

var mapExtension = '.fm';
var metadataFilename = '.metadata';

const getSubjectMetadata = (subject, cb) => {

    var metaPath = path.join(dataDir, subject, metadataFilename);

    // Try to open and parse the metadata file
    jsonfile.readFile(metaPath, function (err, metadata) {
        if (err) {
            cb(err);
            return;
        }
        cb(null, metadata);
        return;
    });

}

const checkSubject = (subject, cb) => {

    const checkPath = path.join(dataDir, subject);

    fs.stat(checkPath, (err, stats) => {
        if (err) {
            cb(null, false);
            return;
        }
        cb(null, stats.isDirectory());
    });

}

const checkRecord = (subject, record, cb) => {

    const checker = (checkKind) => {
        return (innerCB) => {
            fs.stat(`./data/${subject}/${record}.fm`, (err, stats) => {
                console.log(stats)
                innerCB(null, checkKind == 'bundle' ? stats.isDirectory() : stats.isFile());
            });
        }
    }

    async.parallel({
        'map': checker('map')
    }, (err, results) => {
        // Must be a map
        cb(null, 'map');
    });
}


// Put new brain image data into .metadata
app.put('/api/brain/:subject', function (req, res) {


    var subject = req.params.subject;
    checkSubject(subject, function (err, isSubject) {
        getSubjectMetadata(subject, function (err, metadata) {
            var oldMetadata = metadata;
            if (err) {
                oldMetadata = {};
            }
            var newMetadata = Object.assign({}, oldMetadata);
            var form = formidable.IncomingForm();
            form.uploadDir = uploadsDir;
            form.on('file', function (field, file) {
                base64.encode(file.path, {
                    string: true,
                    local: true
                }, function (err, imageData) {
                    var imageExtension = path.extname(file.name);
                    newMetadata.brainImage = 'data:image/' + imageExtension + ';base64,' + imageData;
                    var metadataPath = path.join(dataDir, subject, metadataFilename);
                    jsonfile.writeFile(metadataPath, newMetadata, function (err) {});
                });
            });
            form.on('end', function () {
                res.sendStatus(201);
            });
            form.parse(req);
        });
    });
});

app.put('/api/geometry/:subject', function (req, res) {
    var subject = req.params.subject;
    checkSubject(subject, function (err, isSubject) {
        getSubjectMetadata(subject, function (err, metadata) {
            var oldMetadata = metadata;
            if (err) {
                oldMetadata = {};
            }
            var newMetadata = Object.assign({}, oldMetadata);
            if (req.headers['content-type'] === undefined) {
                errOut(400, 'No geometry content-type specified; cannot interpret.');
                return;
            }
            var reqContentType = req.headers['content-type'].split(';')[0];
            var writeMetadata = function (dataToWrite, onSuccess) {
                var metadataPath = path.join(dataDir, subject, metadataFilename);
                jsonfile.writeFile(metadataPath, dataToWrite, function (err) {
                    if (err) {
                        errOut(500, 'Could not update metadata for "' + subject + '": ' + JSON.stringify(err));
                        return;
                    }
                    if (onSuccess !== undefined) {
                        onSuccess();
                    }
                });
            };
            var handleJSONData = function (data, cb) {
                try {
                    newMetadata.sensorGeometry = JSON.parse(data);
                } catch (err) {
                    errOut(400, 'New geometry JSON could not be parsed: ' + JSON.stringify(err));
                    return;
                }
                writeMetadata(newMetadata, cb);
            };
            var handleCSVData = function (data, cb) {
                var newGeometry = {};
                var lines = data.split('\n');
                var entries = lines.map(function (line) {
                    return line.split(',');
                });
                for (var i = 0; i < entries.length; i++) {
                    var lineEntries = entries[i];
                    if (lineEntries.length < 3) {
                        continue;
                    }
                    var channelName = lineEntries[0];
                    var channelU = +lineEntries[1];
                    var channelV = +lineEntries[2];
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
                handleJSONData(req.rawBody, function () {
                    res.sendStatus(201);
                });
                return;
            }
            if (reqContentType == 'text/csv') {
                handleCSVData(req.rawBody, function () {
                    res.sendStatus(201);
                });
                return;
            }
            if (reqContentType == 'multipart/form-data') {
                var form = formidable.IncomingForm();
                form.uploadDir = uploadsDir;
                form.on('file', function (field, file) {
                    var fileExtension = path.extname(file.name);
                    if (fileExtension == '.json') {
                        fs.readFile(file.path, function (err, data) {
                            handleJSONData(data.toString());
                        });
                        return;
                    }
                    if (fileExtension == '.csv') {
                        fs.readFile(file.path, function (err, data) {
                            handleCSVData(data.toString());
                        });
                        return;
                    }
                });
                form.on('error', function (err) {});
                form.on('end', function () {
                    res.sendStatus(201);
                });
                form.parse(req);
                return;
            }
            errOut(400, 'Request content-type, "' + reqContentType + '", is not supported.');
        });
    });
});

app.put('/api/data/:subject', rawBody, function (req, res) {

    var subject = req.params.subject;

    checkSubject(subject, function (err, isSubject) {
        var newSubjectDir = path.join(dataDir, subject);
        fs.mkdir(newSubjectDir, function (err) {
            var metadata = {
                'subject': subject
            };
            if (req.rawBody != '') {
                var bodyData = {};
                try {
                    bodyData = JSON.parse(req.rawBody);
                } catch (err) {
                    return;
                }
                Object.assign(metadata, bodyData);
            }
            var metadataPath = path.join(dataDir, subject, metadataFilename);
            jsonfile.writeFile(metadataPath, metadata, function (err) {
                res.sendStatus(201);
            });
        });
    });
})


app.put('/api/data/:subject/:record', rawBody, function (req, res) {

    var bodyData = {};
    try {
        bodyData = JSON.parse(req.rawBody);
    } catch (err) {
        return;
    }

    var subject = req.params.subject;
    var record = req.params.record;

    checkSubject(subject, function (err, isSubject) {
        var checkMetadata = function () {
            getSubjectMetadata(subject, function (err, metadata) {
                var createRecord = function (includeImport) {
                    checkRecord(subject, record, function (err, recordType) {
                        var recordPath = path.join(dataDir, subject, record + mapExtension);
                        jsonfile.writeFile(recordPath, bodyData, function (err) {
                            res.sendStatus(201);
                        });
                    });
                };
                if (err) {
                    createRecord(false);
                    return;
                }
                createRecord(true);
            });
        };
        if (!isSubject) {
            var newSubjectDir = path.join(dataDir, subject);
            fs.mkdir(newSubjectDir, function (err) {
                checkMetadata();
            });
            return;
        }
        checkMetadata();
    });
});

app.listen(8080, function () {
    console.log("Serving " + rootDir + " on " + 8080 + ":tcp");
});