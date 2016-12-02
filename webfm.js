// ======================================================================== //
//
// webfm
// The WebFM server.
//
// ======================================================================== //


// Requires

var assets      = require( './assets' );

var fs          = require( 'fs' );
var path        = require( 'path' );

var spawn       = require( 'child_process' ).spawn;

var optimist    = require( 'optimist' )
                    .usage( 'Web-based functional map server.\nUsage: $0' )
                    .options( 'p', {
                        alias: 'port',
                        describe: 'TCP port to host server on',
                        default: 54321
                    } )
                    .options( 'r', {
                        alias: 'root',
                        describe: 'Directory to use as web root',
                        default: './public'
                    } )
                    .options( 'd', {
                        alias: 'data',
                        describe: 'Directory for data hive',
                        default: './data'
                    } )
                    .options( 'u', {
                        alias: 'uploads',
                        describe: 'Directory for storing file uploads',
                        default: './uploads'
                    } )
                    .options( 'a', {
                        alias: 'app',
                        describe: 'Directory for application scripts',
                        default: './app'
                    } )
                    .options( 'h', {
                        alias: 'help',
                        describe: 'Show this help message',
                        boolean: true,
                        default: false
                    } );
var argv        = optimist.argv;

if ( argv.help ) {
    optimist.showHelp();
    process.exit( 0 );
}

var express     = require( 'express' );
var bodyParser  = require( 'body-parser' );
var formidable  = require( 'formidable' );

var async       = require( 'async' );

var jsonfile    = require( 'jsonfile' );
var base64      = require( 'node-base64-image' );


// Process argv

var port        = argv.port;

var rootDir     = path.resolve( argv.root );
var dataDir     = path.resolve( argv.data );
var uploadsDir  = path.resolve( argv.uploads );
var appDir      = path.resolve( argv.app );


// Set up server

var app = express();


// App globals

function rawBody( req, res, next ) {

    req.setEncoding( 'utf8' );
    req.rawBody = '';

    req.on( 'data', function( chunk ) {
        req.rawBody += chunk;
    } );
    req.on( 'end', function() {
        next();
    } );

}

// Base static routes

// TODO Iffy re. html pages?
app.use( '/', express.static( rootDir ) );

var serveConfig = function( configName ) {
    return function( req, res ) {
        // TODO Front-end config shouldn't be served from app source dir
        res.sendFile( path.join( appDir, 'config', configName ) );
    }
}


// Index routes

var serveIndex = function( req, res ) {
    res.sendFile( path.join( rootDir, 'index.html' ) );
}

app.get( '/index/config/online',  serveConfig( 'fmonline.json' ) );

app.get( '/', serveIndex );
app.get( '/index', serveIndex );


// Functional map routes

var serveMap = function( req, res ) {
    res.sendFile( path.join( rootDir, 'map.html' ) );
}


// TODO Bad practice to have map.html just figure it out from path
// Should use template engine. This is janky af.

app.get( '/map/config/ui',      serveConfig( 'fmui.json' ) );
app.get( '/map/config/online',  serveConfig( 'fmonline.json' ) );

// Generator
app.get( '/map', serveMap );
app.get( '/map/generate', serveMap );

// Load
app.get( '/map/:subject/:record', serveMap );

// Online
app.get( '/map/online', serveMap );
app.get( '/map/online/:subject', serveMap );            // TODO Necessary?
app.get( '/map/online/:subject/:record', serveMap );    // We get this from
                                                        // bci2k.js ...


// Data api

// TODO Make it so there can be multiple
var mapExtension        = '.fm';
var bundleExtension     = '.fmbundle';
var metadataFilename    = '.metadata';

var dataPath = function( subject, record, dataset, kind ) {
    if ( !record ) {
        return path.join( dataDir, subject );
    }
}

var getSubjectMetadata = function( subject, cb ) {

    var metaPath = path.join( dataDir, subject, metadataFilename );

    // Try to open and parse the metadata file
    jsonfile.readFile( metaPath, function( err, metadata ) {
        if ( err ) {
            cb( err );
            return;
        }
        cb( null, metadata );
        return;
    } );

}

var checkSubject = function( subject, cb ) {
    
    var checkPath = path.join( dataDir, subject );

    fs.stat( checkPath, function( err, stats ) {
        if ( err ) {
            // TODO We probably care about the details of the error, but
            // for now let's assume it isn't a subject.
            cb( null, false );
            return;
        }
        // Subject name should be a directory
        // TODO Should check a little more? Maybe for members?
        cb( null, stats.isDirectory() );
    } );

}

