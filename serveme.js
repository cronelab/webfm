// serveme.js
// The simplest possible web server

var path = require( 'path' );

var express = require( 'express' );
var app = express();

var port = process.argv[2] || 54321;

var dir = __dirname;
if ( process.argv[3] ) {
    dir = path.resolve( process.argv[3] );
}

app.get( '/', function( req, res ) {
    res.sendFile( path.join( dir, 'index.html' ) );
} );

app.use( '/', express.static( dir ) );

app.listen( port, function() {
    console.log("Serving " + dir + " on " + port);
} );