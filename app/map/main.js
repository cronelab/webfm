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

var Cookies     = require( 'js-cookie' );
var minimatch   = require( 'minimatch' );

// var horizon  = require( '../lib/d3-horizon-chart.js' ); // Old way of doing
                                                           // horizon charts
d3.horizon      = require( '../lib/horizon' );             // New kludge

var bci2k       = require( 'bci2k' );
var cronelib    = require( '../lib/cronelib' );

var fmstat      = require( './fmstat' );
var fmonline    = require( './fmonline' );
var fmui        = require( './fmui' );
var fmgen       = require( './fmgen' );
var fmdata      = require( './fmdata' );
var fmfeature   = require( './fmfeature' );
var fmraster    = require( './fmraster' );


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
                // TODO NOT NEEDED
                // TODO Not this way ...
                // if ( subjectName && recordName ) {
                //     uiManager.updateRecordDetails( subjectName, recordName );
                // }
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

        // TODO More elegant placement?
        dataset.setupChannels( properties.channels );

        updateProperties( properties );
        //This is really not good, and probably won't work in all cases.
        dataSource._bciConnection.execute('List Parameter Sequence', function (result) {
            //var sequenceList = []
            var sequenceList = result.output.substring(result.output.indexOf("=") + 2, result.output.indexOf(" // Sequence in which stimuli")).split(" ");
            for (var i = 0; i < sequenceList.length; i++) {
                sequenceList[i] = parseInt(sequenceList[i]);
            }
            sequenceList.shift();
            console.log(Math.max.apply(Math, sequenceList));
        });

    };
    dataSource.onBufferCreated = function() {
        // TODO HELLA DUMB TO DO THIS WAY
        dataset.updateTimesFromWindow( dataSource.getTrialWindow(), dataSource.getTrialLength() );
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

    cronelib.promiseJSON( path.join( configPath, 'online' ) )
            .then( function( onlineConfig ) {
                dataSource.setConfig( onlineConfig );
                prepareOnlineDataSource();
            } )
            .catch( function( reason ) {    // TODO Respond intelligently
                console.log( reason );
            } )

    // dataSource.loadConfig( onlineConfig, taskConfig )
    //             .then( function() {
    //                 prepareOnlineDataSource();
    //             } )
    //             .catch( function( reason ) {    // TODO Respond intelligently
    //                 console.log( reason );
    //             } );

}

var getSourceAddress = function() {

    return new Promise( function( resolve, reject ) {

        var sourceAddress = Cookies.get( 'sourceAddress' );

        if ( sourceAddress === undefined ) {

            var configURI = path.join( configPath, 'online' );

            $.getJSON( configURI )
                .done( function( data ) {
                    // Set the cookie for the future, so we can get it directly
                    Cookies.set( 'sourceAddress', data.sourceAddress );
                    // Resolve to the value
                    resolve( data.sourceAddress );
                } )
                .fail( function( req, reason, err ) {
                    // TODO Get error message from jquery object
                    reject( 'Could not load watcher config from ' + configURI + ' : ' + reason );
                } );

        }

        resolve( sourceAddress );

    } );

};

var prepareOnlineDataSource = function() {

    getSourceAddress()
        .then( function( sourceAddress ) {

            dataSource.connect( sourceAddress )
                        .then( function() {

                            // Set some base metadata
                            // TODO Hard-coded for now
                            dataset.updateMetadata( {
                                kind: 'high gamma power',
                                labels: ['timeseries']
                            } );

                            // Get subject name
                            dataSource.getParameter( 'SubjectName' )
                                        .then( function( result ) {
                                            // Postprocess result
                                            subjectName = result.trim();
                                            // Do everything that needs subjectName
                                            prepareSubjectDependencies( subjectName );
                                        } )
                                        .catch( function( reason ) {
                                            console.log( 'Could not obtain SubjectName: ' + reason );
                                        } );

                            // Get task name
                            dataSource.getParameter( 'DataFile' )
                                        .then( function( result ) {
                                            // TODO Error checking
                                            var taskName = result.trim().split( '/' )[1];
                                            // Do everything that needs taskName
                                            prepareTaskDependencies( taskName );
                                        } )
                                        .catch( function( reason ) {
                                            console.log( 'Could not obtain DataFile: ' + reason );
                                        } );

                        } )
                        .catch( function( reason ) {    // TODO Something intelligent
                            console.log( reason );
                        } );

        } );

};

