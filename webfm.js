// ======================================================================== //
//
// webfm
// The WebFM server.
//
// ======================================================================== //

var fs = require("fs");
var path = require("path");

var express = require("express");

var async = require("async");

var jsonfile = require("jsonfile");
// Promise compatibility
var Promise = require("promise-polyfill");

// Object.assign polyfill
if (typeof Object.assign != "function") {
  Object.assign = function(target, varArgs) {
    // .length of function is 2
    "use strict";
    if (target == null) {
      // TypeError if undefined or null
      throw new TypeError("Cannot convert undefined or null to object");
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) {
        // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Process argv
var rootDir = path.resolve('./public');
var dataDir = path.resolve('./data');

// Set up server
var app = express();

// App globals
function rawBody(req, res, next) {
  req.setEncoding("utf8");
  req.rawBody = "";

  req.on("data", function(chunk) {
    req.rawBody += chunk;
  });
  req.on("end", function() {
    next();
  });
}

// Base static routes
// TODO Iffy re. html pages?
app.use("/", express.static(rootDir));

var serveConfig = function(configName) {
  return function(req, res) {
    // TODO Front-end config shouldn't be served from app source dir
    res.sendFile(`config/${configName}`, { root: __dirname });
  };
};

// Index routes
// var serveIndex = function(req, res) {
//   res.sendFile(path.join(rootDir, "index.html"));
// };

app.get("/index/config/online", serveConfig("fmonline.json"));

// app.get("/", serveIndex);
// app.get("/index", serveIndex);

// Functional map routes
var serveMap = function(req, res) {
  res.sendFile(path.join(rootDir, "map.html"));
};

// TODO Bad practice to have map.html just figure it out from path
// Should use template engine. This is janky af.

app.get("/map/config/ui", serveConfig("fmui.json"));
app.get("/map/config/online", serveConfig("fmonline.json"));
app.get("/map/config/tasks", serveConfig("tasks.json"));

// Generator

app.get("/map", serveMap);
app.get("/map/generate", serveMap);

// Load
app.get("/map/:subject/:record", serveMap);

// Online
app.get("/map/online", serveMap);
app.get("/map/online/:subject", serveMap); // TODO Necessary?
app.get("/map/online/:subject/:record", serveMap); // We get this from
// bci2k.js ...
// Data api

app.use(express.json());

//Let's just put this anywhere because NOTHING is in sync anymore
app.post("/saveHGValues", function(req, res) {
  console.log(req.body);
  fs.writeFile("test.json", req.body, err => {
    if (err) throw err;
  });
});

// TODO Make it so there can be multiple
var mapExtension = ".fm";
var bundleExtension = ".fmbundle";
var metadataFilename = ".metadata";

var dataPath = function(subject, record, dataset, kind) {
  if (!record) {
    return path.join(dataDir, subject);
  }
};

var getSubjectMetadata = function(subject, cb) {
  var metaPath = path.join(dataDir, subject, metadataFilename);

  // Try to open and parse the metadata file
  jsonfile.readFile(metaPath, function(err, metadata) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, metadata);
    return;
  });
};

var checkSubject = function(subject, cb) {
  var checkPath = path.join(dataDir, subject);

  fs.stat(checkPath, function(err, stats) {
    if (err) {
      // TODO We probably care about the details of the error, but
      // for now let's assume it isn't a subject.
      cb(null, false);
      return;
    }
    // Subject name should be a directory
    // TODO Should check a little more? Maybe for members?
    cb(null, stats.isDirectory());
  });
};

var checkRecord = function(subject, record, cb) {
  var checker = function(checkPath, checkKind) {
    return function(innerCB) {
      fs.stat(checkPath, function(err, stats) {
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

  async.parallel(checkOrder, function(err, results) {
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




// Add a new subject
// TODO Perhaps change this route; this is what comes to mind to start
app.put("/api/data/:subject", rawBody, function(req, res) {
  var errOut = function(code, msg) {
    console.log(msg);
    res.status(code).send(msg);
  };

  var subject = req.params.subject;

  // Check if this subject already exists
  checkSubject(subject, function(err, isSubject) {
    if (err) {
      // Based on how checkSubject is defined, this shouldn't happen
      errOut(
        500,
        'Error determining if "' +
          subject +
          '" is a subject: ' +
          JSON.stringify(err)
      );
      return;
    }

    if (isSubject) {
      // Subject already exists!
      errOut(405, 'Subject "' + subject + '" already exists.');
      return;
    }

    // Subject doesn't exist, so let's create it!
    var newSubjectDir = path.join(dataDir, subject);

    fs.mkdir(newSubjectDir, function(err) {
      if (err) {
        errOut(
          500,
          "Error creating new directory for " +
            subject +
            ": " +
            JSON.stringify(err)
        );
        return;
      }

      // We've created the directory, so let's create a metadata file

      var metadata = {
        subject: subject
      };

      if (req.rawBody != "") {
        // We were given some default metadata to include, so let's add it

        var bodyData = {};
        try {
          bodyData = JSON.parse(req.rawBody);
        } catch (err) {
          errOut(400, "Metadata could not be parsed: " + JSON.stringify(err));
          return;
        }

        // Copy bodyData into metadata
        // NOTE Object properties of bodyData are copied by reference,
        // so we'll be alright as long as bodyData isn't modified
        Object.assign(metadata, bodyData);
      }

      // Write it!
      var metadataPath = path.join(dataDir, subject, metadataFilename);
      jsonfile.writeFile(metadataPath, metadata, function(err) {
        if (err) {
          // Could not create record file
          errOut(
            500,
            'Could not create new metadata for "' +
              subject +
              '": ' +
              JSON.stringify(err)
          );
          return;
        }

        // Everything worked, and we made something!
        res.sendStatus(201);
      });
    });
  });
});

// Get entire record
app.get("/api/data/:subject/:record", function(req, res) {
  var subject = req.params.subject;
  var record = req.params.record;

  var errOut = function(code, msg) {
    console.log("[GET " + req.originalUrl + "] " + msg);
    res.status(code).send(msg);
  };

  checkRecord(subject, record, function(err, recordType) {
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
    jsonfile.readFile(recordPath, function(err, recordData) {
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
          var importPromise = function(relPath) {
            // Absolut-ize import path
            var absPath = path.normalize(path.join(dataDir, subject, relPath));

            return new Promise(function(resolve, reject) {
              jsonfile.readFile(absPath, function(err, data) {
                if (err) {
                  reject(err);
                  return;
                }
                resolve(data);
              });
            });
          };

          Promise.all(imports.map(importPromise)).then(function(importData) {
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

// Get entire dataset, if record is a bundle
app.get("/api/data/:subject/:record/:dataset", function(req, res) {
  // TODO ...
});

// Save a single-dataset record
// TODO or bundle
app.put("/api/data/:subject/:record", rawBody, function(req, res) {
  var errOut = function(code, msg) {
    console.log(msg);
    res.status(code).send(msg);
  };

  // TODO Should use a JSON body parser instead of this
  var bodyData = {};
  try {
    bodyData = JSON.parse(req.rawBody);
  } catch (err) {
    errOut(400, "Record data could not be parsed: " + JSON.stringify(err));
    return;
  }
  var subject = req.params.subject;
  var record = req.params.record;
  // First check if subject exists
  checkSubject(subject, function(err, isSubject) {
    if (err) {
      // Based on how checkSubject is defined, this shouldn't happen
      errOut(
        500,
        "Error determining if " +
          subject +
          " is a subject: " +
          JSON.stringify(err)
      );
      return;
    }

    var checkMetadata = function() {
      // If metadata exists, we want to reference it in our new record
      getSubjectMetadata(subject, function(err, metadata) {
        var createRecord = function(includeImport) {
          // TODO This procedure should be done if the client passes
          // in a flag in the HTTP header. For now, I'm entrusting
          // it to the client.

          // // Handle import inclusion

          // if ( includeImport ) {

          //     if ( !bodyData.hasOwnProperty( 'metadata' ) ) {
          //         // Need to create a metadata field
          //         bodyData['metadata'] = {};
          //     }

          //     // TODO Metadata location hardcoded (ok?)
          //     // TODO We're assuming no imports were already set. Should check.
          //     // TODO Should check that metadata field is an object
          //     bodyData['metadata']['_import'] = '../' + metadataFilename;
          // }

          // Check and see if there's already a record here
          // TODO RESTful guidelines says overwrite, but that has sketchy consequences here
          checkRecord(subject, record, function(err, recordType) {
            if (err) {
              // Based on how checkRecord is defined, this shouldn't happen
              errOut(
                500,
                "Error determining if " +
                  subject +
                  "/" +
                  record +
                  " is a record: " +
                  JSON.stringify(err)
              );
              return;
            }

            if (recordType != "none") {
              // Record already exists, so we have a problem
              errOut(
                405,
                "Record " + subject + "/" + record + " already exists."
              );
              return;
            }

            // Record doesn't exist, so we can make it!
            var recordPath = path.join(dataDir, subject, record + mapExtension);
            jsonfile.writeFile(recordPath, bodyData, function(err) {
              if (err) {
                // Could not create record file
                errOut(
                  500,
                  "Could not create new record: " + JSON.stringify(err)
                );
                return;
              }

              // Everything worked, and we made something!
              res.sendStatus(201);
            });
          });
        };

        if (err) {
          // No metadata, so don't link
          createRecord(false);
          return;
        }

        // We have metadata, so link
        createRecord(true);
      });
    };

    if (!isSubject) {
      // Not a subject; need to create new subject directory
      // TODO This could cause problems because of lack of metadata; should handle
      var newSubjectDir = path.join(dataDir, subject);

      fs.mkdir(newSubjectDir, function(err) {
        if (err) {
          errOut(
            500,
            "Error creating new directory for " +
              subject +
              ": " +
              JSON.stringify(err)
          );
          return;
        }

        checkMetadata();
      });

      return;
    }

    checkMetadata();
  });
});

// Computation api
// app.post( '/api/compute/identity', rawBody, function( req, res ) {
//
//   // Spawn a child process for the compute utility
//   var pyProcess = spawn( './compute/identity' );
//   var outData = '';
//
//   // Set up event handlers for the process
//   pyProcess.stdout.on( 'data', function( data ) {
//     outData += data;
//   } );
//   pyProcess.stdout.on( 'end', function() {
//     // Finished processing; send it!
//     res.status( 200 ).send( outData );
//   } );
//
//   // Start the process computing by passing it input
//   // TODO Don't need to actually parse
//   //pyProcess.stdin.write( JSON.stringify( req.body ) );
//   pyProcess.stdin.write( req.rawBody );
//   pyProcess.stdin.end();
//
// } );
//
// app.post( '/api/compute/hgfft', rawBody, function( req, res ) {
//
//   // Spawn a child process for the compute utility
//   var pyProcess = spawn( './compute/hgfft' );
//   var outData = '';
//
//   // Set up event handlers for the process
//   pyProcess.stdout.on( 'data', function( data ) {
//     outData += data;
//   } );
//   pyProcess.stdout.on( 'end', function() {
//     // Finished processing; send it!
//     res.status( 200 ).send( outData );
//   } );
//
//   // Start the process computing by passing it input
//   // TODO Don't need to actually parse
//   //pyProcess.stdin.write( JSON.stringify( req.body ) );
//   pyProcess.stdin.write( req.rawBody );
//   pyProcess.stdin.end();
//
// } );
var http = require("http");
http.createServer(app).listen(8080);