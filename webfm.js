// ======================================================================== //
//
// webfm
// The WebFM server.
//
// ======================================================================== //


// Requires

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

var express     = require( 'express' );
var bodyParser  = require( 'body-parser' );
var async       = require( 'async' );
var jsonfile    = require( 'jsonfile' );


// Process argv

var port    = argv.port;

var rootDir = path.resolve( argv.root );
var dataDir = path.resolve( argv.data );
var appDir  = path.resolve( argv.app );


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
        res.sendFile( path.join( appDir, 'config', configName ) );
    }
}


// Index routes

var serveIndex = function( req, res ) {
    res.sendFile( path.join( rootDir, 'index.html' ) );
}

// TODO For debugging
var onlineConfigName = 'fmonline_lennon.json'; // 'fmonline_griff.json';   // 'fmonline.json'

app.get( '/index/config/online',  serveConfig( onlineConfigName ) );

app.get( '/', serveIndex );
app.get( '/index', serveIndex );


// Functional map routes

var serveMap = function( req, res ) {
    res.sendFile( path.join( rootDir, 'map.html' ) );
}


// TODO Bad practice to have map.html just figure it out from path
// Should use template engine. This is janky af.

app.get( '/map/config/ui',      serveConfig( 'fmui.json' ) );
app.get( '/map/config/online',  serveConfig( onlineConfigName ) );

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

    var metaPath = path.join( dataDir, subject, '.metadata' );

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
            if ( metadata.brainImage === undefined ) {
                // TODO Better error code for this?
                errOut( 404, 'Brain image not specified for subject ' + subject );
                return;
            }

            res.status( 200 ).send( metadata.brainImage );

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

// Get entire record
app.get( '/api/data/:subject/:record', function( req, res ) {

    // TODO ...

} );

// Get entire dataset, if record is a bundle
app.get( '/api/data/:subject/:record/:dataset', function( req, res ) {

    // TODO ...

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



// GO!

app.listen( argv.port, function() {
    console.log( "Serving " + rootDir + " on " + argv.port + ":tcp" );
} );


//