var updateRecordListForSubject = function( theSubject ) {

    cronelib.promiseJSON( path.join( apiPath, 'list', theSubject ) )
            .then( function( records ) {
                // Ensure consistent ordering
                records.sort();
                // Update the save page with the records
                uiManager.updateSubjectRecords( records );
            } )
            .catch( function( reason ) {
                // TODO Handle errors
                console.log( err );
            } );

    // // Get a list of the existing datasets
    // $.getJSON( path.join( apiPath, 'list', theSubject ) )
    //     .done( function( records ) {
    //         // Ensure consistent ordering
    //         records.sort();
    //         // Update the save page with the records
    //         uiManager.updateSubjectRecords( records );
    //     } )
    //     .fail( function( req, textStatus, err ) {
    //         // TODO Handle errors
    //         console.log( err );
    //     } );

};

var prepareSubjectDependencies = function( theSubject ) {

    // Update UI elements that depend on subject
    uiManager.updateSubjectName( subjectName );

    // Update our data's knowledge of subject
    dataset.updateMetadata( {
        subject: subjectName
    } );

    // First we'll load the brain
    var loadSubjectBrain = function() {
        return new Promise( function( resolve, reject ) {
            $.get( path.join( apiPath, 'brain', theSubject ) )
                .done( function( imageData ) {
                    // Put the imageData into our metadata
                    dataset.updateMetadata( {
                        brainImage: imageData
                    } );
                    // Pass the data down the chain
                    resolve( imageData );
                } )
                .fail( function( req, reason, err ) {
                    reject( 'Could not load subject brain: ' + reason );
                } );
        } );
    };

    // Next we'll load the sensor geometry
    var loadSubjectGeometry = function() {
        return new Promise( function( resolve, reject ) {
            $.get( path.join( apiPath, 'geometry', theSubject ) )
                .done( function( sensorGeometry ) {
                    // Put the geometry into our metadata
                    dataset.updateMetadata( {
                        'sensorGeometry': sensorGeometry
                    } );
                    // Pass the data down the chain
                    resolve( sensorGeometry );
                } )
                .fail( function( req, reason, err ) {
                    reject( 'Could not load subject sensor geometry: ' + reason );
                } );
        } );
    };

    // Execute both, and collate the results
    Promise.all( [
        loadSubjectBrain(),
        loadSubjectGeometry()
    ] )
        .then( function( data ) {

            var imageData = data[0];
            var sensorGeometry = data[1];

            // We have what we need, make the brain plot!
            uiManager.brain.setup( imageData, sensorGeometry );

        } )
        .catch( function( reason ) {
            console.log( reason );
        } );

    updateRecordListForSubject( theSubject );


    // Old method

    // // First, load the brain
    // $.get( path.join( apiPath, 'brain', theSubject ) )
    //     .done( function( imageData ) {

    //         console.log( 'Obtained subject image data.' );

    //         // Now that we've got the brain, load the sensor geometry
    //         $.getJSON( path.join( apiPath, 'geometry', theSubject ) )
    //             .done( function( sensorGeometry ) {

    //                 console.log( 'Obtained subject sensor geometry.' );

    //                 // We have what we need, make the brain plot!
    //                 uiManager.brain.setup( imageData, sensorGeometry );

    //             } )
    //             .fail( function( req, reason, err ) {
    //                 console.log( 'Could not load subject sensor geometry: ' + reason );
    //             } );

    //     } )
    //     .fail( function( req, reason, err ) {
    //         console.log( 'Could not load subject brain: ' + reason );
    //     } );

};

var matchTaskConfig = function( taskName, config ) {

    // Start off with deep copy of default
    var taskConfig = JSON.parse( JSON.stringify( config.default || {} ) );

    // Attempt to match patterns
    Object.keys( config ).every( function( configTask ) {
        // Do a glob match against the pattern in config
        if ( minimatch( taskName, configTask ) ) {
            Object.assign( taskConfig, config[configTask] );
            return false;   // "break"
        }
        return true;
    } );

    return taskConfig;

}

