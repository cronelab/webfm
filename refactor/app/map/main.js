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
var fmui = require( './fmui' );
var fmgen = require( './fmgen' );
var fmdata = require( './fmdata' );


// MEAT

// Initialization

// Parse out URL query string
var query = cronelib.parseQuery( window.location.search );

// Determine the correct operation mode
var modeString = query.mode || undefined;
var generateMode    = false;
var onlineMode      = false;
var loadMode        = false;
if ( modeString.search( 'generate' ) >= 0 ) {
    generateMode = true;
} else if ( modeString.search( 'online' ) >= 0 ) {
    onlineMode = true;
} else {
    loadMode = true;
}

// TODO ?
var subjectID       = query.subject || undefined;
var datasetName     = query.dataset || undefined;

// Dataset
var dataset         = new fmdata.Dataset();

// UI
var uiManager = new fmui.InterfaceManager();
uiManager.loadConfig( 'config/map.json' );


// DATA SOURCE SET-UP

var dataSource = null;

// Online mode

if ( onlineMode ) {

    dataSource = new fmonline.OnlineDataSource();

    // Wire to common routines
    dataSource.onproperties = updateProperties;
    dataSource.ontrial = ingestTrial;

    dataSource.connect();

}

// Generator mode

if ( generateMode ) {

    dataSource = new fmgen.GeneratorDataSource();

    dataSource.onproperties = updateProperties;
    dataSource.ontrial = ingestTrial;

    dataSource.start();

}

// Load mode

if ( loadMode ) {

    // TODO
    var dataURI = '';
    dataset.load( dataURI )
            .then( function( data ) {
                // TODO
            } );
            .catch( function( reason ) {
                // TODO
            } );

}


// COMMON ROUTINES

// Property registration

var updateProperties = function( properties ) {
    
    uiManager.showIcon( 'transfer' );

    // TODO Put in uiManager?
    subjectDisplayName = properties.subjectName;
    taskDisplayName = properties.taskName;
    channelNames = properties.channels;
    valueUnits = properties.valueUnits;

    uiManager.hideIcon( 'transfer' );

}

// Trial ingestion

var ingestTrial = function( trialData ) {
    
    uiManager.showIcon( 'transfer' );

    // ...

    uiManager.hideIcon( 'transfer' );

};



//