var checkRecord = function( subject, record, cb ) {

    var checker = function( checkPath, checkKind ) {
        return function( innerCB ) {
            fs.stat( checkPath, function( err, stats ) {
                if ( err ) {
                    // We don't want to kick back an error, because that would
                    // short-circuit our parallel call
                    innerCB( null, false );
                    return;
                }
                // Check that the thing we found is the kind of thing we want
                innerCB( null, checkKind == 'bundle' ? stats.isDirectory() : stats.isFile() );
            } );
        }
    }

    var checkOrder = {
        'map':      checker( path.join( dataDir, subject, record + mapExtension ), 'map' ),
        'bundle':   checker( path.join( dataDir, subject, record + bundleExtension ), 'bundle' )
    };

    async.parallel( checkOrder, function( err, results ) {
        // This should ostensibly never happen.
        if ( err ) {
            cb( err );
            return;
        }
        // TODO More elegantly
        if ( results.map && results.bundle ) {
            console.log( 'WARNING Both map and bundle exist with same name. Bundle takes precedence.' );
        }
        // WOMP WOMP
        if ( (!results.map) && (!results.bundle) ) {
            cb( null, 'none' );
            return;
        }
        // Bundle
        if ( results.bundle ) {
            cb( null, 'bundle' );
            return;
        }
        // Must be a map
        cb( null, 'map' );
    } );

}

// Get info on particular record.
app.get( '/api/info/:subject/:record', function( req, res ) {

    var errOut = function( code, msg ) {
        console.log( msg );
        res.status( code ).send( msg );
    }

    var subject     = req.params.subject;
    var record      = req.params.record;

    // Check and see what kind of thing we are
    checkRecord( subject, record, function( err, recordType ) {
        if ( err ) {    // Couldn't determine for some reason
            errOut( 500, "Couldn't determine record type: /" + subject + "/" + record );
            return;
        }

        if ( recordType == 'none' ) {   // Not found
            errOut( 404, "Record not found: /" + subject + "/" + record );
            return;
        }

        var recordInfo = {
            'subject'   : subject,
            'record'    : record,
            'isBundle'  : recordType == 'bundle',
            'uri'       : path.join( '/', 'api', 'data', subject, record )
        };

        res.json( recordInfo );

        // TODO This should be exhaustive ... Right?
    } );

} );

// Get list of subjects
app.get( '/api/list', function( req, res ) {

    var errOut = function( code, msg ) {
        console.log( msg );
        res.status( code ).send( msg );
    }

    // Get all members of the data directory
    fs.readdir( dataDir, function( err, entries ) {

        if ( err ) {
            errOut( 500, 'Could not read data directory contents: ' + JSON.stringify( err ) );
            return;
        }

        // Oh my god I'm currying.
        var checkerForEntry = function( entry ) {
            return function( cb ) {
                checkSubject( entry, cb );
            };
        }

        async.parallel( entries.map( checkerForEntry ), function( err, results ) {

            if ( err ) {
                // TODO This does die if an error is thrown, but checkSubject
                // doesn't so we cool. Probably.
                errOut( 500, 'Unable to obtain subject list: ' + JSON.stringify( err ) );
                return;
            }

            // Pull out only the entries that passed checkSubject
            var goodEntries = entries.filter( function( e, ie ) {
                return results[ie];
            } );

            // It's away!
            res.status( 200 ).json( goodEntries );

        } );

    } );

} );

// Get list of records for subject
app.get( '/api/list/:subject', function( req, res ) {

    var errOut = function( code, msg ) {
        console.log( msg );
        res.status( code ).send( msg );
    }

    var subject     = req.params.subject;
    var subjectDir  = path.join( dataDir, subject );

    // Get all members of the subject's directory
    fs.readdir( subjectDir, function( err, entries ) {

        if ( err ) {
            errOut( 500, 'Could not read data directory for subject ' + subject + ': ' + JSON.stringify( err ) );
            return;
        }

        // Curry +
        var checkerForEntry = function( entry ) {
            // Record name should be before the '.'
            var record = entry.split( '.' )[0];
            return function( cb ) {
                checkRecord( subject, record, cb );
            };
        }

        async.parallel( entries.map( checkerForEntry ), function( err, results ) {

            if ( err ) {
                // TODO This does die if an error is thrown, but checkSubject
                // doesn't so we cool. Probably.
                errOut( 500, 'Unable to obtain record list: ' + JSON.stringify( err ) );
                return;
            }

            // Pull out only the entries that passed checkSubject
            var goodEntries = entries.filter( function( e, ie ) {
                return !( results[ie] == 'none' );
            } );

            // Entries are filenames, so find out just their record names
            var goodRecords = goodEntries.map( function( e ) {
                return e.split( '.' )[0];
            } );

            // It's away!
            res.status( 200 ).json( goodRecords );

        } );

    } );

} );