var prepareTaskDependencies = function( taskName ) {

    // Update task-specific config
    cronelib.promiseJSON( path.join( configPath, 'tasks' ) )
        .then( function( config ) {
            return new Promise( function( resolve, reject ) {

                var taskConfig = matchTaskConfig( taskName, config );

                if ( taskConfig === undefined ) {
                    reject( 'No suitable task config present.' );
                    return;
                }

                if ( taskConfig.trialWindow !== undefined ) {
                    // TODO Kludgey?
                    dataSource.dataFormatter.updateTrialWindow( taskConfig.trialWindow );
                }

                if ( taskConfig.baselineWindow !== undefined ) {
                    dataset.updateBaselineWindow( taskConfig.baselineWindow );
                }

            } );
        } )
        .catch( function( reason ) {
            console.log( 'Could not load task config: ' + reason );
        } );

    // Update UI elements that depend on task
    uiManager.updateTaskName( taskName );

    // Update our data's knowledge of task
    dataset.updateMetadata( {
        setting: {
            task: taskName
        }
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

// TODO Naming semantics imply it takes dataset as argument (better design anyway)
var prepareFromDataset = function() {

    // Update subject name
    uiManager.updateSubjectName( dataset.metadata.subject );

    // Update brain image & sensor geometry
    var brainImage = dataset.metadata.brainImage;
    var sensorGeometry = dataset.metadata.sensorGeometry;

    if ( brainImage === undefined ) {
        console.log( 'No brain image in specified dataset.' );
        // TODO Should have a neutral default image to use; perhaps all white.

        if ( sensorGeometry === undefined ) {
            // TODO If neither are provided, should create a "standardized" layout
        }
    } else {
        if ( sensorGeometry === undefined ) {
            console.log( 'No sensor geometry in specified dataset.' );
            // TODO What can I do??
        } else {
            // Everything good!
            uiManager.brain.setup( brainImage, sensorGeometry );
        }
    }

    // Update task name
    // TODO Improve logic
    if ( dataset.metadata.setting !== undefined ) {
        if ( dataset.metadata.setting.task !== undefined ) {
            uiManager.updateTaskName( dataset.metadata.setting.task );
        } else {
            uiManager.updateTaskName( '(unknown)' );
        }
    } else {
        uiManager.updateTaskName( '(unknown)' );
    }

    updateProperties( {
        channels: dataset.metadata.montage
    } );

};

if ( loadMode ) {       // Using data loaded from the hive

    getRecordInfo( subjectName, recordName )    // Get header info for the data
        .then( function( recordInfo ) {
            return unpackBundle( recordInfo );  // Unpack to get us a dataset URI
        } )
        .then( function( recordUrl ) {
            return dataset.get( recordUrl );           // Get the dataset for that URI
        } )
        .then( function() {
            prepareFromDataset();
            updateDataDisplay();
        } );

}


// COMMON ROUTINES

// Property registration

var updateProperties = function( properties ) {

    // TODO Since this code is synchronous these calls won't do anything?
    // uiManager.showIcon( 'transfer' );

    // OLD This is only needed for online mode.
    // Allocate data
    /*
    properties.channels.forEach( function( ch ) {
        channelStats[ch] = new fmstat.ChannelStat();
    } );
    */

    // Update GUI
    uiManager.updateChannelNames( properties.channels );

    // uiManager.hideIcon( 'transfer' );

};

// Data ingestion

var ingestSignal = function( signal ) {
    // Update scope view
    uiManager.scope.update( signal );




};

var startTrial = function() {
    // We're starting to transfer a trial, so engage the transfer icon
    uiManager.showIcon( 'transfer' );
    // Makes the trial count bold, to indicate we're in a trial
    uiManager.activateTrialCount();


    //Probably not the best place to put this. but this will update the .stim-display to show what stimulusCode was just presented via BCI2000
    dataSource._bciConnection.execute('Get StimulusCode').then(function (result) {
      var newFmDiv = '<div id="fmX" class="stim-displayX"><br><br></div>'.replace(/X/g, result.toString().trim());
      var fmDiv = "fmX".replace("X", result.toString().trim());
      var fmNum = $('#fmX'.replace("X", result.toString()));

        if (fmNum.length == 0) {
            $('#fmContainer').append(newFmDiv);
            var pTag = document.createElement("P");
            pTag.appendChild(document.createTextNode("Stimulus Code is: X".replace("X", result.toString().trim())));
            document.getElementById(fmDiv).appendChild(pTag).style.paddingLeft = "275px";
            pTag.style.fontWeight="900";
    }
    // if(result%2==0)
         $('.stim-display').text(result);
        // console.log(uiManager.raster)
        console.log(dataset)
        console.log(fmdata)

});
};

// TODO Testing
// var identityFeature = new fmfeature.RemoteFeature( path.join( apiPath, 'compute', 'identity' ) );
// var hgFeature = new fmfeature.RemoteFeature( path.join( apiPath, 'compute', 'hgfft' ) );

var ingestTrial = function( trialData ) {

    // We're done transferring
    uiManager.hideIcon( 'transfer' );

    // Now we're working
    uiManager.showIcon( 'working' );

    // Update our statistics
    dataset.ingest( trialData )
        .then( function() {

            updateDataDisplay();

            uiManager.hideIcon( 'working' );

            uiManager.updateTrialCount( dataset.getTrialCount() );
            uiManager.deactivateTrialCount();


        } );

    /*
    updateStatistics( trialData );
    */

    // TODO Testing
    // identityFeature.compute( trialData )
    //                 .then( function( computedData ) {
    //                     updateStatistics( computedData );
    //                 } )
    //                 .catch( function( reason ) {
    //                     console.log( 'Error computing features on remote: ' + reason );
    //                 } );

};

var updateDataDisplay = function updateDataDisplay() {

    var timeBounds = dataset.getTimeBounds();
    var stimCode = $('.stim-display').text();

    //For whatever stimulus code is presented to the user
    if(!uiManager.raster[parseInt(stimCode)] == null)
    {
      uiManager.raster[parseInt(stimCode)].update( dataset.displayData );
      uiManager.brain.update( dataset.dataForTime( uiManager.raster[parseInt(stimCode)].getCursorTime() ) );
      uiManager.raster[parseInt(stimCode)].updateTimeRange( [timeBounds.start, timeBounds.end] );
    }
    //For the combined average of all stimulus codes
    uiManager.raster[0].update( dataset.displayData );
    uiManager.brain.update( dataset.dataForTime( uiManager.raster[0].getCursorTime() ) );
    uiManager.raster[0].updateTimeRange( [timeBounds.start, timeBounds.end] );


    // KLUDGE
    // TODO Can't think of a good way to deal with combined async of
    // loading UI config and setting up data source
    // TODO Need to make compatible with dataset
    //var trialWindow = dataSource.getTrialWindow();
    // END KLUDGE

}

/*
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
*/

// EVENT HOOKS

// TODO Super kludgey to put here, but need data

/*
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
*/

// TODO AAAAAAH I'M AN IDIOT
/*
var updatePlotsPostData = function() {

    uiManager.raster.update( meanData );

    // TODO Kludge: dataForTime is the only thing keeping routine in main
    var meanDataSlice = dataForTime( uiManager.raster.getCursorTime() );
    uiManager.brain.update( meanDataSlice );

    // TODO Super kludge; should only need to update once ever ...
    var trialWindow = dataSource.getTrialWindow();
    uiManager.raster.updateTimeRange( [trialWindow.start, trialWindow.end] );

};
*/

    for(var i=0;i<uiManager.raster.length;i++)
    {
      uiManager.raster[i].oncursormove = function( newTime ) {
        uiManager.updateSelectedTime( newTime );
        uiManager.brain.update( dataset.dataForTime( newTime ) );
      }

    /*
    var meanDataSlice = dataForTime( newTime );
    uiManager.brain.update( meanDataSlice );
    */


};

uiManager.onsave = function( saveName ) {

    var putUrl = path.join( apiPath, 'data', subjectName, saveName );
    // TODO Not so happy to have this be hard-coded like this
    var standardImport = './.metadata';

    dataset.put( putUrl, {
        import: standardImport
    } )
        .then( function( response ) {

            updateRecordListForSubject( subjectName );

            // TODO Give user feedback
            console.log( response );

        } )
        .catch( function( reason ) {

            // TODO Give user feedback
            console.log( reason );

        } );

};

uiManager.onoptionchange = function( option, newValue ) {

    if ( option == 'stim-trial-start' ) {
        // updateTrialWindow( { start: newValue } );
    }
    if ( option == 'stim-trial-end' ) {
        // updateTrialWindow( { end: newValue } );
    }

    if ( option == 'stim-baseline-start' ) {
        updateBaselineWindow( { start: newValue } );
    }
    if ( option == 'stim-baseline-end' ) {
        updateBaselineWindow( { end: newValue } );
    }

    if ( option == 'stim-timing' ) {
        if ( onlineMode ) {
            dataSource.dataFormatter.updateTimingMode( newValue );
        }
    }
    if ( option == 'stim-channel' ) {
        if ( onlineMode ) {
            dataSource.dataFormatter.updateTimingChannel( newValue );
        }
    }
    if ( option == 'stim-off' ) {
        if ( onlineMode ) {
            dataSource.dataFormatter.updateThreshold( { offValue: newValue } );
        }
    }
    if ( option == 'stim-on' ) {
        if ( onlineMode ) {
            dataSource.dataFormatter.updateThreshold( { onValue: newValue } );
        }
    }

};

var updateTiming = function( newMode ) {
    // dataSource.dataFormatter.update
}
var updateTrialThreshold = function( newThreshold ) {
};
var updateTrialWindow = function( newWindow ) {
    // TODO ...
};

var updateBaselineWindow = function( newWindow ) {

    uiManager.showIcon( 'working' );

    dataset.updateBaselineWindow( newWindow )
        .then( function() {

            updateDataDisplay();

            uiManager.hideIcon( 'working' );

        } );

    /*
    cronelib.forEachAsync( Object.keys( channelStats ), function( ch ) {
        channelStats[ch].recompute( newWindow );
    }, {
        batchSize: 5
    } ).then( function() {
        updatePlotsPostData();
        uiManager.hideIcon( 'working' );
    } );
    */

};


$( window ).on( 'resize', function() {

    uiManager.didResize();

} );


$( window ).on( 'beforeunload', function() {

    if ( !dataset.isClean() ) {

        return "There are unsaved changes to your map. Are you sure you want to leave?";

    }

} );
