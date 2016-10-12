// ======================================================================== //
//
// webfm
// The WebFM server.
//
// ======================================================================== //


// Requires

var fs          = require( 'fs' );
var path        = require( 'path' );

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
var async       = require( 'async' );


// Process argv

var port    = argv.port;

var rootDir = path.resolve( argv.root );
var dataDir = path.resolve( argv.data );
var appDir  = path.resolve( argv.app );


// Set up server

var app = express();

app.get( '/', function( req, res ) {
    res.sendFile( path.join( rootDir, 'index.html' ) );
} );

// TODO Iffy re. html pages?
app.use( '/', express.static( rootDir ) );


// Configuration file routes

app.get( '/config/map/ui', function( req, res ) {
    res.sendFile( path.join( appDir, 'config', 'fmui.json' ) );
} );


// Functional map routes

app.get( '/map', function( req, res ) {
    res.sendFile( path.join( rootDir, 'map.html' ) );
} );


// Data api

// TODO Make it so there can be multiple
var mapExtension = '.fm';
var bundleExtension = '.fmbundle';

var dataPath = function( subject, record, dataset, kind ) {
    if ( !record ) {
        return path.join( dataDir, subject );
    }
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
        console.log( results );
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
            'uri'       : path.join( 'api', 'data', subject, record )
        };

        res.json( recordInfo );

        // TODO This should be exhaustive ... Right?
    } );

} );

// Get list of records for subject
app.get( '/api/list/:subject', function( req, res ) {

    fs.readdir(  )

} );

// Get list of subjects
app.get( '/api/list', function( req, res ) {

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



// 



// GO!

app.listen( argv.port, function() {
    console.log( "Serving " + rootDir + " on " + argv.port + ":tcp" );
} );


//