// Get subject brain image data from .metadata
app.get( '/api/brain/:subject', function( req, res ) {

    var errOut = function( code, msg ) {
        // TODO Special case cause 418s are huge; must fix
        if ( code == 418 ) {
            console.log( "I'm a teapot." );
        } else {
            console.log( msg );
        }
        res.status( code ).send( msg );
    }

    var subject = req.params.subject;

    // First check if subject exists
    checkSubject( subject, function( err, isSubject ) {
        
        if ( err ) {
            // Based on how checkSubject is defined, this shouldn't happen
            errOut( 500, 'Error determining if ' + subject + ' is a subject: ' + JSON.stringify( err ) );
            return;
        }

        if ( !isSubject ) {
            // Not a subject
            errOut( 404, 'Subject ' + subject + ' not found.' );
            return;
        }

        // We know it's a valid subject, so check if we've got metadata
        getSubjectMetadata( subject, function( err, metadata ) {

            if ( err ) {
                // TODO Be more granular with error codes based on err
                errOut( 500, 'Error loading metadata for ' + subject + ': ' + JSON.stringify( err ) );
                return;
            }

            // We've got metadata, so check that we've got a brain image
            if ( metadata.brainImage === undefined ) {
                // TODO Better error code for this?
                errOut( 418, assets.noBrainImage );
                return;
            }

            res.status( 200 ).send( metadata.brainImage );

        } );

    } );

} );

// Put a brain image to 
app.put( '/api/brain/:subject', function( req, res ) {

    var errOut = function( code, msg ) {
        // TODO Special case cause 418s are huge; must fix
        if ( code == 418 ) {
            console.log( "I'm a teapot." );
        } else {
            console.log( msg );
        }
        res.status( code ).send( msg );
    }

    var subject = req.params.subject;

    // First check if subject exists
    checkSubject( subject, function( err, isSubject ) {

        if ( err ) {
            // Based on how checkSubject is defined, this shouldn't happen
            errOut( 500, 'Error determining if "' + subject + '" is a subject: ' + JSON.stringify( err ) );
            return;
        }

        if ( !isSubject ) {
            // Not a subject
            errOut( 404, 'Subject "' + subject + '" not found.' );
            return;
        }

        // Next get the existing metadata
        getSubjectMetadata( subject, function( err, metadata ) {

            var oldMetadata = metadata;

            if ( err ) {
                // TODO Check err details to determine if we failed because
                // file doesn't exist or for some other reason; other reasons
                // should probably return errors
                oldMetadata = {};
            }

            var newMetadata = Object.assign( {}, oldMetadata );

            // Prepare form parser to update the metadata

            var form = formidable.IncomingForm();
            form.uploadDir = uploadsDir;

            form.on( 'file', function( field, file ) {
                
                console.log( 'Received file "' + file.name + '" for field "' + field + '" at path: ' + file.path );
                
                // Process the file
                base64.encode( file.path, {
                    string: true,
                    local: true
                }, function( err, imageData ) {

                    if ( err ) {
                        // Could not be serialized
                        errOut( 500, 'Could not serialize uploaded image.' );
                        return;
                    }

                    // Generate the new metadata entry
                    var imageExtension = path.extname( file.path );
                    newMetadata.brainImage = 'data:image/' + imageExtension + ';base64,' + imageData;

                    // Save the new metadata
                    var metadataPath = path.join( dataDir, subject, metadataFilename );
                    jsonfile.writeFile( metadataPath, newMetadata, function( err ) {

                        if ( err ) {
                            // Could not create record file
                            errOut( 500, 'Could not update metadata for "' + subject + '": ' + JSON.stringify( err ) );
                            return;
                        }

                        // Everything worked, and we made something!
                        // res.sendStatus( 201 );

                    } );

                } );

            } );

            form.on( 'error', function( err ) {
                console.log( 'Error uploading brain image files: ' + JSON.stringify( err ) );
            } );

            form.on( 'end', function() {
                // TODO Check if end only gets called when successful
                res.sendStatus( 201 );
            } );

            form.parse( req );

        } );

    } );

} );

