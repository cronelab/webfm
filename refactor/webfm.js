// ======================================================================== //
//
// webfm
// The WebFM server.
//
// ======================================================================== //


// Requires

var path = require( 'path' );

var optimist = require( 'optimist' )
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
                })
                .options( 'h', {
                    alias: 'help',
                    describe: 'Show this help message',
                    boolean: true,
                    default: false
                } );
var argv = optimist.argv;

var express = require( 'express' );


// Process argv

var port = argv.port;
var rootDir = path.resolve( argv.root );
var dataDir = path.resolve( argv.data );


// Set up server

var app = express();

app.get( '/', function( req, res ) {
    res.sendFile( path.join( rootDir, 'index.html' ) );
} );

// app.get( '/fm', ... )

// app.get( '/api', ... )

app.use( '/', express.static( rootDir ) );

app.listen( argv.port, function() {
    console.log( "Serving " + rootDir + " on " + argv.port + ":tcp" );
} );


//