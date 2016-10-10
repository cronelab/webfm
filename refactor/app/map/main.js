// ======================================================================== //
//
// main
// Main entry for WebFM viewer (map.html).
//
// ======================================================================== //


// REQUIRES

var path = require( 'path' );

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
var recordName      = query.record || undefined;

// Dataset
var dataBundle      = null;
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

var getRecordInfo = function( subject, record ) {
    // Wrap $.getJSON in a standard promise
    return new Promise( function( resolve, reject ) {
        var infoPath = path.join( 'api', 'info', subject, record );
        $.getJSON( infoPath )
            .done( resolve )
            .fail( function() {
                // TODO Get error infor from jquery object
                reject( 'Error loading JSON from: ' +  );
            } );
    } );
};

var unpackBundle = function( info ) {
    if ( recordInfo.isBundle ) {
        // Need to load bundle to identify first dataset
        bundle = new fmdata.DataBundle();
        return bundle.get( info.uri )
                        .then( function() {
                            // TODO Update UI with bundle displayGroup
                            // Pass along the URI of the first dataset
                            return Promise.resolve( bundle.uriForDataset( 0 ) );
                        } );
    } else {
        // If we're just a dataset, can simply resolve to datast URI
        return Promise.resolve( info.uri );
    }
}; 

if ( loadMode ) {

    getDataInfo( subjectID, recordName )
        .then( unpackBundle )
        .then( dataset.get );

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
