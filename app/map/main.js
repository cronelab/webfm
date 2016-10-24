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

// TODO A little kludgey
var pathComponents  = window.location.pathname.split( '/' );

var modeString      = pathComponents[2] || 'generate';

var generateMode    = modeString == 'generate';
var onlineMode      = modeString == 'online';
var loadMode        = (! (generateMode || onlineMode) );

var subjectID       = undefined;
var recordName      = undefined;

if ( loadMode ) {
    subjectID       = pathComponents[2] || undefined;
    recordName      = pathComponents[3] || undefined;
} else {
    subjectID       = pathComponents[3] || undefined;
    recordName      = pathComponents[4] || undefined;
}


var apiPath         = '/api';
var configPath      = '/map/config';


// Dataset
var dataBundle      = null;
var dataset         = new fmdata.Dataset();

// UI
var uiManager       = new fmui.InterfaceManager();
// TODO Handle rejection
uiManager.loadConfig( path.join( configPath, 'ui' ) )
            .then( function() {
                // TODO Not this way ...
                if ( subjectID && recordName ) {
                    uiManager.updateRecordDetails( subjectID, recordName );
                }
            } )
            .catch( function( reason ) {    // TODO Respond intelligently.
                console.log( reason );
            } );

// Signal properties

var signalChannels  = null;


// DATA SOURCE SET-UP

var dataSource = null;

if ( onlineMode ) {     // Using BCI2000Web over the net

    dataSource = new fmonline.OnlineDataSource();

    // Wire to common routines
    dataSource.onproperties = function( properties ) {
        updateProperties( properties );
    };
    dataSource.onStartTrial = function() {
        startTrial();
    };
    dataSource.ontrial = function( trialData ) {
        ingestTrial( trialData );
    };
    dataSource.onRawSignal = function( rawSignal ) {
        ingestSignal( rawSignal );
    };

    dataSource.loadConfig( path.join( configPath, 'online' ) )
                .then( function() {
                    prepareOnlineDataSource();
                } )
                .catch( function( reason ) {    // TODO Respond intelligently
                    console.log( reason );
                } );

}

var prepareOnlineDataSource = function() {

    dataSource.connect()
                .then( function() {

                    // Get subject name
                    dataSource.getParameter( 'SubjectName' )
                                .then( function( result ) {
                                    uiManager.updateSubjectName( result.output.trim() );
                                } )
                                .catch( function( reason ) {
                                    console.log( 'Could not obtain SubjectName: ' + reason );
                                } );

                    // Get task name
                    dataSource.getParameter( 'DataFile' )
                                .then( function( result ) {
                                    // TODO Error checking
                                    var taskName = result.output.trim().split( '/' )[1];
                                    uiManager.updateTaskName( taskName );
                                } );

                } )
                .catch( function( reason ) {    // TODO Something intelligent

                    console.log( reason );

                } );

};


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
        var infoPath = path.join( apiPath, 'info', subject, record );
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

    getRecordInfo( subjectID, recordName )  // Get header info for the data
        .then( unpackBundle )               // Unpack to get us a dataset URI
        .then( dataset.get );               // Get the dataset for that URI

}


// COMMON ROUTINES

// TODO Move into an fmdata.Dataset object ...
var channelStats = {};

// Property registration

var updateProperties = function( properties ) {
    
    uiManager.showIcon( 'transfer' );

    // Allocate data
    properties.channels.forEach( function( ch ) {
        channelStats[ch] = new fmstat.ChannelStat();
    } );

    // Update GUI
    uiManager.updateChannelNames( properties.channels );

    uiManager.hideIcon( 'transfer' );

};

// Data ingestion

var ingestSignal = function( signal ) {

    // Update 
    uiManager.scope.update( signal );

};

var startTrial = function() {

    uiManager.showIcon( 'transfer' );

};

var ingestTrial = function( trialData ) {
    
    // We're done transferring
    uiManager.hideIcon( 'transfer' );

    // Now we're working
    uiManager.showIcon( 'working' );

    // TODO
    cronelib.forEachAsync( Object.keys( channelStats ), function( ch ) {

        var chValues = trialData[ch];
        var chBaseline = chValues.slice( 0, 10 );

        channelStats[ch].updateBaseline( chBaseline );
        channelStats[ch].updateValues( chValues );

    }, {
        batchSize: 5
    } ).then( function() {

        // TODO
        var meanData = {};
        Object.keys( channelStats ).forEach( function( ch ) {
            //meanData[ch] = channelStats[ch].meanValues();
            meanData[ch] = channelStats[ch].baselineNormalizedValues();
        } )
        uiManager.raster.update( meanData );

        uiManager.hideIcon( 'working' );

    } );

};


// EVENT HOOKS

$( window ).on( 'resize', function() {

    uiManager.didResize();
    
} );



//
