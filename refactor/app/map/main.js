// ======================================================================== //
//
// map/main
// Main entry for WebFM viewer (map.html).
//
// ======================================================================== //


// REQUIRES

var path        = require( 'path' );

var $           = require( 'jquery' );
var d3          = require( 'd3' );

// var horizon  = require( '../lib/d3-horizon-chart.js' ); // Old way of doing
                                                           // horizon charts
d3.horizon      = require( '../lib/horizon' );             // New kludge

var bci2k       = require( '../lib/bci2k' );

var cronelib    = require( '../lib/cronelib' );

var fmstat      = require( './fmstat' );
var fmonline    = require( './fmonline' );
var fmui        = require( './fmui' );
var fmgen       = require( './fmgen' );
var fmdata      = require( './fmdata' );


// MEAT

// Initialization

var pathComponents  = window.location.pathname.split( '/' );

var modeString      = pathComponents[3] || 'generate';

var generateMode    = modeString == 'generate';
var onlineMode      = modeString == 'online';
var loadMode        = (! (generateMode || onlineMode) );

var subjectID       = undefined;
var recordName      = undefined;

if ( loadMode ) {
    subjectID       = pathComponents[3] || undefined;
    recordName      = pathComponents[4] || undefined;
}



// Dataset
var dataBundle      = null;
var dataset         = new fmdata.Dataset();

// UI
var uiManager       = new fmui.InterfaceManager();
uiManager.loadConfig( '../config/map/ui' );


// DATA SOURCE SET-UP

var dataSource = null;

if ( onlineMode ) {     // Using BCI2000Web over the net

    dataSource = new fmonline.OnlineDataSource();

    // Wire to common routines
    dataSource.onproperties     = updateProperties;
    dataSource.ontrial          = ingestTrial;

    dataSource.connect();

}

if ( generateMode ) {   // Using an offline signal generator

    dataSource = new fmgen.GeneratorDataSource();

    // Wire to common routines
    dataSource.onproperties     = updateProperties;
    dataSource.ontrial          = ingestTrial;

    dataSource.start();

}

// Load mode helpers

var getRecordInfo = function( subject, record ) {
    // Wrap $.getJSON in a standard promise
    return new Promise( function( resolve, reject ) {
        var infoPath = path.join( 'api', 'info', subject, record );
        $.getJSON( infoPath )
            .done( resolve )
            .fail( function() {
                // TODO Get error infor from jquery object
                reject( 'Error loading JSON from: ' + infoPath );
            } );
    } );
};

var unpackBundle = function( info ) {
    if ( info.isBundle ) {
        // Need to load bundle to identify first dataset
        bundle = new fmdata.DataBundle();
        return bundle.get( info.uri )
                        .then( function() {
                            // TODO Update UI with bundle displayGroup
                            // Pass along the URI of the first dataset
                            return Promise.resolve( bundle.uriForDataset( 0 ) );
                            // TODO This all is a crappy system for doing
                            // this. uriForDataset should be implicit in the
                            // API, like infoPath above.
                        } );
    } else {
        // If we're just a dataset, can simply resolve to datast URI
        return Promise.resolve( info.uri );
    }
}; 

if ( loadMode ) {       // Using data loaded from the hive

    getDataInfo( subjectID, recordName )    // Get header info for the data
        .then( unpackBundle )               // Unpack to get us a dataset URI
        .then( dataset.get );               // Get the dataset for that URI

}


// COMMON ROUTINES

// Property registration

var updateProperties = function( properties ) {
    
    uiManager.showIcon( 'transfer' );

    // TODO Put in uiManager?
    subjectDisplayName  = properties.subjectName;
    taskDisplayName     = properties.taskName;
    channelNames        = properties.channels;
    valueUnits          = properties.valueUnits;

    uiManager.hideIcon( 'transfer' );

}

// Trial ingestion

var ingestTrial = function( trialData ) {
    
    uiManager.showIcon( 'transfer' );

    // ...

    uiManager.hideIcon( 'transfer' );

};



//