// Get subject sensor geometry data from .metadata
// TODO Having to call both this and the above seems like a lot of extra
// serialization / deserialization work ...
app.get( '/api/geometry/:subject', function( req, res ) {

    var errOut = function( code, msg ) {
        console.log( msg );
        res.status( code ).send( msg );
    }

    var subject = req.params.subject;

    // First check if subject exists
    checkSubject( subject, function( err, isSubject ) {
        
        if ( err ) {
            // Based on how checkSubject is defined, this shouldn't happen
            errOut( 500, 'Error determining if ' + subject + ' is a subject: ' + JSON.stringify( err ) );
            return;
        }

        if ( !isSubject ) {
            // Not a subject
            errOut( 404, 'Subject ' + subject + ' not found.' );
            return;
        }

        // We know it's a valid subject, so check if we've got metadata
        getSubjectMetadata( subject, function( err, metadata ) {

            if ( err ) {
                // TODO Be more granular with error codes based on err
                errOut( 500, 'Error loading metadata for ' + subject + ': ' + JSON.stringify( err ) );
                return;
            }

            // We've got metadata, so check that we've got a brain image
            if ( metadata.sensorGeometry === undefined ) {
                // TODO Better error code for this?
                errOut( 404, 'Sensor geometry not specified for subject ' + subject );
                return;
            }

            res.status( 200 ).send( metadata.sensorGeometry );

        } );

    } );

} );

// Get list of datasets in a specific record
app.get( '/api/list/:subject/:record', function( req, res ) {

    // TODO ...

} );

// TODO Get entire subject metadata?
// Unsure what correct behavior is
/*
api.get( '/api/data/:subject', function( req, res ) {

} );
*/

// Add a new subject
// TODO Perhaps change this route; this is what comes to mind to start
app.put( '/api/data/:subject', rawBody, function( req, res ) {

    var errOut = function( code, msg ) {
        console.log( msg );
        res.status( code ).send( msg );
    }

    var subject = req.params.subject;

    // Check if this subject already exists
    checkSubject( subject, function( err, isSubject ) {

        if ( err ) {
            // Based on how checkSubject is defined, this shouldn't happen
            errOut( 500, 'Error determining if "' + subject + '" is a subject: ' + JSON.stringify( err ) );
            return;
        }

        if ( isSubject ) {
            // Subject already exists!
            errOut( 405, 'Subject "' + subject + '" already exists.' );
            return;
        }

        // Subject doesn't exist, so let's create it!
        var newSubjectDir = path.join( dataDir, subject );

        fs.mkdir( newSubjectDir, function( err ) {

            if ( err ) {
                errOut( 500, 'Error creating new directory for ' + subject + ': ' + JSON.stringify( err ) );
                return;
            }

            // We've created the directory, so let's create a metadata file

            var metadata = {
                'subject': subject
            };

            if ( req.rawBody != '' ) {
                // We were given some default metadata to include, so let's add it

                var bodyData = {};
                try {
                    bodyData = JSON.parse( req.rawBody );
                } catch ( err ) {
                    errOut( 400, 'Metadata could not be parsed: ' + JSON.stringify( err ) );
                    return;
                }

                // Copy bodyData into metadata
                // NOTE Object properties of bodyData are copied by reference,
                // so we'll be alright as long as bodyData isn't modified
                Object.assign( metadata, bodyData );

            }

            // Write it!
            var metadataPath = path.join( dataDir, subject, metadataFilename );
            jsonfile.writeFile( metadataPath, metadata, function( err ) {

                if ( err ) {
                    // Could not create record file
                    errOut( 500, 'Could not create new metadata for "' + subject + '": ' + JSON.stringify( err ) );
                    return;
                }

                // Everything worked, and we made something!
                res.sendStatus( 201 );

            } );

        } );

    } );

} )

// Get entire record
app.get( '/api/data/:subject/:record', function( req, res ) {

    // TODO ...

} );

// Get entire dataset, if record is a bundle
app.get( '/api/data/:subject/:record/:dataset', function( req, res ) {

    // TODO ...

} );

