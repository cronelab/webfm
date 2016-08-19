// ======================================================================== //
//
// main
// Main entry for WebFM viewer (map.html).
//
// ======================================================================== //


// REQUIRES

var $ = require( 'jquery' );
var d3 = require( 'd3' );

// Old way of doing horizon charts
// var horizon = require( '../lib/d3-horizon-chart.js' );

// New kludge
d3.horizon = require( '../lib/horizon' );

var bci2k = require( '../lib/bci2k' );

var cronelib = require( '../lib/cronelib' );
var fmstat = require( './fmstat' );
var fmonline = require( './fmonline' );


// MEAT

// Initialization

// Parse out URL query string
var query = cronelib.parseQuery( window.location.search );

var generateMode    = ( query.generate == 'yes' );
var onlineMode      = ( query.online == 'yes' );
// Resolve mode conflict
if ( generateMode && onlineMode ) {
    // Generate loses
    generateMode = false;
}
var subjectID       = query.subject || undefined;
var datasetName     = query.dataset || undefined;

// Dataset
var fmData = null;

// UI
var subjectDisplayName = '';
var channelNames = [];
var valueUnits = 1.0;

var startTime = 0.0;

// Load UI config
var uiConfig = {};
$.getJSON( 'config/map.json' )
    .done( function( data ) {
        uiConfig = data;
        // TODO Update UI using new config data
    } );


// Set up online components, if necessary

var onlineManager = null;

if ( onlineMode ) {

    onlineManager = new fmonline.OnlineManager();
    
    onlineManager.onproperties = function( properties ) {

        // ...
    
    };

    onlineManager.onsubjectinfo = function( subjectInfo ) {

    };

    onlineManager.ondata = function( data ) {
        
        // ..

    };

}


//
