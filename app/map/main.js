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
var fmfeature   = require( './fmfeature' );


// MEAT

// Initialization

// TODO A little kludgey
var pathComponents  = window.location.pathname.split( '/' );

var modeString      = pathComponents[2] || 'online';

var onlineMode      = modeString == 'online';
var loadMode        = !onlineMode;

var subjectName     = undefined;
var recordName      = undefined;

if ( loadMode ) {
    subjectName     = pathComponents[2] || undefined;
    recordName      = pathComponents[3] || undefined;
} else {
    subjectName     = pathComponents[3] || undefined;
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
                if ( subjectName && recordName ) {
                    uiManager.updateRecordDetails( subjectName, recordName );
                }
            } )
            .catch( function( reason ) {    // TODO Respond intelligently.
                console.log( reason );
            } );


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
                                    subjectName = result.output.trim();
                                    uiManager.updateSubjectName( subjectName );
                                    prepareSubjectDependencies( subjectName );
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

// TODO KLUUUUUUUUDGEy
var prepareSubjectDependencies = function( theSubject ) {

    // First, load the brain
    $.get( path.join( apiPath, 'brain', theSubject ) )
        .done( function( imageData ) {

            console.log( 'Obtained subject image data.' );

            // Now that we've got the brain, load the sensor geometry
            $.getJSON( path.join( apiPath, 'geometry', theSubject ) )
                .done( function( sensorGeometry ) {

                    console.log( 'Obtained subject sensor geometry.' );

                    // We have what we need, make the brain plot!
                    uiManager.brain.setup( imageData, sensorGeometry );

                } )
                .fail( function( req, reason, err ) {
                    console.log( 'Could not load subject sensor geometry: ' + reason );
                } );

        } )
        .fail( function( req, reason, err ) {
            console.log( 'Could not load subject brain: ' + reason );
        } );

};


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

    getRecordInfo( subjectName, recordName )  // Get header info for the data
        .then( unpackBundle )               // Unpack to get us a dataset URI
        .then( dataset.get );               // Get the dataset for that URI

}


// COMMON ROUTINES

// TODO Move into an fmdata.Dataset object ...
var channelStats = {};
var meanData = {};

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

    // Update scope view
    uiManager.scope.update( signal );

};

var startTrial = function() {

    // We're starting to transfer a trial
    uiManager.showIcon( 'transfer' );
    uiManager.activateTrialCount();

};

// TODO Testing
// var identityFeature = new fmfeature.RemoteFeature( path.join( apiPath, 'compute', 'identity' ) );
// var hgFeature = new fmfeature.RemoteFeature( path.join( apiPath, 'compute', 'hgfft' ) );

var ingestTrial = function( trialData ) {
    
    // We're done transferring
    uiManager.hideIcon( 'transfer' );

    // Now we're working
    uiManager.showIcon( 'working' );

    updateStatistics( trialData );

    // TODO Testing
    // identityFeature.compute( trialData )
    //                 .then( function( computedData ) {
    //                     updateStatistics( computedData );
    //                 } )
    //                 .catch( function( reason ) {
    //                     console.log( 'Error computing features on remote: ' + reason );
    //                 } );

};

var updateStatistics = function( trialData ) {

    cronelib.forEachAsync( Object.keys( channelStats ), function( ch ) {
        channelStats[ch].ingest( trialData[ch] );
        meanData[ch] = channelStats[ch].fdrCorrectedValues( 0.05 );
    }, {
        batchSize: 5
    } ).then( function() {

        // TODO
        var trialCount = 0;
        Object.keys( channelStats ).every( function( ch ) {
            trialCount = channelStats[ch].valueTrials.length;
            return false;
        } );

        updatePlotsPostData();

        // GUI stuff
        uiManager.hideIcon( 'working' );
        uiManager.updateTrialCount( trialCount );
        uiManager.deactivateTrialCount();

    } );

};


// EVENT HOOKS

// TODO Super kludgey to put here, but need data

var dataForTime = function( time ) {

    // TODO Kludge; cache this, since it doesn't change
    var dataSamples = 0;
    Object.keys( meanData ).every( function( ch ) {
        dataSamples = meanData[ch].length;
        return false;
    } );

    var trialWindow = dataSource.getTrialWindow();
    var totalTime = trialWindow.end - trialWindow.start;

    var timeIndexFloat = ((time - trialWindow.start) / totalTime) * dataSamples;
    var timeIndex = Math.floor( timeIndexFloat );
    var timeFrac = timeIndexFloat - timeIndex;

    return Object.keys( meanData ).reduce( function( obj, ch ) {
        obj[ch] = (1.0 - timeFrac) * meanData[ch][timeIndex] + (timeFrac) * meanData[ch][timeIndex + 1];
        return obj
    }, {} );

};

// TODO AAAAAAH I'M AN IDIOT
var updatePlotsPostData = function() {

    uiManager.raster.update( meanData );

    // TODO Kludge: dataForTime is the only thing keeping routine in main
    var meanDataSlice = dataForTime( uiManager.raster.getCursorTime() );
    uiManager.brain.update( meanDataSlice );

    // TODO Super kludge; should only need to update once ever ...
    var trialWindow = dataSource.getTrialWindow();
    uiManager.raster.updateTimeRange( [trialWindow.start, trialWindow.end] );

};

uiManager.raster.oncursormove = function( newTime ) {

    uiManager.updateSelectedTime( newTime );

    var meanDataSlice = dataForTime( newTime );
    uiManager.brain.update( meanDataSlice );

};

uiManager.onOptionChange = function( option, newValue ) {

    if ( option == 'stim-trial-start' ) {
        update
    }
    if ( option == 'stim-trial-end' ) {
        // ?
    }

    if ( option == 'stim-baseline-start' ) {
        updateBaselineWindow( { start: newValue } );
    }
    if ( option == 'stim-baseline-end' ) {
        updateBaselineWindow( { end: newValue } );
    }

};

var updateTrialWindow = function( newWindow ) {

};

var updateBaselineWindow = function( newWindow ) {

    uiManager.showIcon( 'working' );

    cronelib.forEachAsync( Object.keys( channelStats ), function( ch ) {
        channelStats[ch].recompute( newWindow );
    }, {
        batchSize: 5
    } ).then( function() {
        updatePlotsPostData();
        uiManager.hideIcon( 'working' );
    } );

};


$( window ).on( 'resize', function() {

    uiManager.didResize();
    
} );



//