// Save a single-dataset record
// TODO or bundle
app.put( '/api/data/:subject/:record', rawBody, function( req, res ) {

    var errOut = function( code, msg ) {
        console.log( msg );
        res.status( code ).send( msg );
    }

    // TODO Should use a JSON body parser instead of this
    var bodyData = {};
    try {
        bodyData = JSON.parse( req.rawBody );
    } catch ( err ) {
        errOut( 400, 'Record data could not be parsed: ' + JSON.stringify( err ) );
        return;
    }

    var subject = req.params.subject;
    var record = req.params.record;

    // First check if subject exists
    checkSubject( subject, function( err, isSubject ) {
        
        if ( err ) {
            // Based on how checkSubject is defined, this shouldn't happen
            errOut( 500, 'Error determining if ' + subject + ' is a subject: ' + JSON.stringify( err ) );
            return;
        }

        var checkMetadata = function() {

            // If metadata exists, we want to reference it in our new record
            getSubjectMetadata( subject, function( err, metadata ) {

                var createRecord = function( includeImport ) {

                    // Handle import inclusion

                    if ( includeImport ) {

                        if ( !bodyData.hasOwnProperty( 'metadata' ) ) {
                            // Need to create a metadata field
                            bodyData['metadata'] = {};
                        }

                        // TODO Metadata location hardcoded (ok?)
                        // TODO We're assuming no imports were already set. Should check.
                        // TODO Should check that metadata field is an object
                        bodyData['metadata']['_import'] = './' + metadataFilename;
                    }

                    // Check and see if there's already a record here
                    // TODO RESTful guidelines says overwrite, but that has sketchy consequences here
                    checkRecord( subject, record, function( err, recordType ) {

                        if ( err ) {
                            // Based on how checkRecord is defined, this shouldn't happen
                            errOut( 500, 'Error determining if ' + subject + '/' + record + ' is a record: ' + JSON.stringify( err ) );
                            return;
                        }

                        if ( recordType != 'none' ) {
                            // Record already exists, so we have a problem
                            errOut( 405, 'Record ' + subject + '/' + record + ' already exists.' );
                            return;
                        }

                        // Record doesn't exist, so we can make it!
                        var recordPath = path.join( dataDir, subject, record + mapExtension );
                        jsonfile.writeFile( recordPath, bodyData, function( err ) {

                            if ( err ) {
                                // Could not create record file
                                errOut( 500, 'Could not create new record: ' + JSON.stringify( err ) );
                                return;
                            }

                            // Everything worked, and we made something!
                            res.sendStatus( 201 );

                        } );

                    } );

                };

                if ( err ) {
                    // No metadata, so don't link
                    createRecord( false );
                    return;
                }

                // We have metadata, so link
                createRecord( true );

            } );

        };

        if ( !isSubject ) {
            // Not a subject; need to create new subject directory
            // TODO This could cause problems because of lack of metadata; should handle
            var newSubjectDir = path.join( dataDir, subject );

            fs.mkdir( newSubjectDir, function( err ) {

                if ( err ) {
                    errOut( 500, 'Error creating new directory for ' + subject + ': ' + JSON.stringify( err ) );
                    return;
                }

                checkMetadata();

            } );

            return;
        }

        checkMetadata();

    } );

} );


// Computation api

app.post( '/api/compute/identity', rawBody, function( req, res ) {

    // Spawn a child process for the compute utility
    var pyProcess = spawn( './compute/identity' );
    var outData = '';

    // Set up event handlers for the process
    pyProcess.stdout.on( 'data', function( data ) {
        outData += data;
    } );
    pyProcess.stdout.on( 'end', function() {
        // Finished processing; send it!
        res.status( 200 ).send( outData );
    } );

    // Start the process computing by passing it input
    // TODO Don't need to actually parse
    //pyProcess.stdin.write( JSON.stringify( req.body ) );
    pyProcess.stdin.write( req.rawBody );
    pyProcess.stdin.end();

} );

app.post( '/api/compute/hgfft', rawBody, function( req, res ) {

    // Spawn a child process for the compute utility
    var pyProcess = spawn( './compute/hgfft' );
    var outData = '';

    // Set up event handlers for the process
    pyProcess.stdout.on( 'data', function( data ) {
        outData += data;
    } );
    pyProcess.stdout.on( 'end', function() {
        // Finished processing; send it!
        res.status( 200 ).send( outData );
    } );

    // Start the process computing by passing it input
    // TODO Don't need to actually parse
    //pyProcess.stdin.write( JSON.stringify( req.body ) );
    pyProcess.stdin.write( req.rawBody );
    pyProcess.stdin.end();

} );



// GO!

app.listen( argv.port, function() {
    console.log( "Serving " + rootDir + " on " + argv.port + ":tcp" );
} );


//