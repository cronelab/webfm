//TODO from main.js
//datasets/bundles
//Initialize source/spectral buffers
//Save metadata

let urlParams = new URLSearchParams(window.location.search);
import "./map.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import {
    loadBrain,
    loadGeometry,
    loadDots
} from '../loaders.js'
import {
    generateChart
} from "../timeSeries";
import {
    Helpers
} from './stats';
import UI from "../UI"
if (urlParams.get('type') == "map") {}
let bciWatcher = null;

// let bciStateChange = newState => {};

window.onload = () => {
    //Get the bci2000 source address from the browser's local storage
    let sourceAddress = localStorage.getItem("sourceAddress");
    let newHelper = new Helpers();
    //Instantiate the UI class
    // let userInterface = new UI();

    //Instantiate the BCI2KWatcher class 
    bciWatcher = new BCI2KWatcher();
    bciWatcher.onstatechange = bciStateChange;

    //Connect to BCI2000
    bciWatcher.connect(sourceAddress).then(() => {
        bciWatcher.start();


        //Tap the spectral stream
        setupDataConnections();
        getTaskParameters();
        //Use the running BCI2000 instance to get the subject name
        bciWatcher.getParameter("SubjectName").then(subjName => {
            let subj = subjName.trim();
            document.getElementsByClassName("fm-subject-name")[0].innerText = subj;
            //Load the brain and geometry
            loadBrain(subj).then(() => {
                loadGeometry(subj).then(geo => {
                    // loadDots(geo);
                    let chList = document.createElement("ul");
                    chList.classList.add("list-group-item");
                    chList.innerHTML = "All channels";
                    chList.onclick = e => {
                        // e.preventDefault();
                        //View all channels
                        // stats.then(y => lineChart(y, Object.keys(x), 1000));
                    };
                    document.getElementById("fm-montage-list").appendChild(chList);
                    Object.keys(geo).map((ch, i) => {
                        let chList = document.createElement("ul");
                        chList.classList.add("list-group-item");
                        chList.innerHTML = ch;
                        chList.onclick = e => {
                            // e.preventDefault();
                            // selectedChannel = [ch];
                            //View a single channel
                            // stats.then(y => lineChart(y, [ch], lineScale));
                        };
                        document.getElementById("fm-montage-list").appendChild(chList);
                    });
                });
            });
            //Get pertinent parameters
            bciWatcher._bciConnection.execute("List Parameter Sequence", result => {
                let sequenceList = result.output
                    .substring(
                        result.output.indexOf("=") + 2,
                        result.output.indexOf(" // Sequence in which stimuli")
                    )
                    .split(" ");
                var maxSequences = Math.max.apply(null, sequenceList);
                // console.log(sequenceList);
            });
        });

        bciWatcher.getParameter("DataFile").then(result => {
            var taskName = result.trim().split("/")[1];
            document.getElementsByClassName("fm-task-name")[0].innerText = taskName;
        });
    });
};

let bciStateChange = newState => {
    console.log(newState);
    // document.getElementById('state-label').innerHTML = "<strong>" + newState + "<strong>";
    // Object.keys(stateClasses).map(v => {
    //     if (newState == v) {
    //         document.getElementById('state-label').classList.add(stateClasses[v])
    //         return
    //     }
    //     document.getElementById('state-label').classList.remove(stateClasses[v])
    // })
}

const getTaskParameters = async () => {
    let firstBin = await bciWatcher.getParameter("FirstBinCenter")
    let lastBin = await bciWatcher.getParameter("LastBinCenter");
    let stimDuration = await bciWatcher.getParameter("StimulusDuration")
    let minISI = await bciWatcher.getParameter("ISIMinDuration")
    let maxISI = await bciWatcher.getParameter("ISIMaxDuration")
    console.log(firstBin, lastBin, stimDuration, minISI, maxISI)
}


const setupDataConnections = async () => {

    const sendSourceData = (numChannels, sampleBlockSize) => {
        let timeBuffer = [];
        for (let i = 0; i < numChannels; i++) {
            timeBuffer.push([]);
        }
        sourceData.onGenericSignal = timeData => {
            console.log(timeBuffer);
            timeData.map((ch, i) => {
                console.log(timeBuffer[i].length);
                if (timeBuffer[i].length == sampleBlockSize) {
                    // generateChart(timeBuffer[i]);
                    timeBuffer[i].splice(0, sampleBlockSize);
                    timeBuffer[i] = timeBuffer[i].concat(ch);
                } else {
                    timeBuffer[i] = timeBuffer[i].concat(ch);
                }
            });
        };
    };

    //Get raw time series data
    let sourceData = await bciWatcher._bciConnection.tap("Source");
    let spectralData = await bciWatcher._bciConnection.tap("SpectralOutput");
    try {
        sourceData.onSignalProperties = sigProps => {
            console.log(sigProps);
            console.log(sigProps.channels.length);
            console.log(sigProps.numElements);

            let chan = sigProps.channels.length;
            let sampB = sigProps.numelements;
            if (sampB) {
                sendSourceData(chan, sampB);
            }
        };
    } catch (err) {
        console.log(err);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));


    spectralData.onStateVector = data => {
        // console.log(data.StimulusCode)
    };
    // spectralData.onGenericSignal = signal =>{
    //     console.log(signal);
    // }
};

//   // Wire to common routines
//   dataSource.onFeatureProperties = function(properties) {
//     // TODO More elegant placement?
//     dataset.setupChannels(properties.channels);

//   if (document.title == "WebFM: Live") {
//     dataSource.onSourceProperties = function(properties) {
//       featureSignalBufferManager.featureSignalBufferLength =
//         featureSignalBufferManager.featureSignalBufferTime /
//         (properties.elementunit.gain * properties.numelements);
//     };
//     dataSource.onFeatureSignal = function(featureSignal) {
//       ingestFeatureSignal(featureSignal);
//     };
//     dataSource.normalize = true;
//   }

//   dataSource.onBufferCreated = function() {
//     // TODO HELLA DUMB TO DO THIS WAY
//     dataset.updateTimesFromWindow(
//       dataSource.getTrialWindow(),
//       dataSource.getTrialLength()
//     );
//   };
//   dataSource.onStartTrial = function() {
//     startTrial();
//   };
//   dataSource.ontrial = function(trialData) {
//     ingestTrial(trialData);
//     // uiManager.scope.update( dataSource.dataFormatter.sourceBuffer[0] );
//   };

//   dataSource.onRawSignal = function(rawSignal) {
//     ingestSignal(rawSignal);

//     // uiManager.scope.update( rawSignal );
//   };

//   cronelib
//     .promiseJSON(path.join(configPath, "online"))
//     .then(function(onlineConfig) {
//       dataSource.setConfig(onlineConfig);
//       prepareOnlineDataSource();
//     })
//     .catch(function(reason) {
//       // TODO Respond intelligently
//       console.log(reason);
//     });

//   // dataSource.loadConfig( onlineConfig, taskConfig )
//   //             .then( function() {
//   //                 prepareOnlineDataSource();
//   //             } )
//   //             .catch( function( reason ) {    // TODO Respond intelligently
//   //                 console.log( reason );
//   //             } );
// }
// // REQUIRES
// var path        = require( 'path' );
// var $           = require( 'jquery' );
// var Cookies     = require( 'js-cookie' );
// var minimatch   = require( 'minimatch' );
// var cronelib    = require( '../lib/cronelib' );
// var fmonline    = require( './fmonline' );
// var fmui        = require( './fmui' );
// var fmdata      = require( './fmdata' );

// // Initialization

// // TODO A little kludgey
// var pathComponents  = window.location.pathname.split( '/' );

// var modeString      = pathComponents[2] || 'online';

// var onlineMode      = modeString == 'online';
// var loadMode        = !onlineMode;

// var subjectName     = undefined;
// var recordName      = undefined;
// var currStimCode    = undefined;

// if ( loadMode ) {
//   subjectName     = pathComponents[2] || undefined;
//   recordName      = pathComponents[3] || undefined;
// } else {
//   subjectName     = pathComponents[3] || undefined;
//   recordName      = pathComponents[4] || undefined;
// }

// var apiPath         = '/api';
// var configPath      = '/map/config';

// // Dataset
// var dataBundle      = null;
// var dataset         = new fmdata.Dataset();

// // UI
// var uiManager       = new fmui.InterfaceManager();

// // TODO Handle rejection
// uiManager.loadConfig( path.join( configPath, 'ui' ) )
// .then( function() {
//   // TODO NOT NEEDED
//   // TODO Not this way ...
//   // if ( subjectName && recordName ) {
//   //     uiManager.updateRecordDetails( subjectName, recordName );
//   // }
// } )
// .catch( function( reason ) {    // TODO Respond intelligently.
//   console.log( reason );
// } );

// if(document.title=="WebFM: Live"){

//   // Feature signal buffer setup
//   var featureSignalBufferManager = {};
//   featureSignalBufferManager.featureSignalBuffer         = null;
//   featureSignalBufferManager.runningAverage              = null;
//   featureSignalBufferManager.runningStandardDeviation    = null;
//   featureSignalBufferManager.useFeatureSignalBuffer      = true;
//   featureSignalBufferManager.featureSignalBufferTime     = Infinity; // In seconds
//   if ( featureSignalBufferManager.useFeatureSignalBuffer ){
//     if ( featureSignalBufferManager.featureSignalBufferTime === Infinity ){
//       uiManager.brain.dotColorsDomain = uiManager.brain.dotColorsDomainBufferInfinity;
//       uiManager.brain.dotPowerThreshold = uiManager.brain.dotPowerThresholdBufferInfinity;
//       uiManager.brain.extent = uiManager.brain.extentBufferInfinity;
//     } else {
//       uiManager.brain.dotColorsDomain = uiManager.brain.dotColorsDomainBuffer;
//       uiManager.brain.dotPowerThreshold = uiManager.brain.dotPowerThresholdBuffer;
//       uiManager.brain.extent = uiManager.brain.extentBuffer;
//     }
//   }
//   // Buffer length with be obtained from "onSourceProperties" and intended buffer time

// }

// var updateRecordListForSubject = function( theSubject ) {

//   cronelib.promiseJSON( path.join( apiPath, 'list', theSubject ) )
//   .then( function( records ) {
//     // Ensure consistent ordering
//     records.sort();
//     // Update the save page with the records
//     uiManager.updateSubjectRecords( records );
//   } )
//   .catch( function( reason ) {
//     // TODO Handle errors
//     console.log( err );
//   } );

//   // // Get a list of the existing datasets
//   // $.getJSON( path.join( apiPath, 'list', theSubject ) )
//   //     .done( function( records ) {
//   //         // Ensure consistent ordering
//   //         records.sort();
//   //         // Update the save page with the records
//   //         uiManager.updateSubjectRecords( records );
//   //     } )
//   //     .fail( function( req, textStatus, err ) {
//   //         // TODO Handle errors
//   //         console.log( err );
//   //     } );

// };

// var matchTaskConfig = function( taskName, config ) {

//   // Start off with deep copy of default
//   var taskConfig = JSON.parse( JSON.stringify( config.default || {} ) );

//   // Attempt to match patterns
//   Object.keys( config ).every( function( configTask ) {
//     // Do a glob match against the pattern in config
//     if ( minimatch( taskName, configTask ) ) {
//       Object.assign( taskConfig, config[configTask] );
//       return false;   // "break"
//     }
//     return true;
//   } );

//   return taskConfig;

// }

// var prepareTaskDependencies = function( taskName ) {

//   // Update task-specific config
//   cronelib.promiseJSON( path.join( configPath, 'tasks' ) )
//   .then( function( config ) {
//     return new Promise( function( resolve, reject ) {

//       var taskConfig = matchTaskConfig( taskName, config );

//       if ( taskConfig === undefined ) {
//         reject( 'No suitable task config present.' );
//         return;
//       }

//       if ( taskConfig.trialWindow !== undefined ) {
//         // TODO Kludgey?
//         dataSource.dataFormatter.updateTrialWindow( taskConfig.trialWindow );
//       }

//       if ( taskConfig.baselineWindow !== undefined ) {
//         dataset.updateBaselineWindow( taskConfig.baselineWindow );
//       }

//     } );
//   } )
//   .catch( function( reason ) {
//     console.log( 'Could not load task config: ' + reason );
//   } );

//   // Update UI elements that depend on task
//   uiManager.updateTaskName( taskName );

//   // Update our data's knowledge of task
//   dataset.updateMetadata( {
//     setting: {
//       task: taskName
//     }
//   } );

// };

// // Load mode helpers

// var getRecordInfo = function( subject, record ) {
//   // Wrap $.getJSON in a standard promise
//   return new Promise( function( resolve, reject ) {
//     var infoPath = path.join( apiPath, 'info', subject, record );
//     $.getJSON( infoPath )
//     .done( resolve )
//     .fail( function() {
//       // TODO Get error infor from jquery object
//       reject( 'Error loading JSON from: ' + infoPath );
//     } );
//   } );
// };

// var unpackBundle = function( info ) {
//   if ( info.isBundle ) {
//     // Need to load bundle to identify first dataset
//     bundle = new fmdata.DataBundle();
//     return bundle.get( info.uri )
//     .then( function() {
//       // TODO Update UI with bundle displayGroup
//       // Pass along the URI of the first dataset
//       return Promise.resolve( bundle.uriForDataset( 0 ) );
//       // TODO This all is a crappy system for doing
//       // this. uriForDataset should be implicit in the
//       // API, like infoPath above.
//     } );
//   } else {
//     // If we're just a dataset, can simply resolve to datast URI
//     return Promise.resolve( info.uri );
//   }
// };

// // TODO Naming semantics imply it takes dataset as argument (better design anyway)
// var prepareFromDataset = function() {

//   // Update subject name
//   uiManager.updateSubjectName( dataset.metadata.subject );

//   // Update brain image & sensor geometry
//   var brainImage = dataset.metadata.brainImage;
//   var sensorGeometry = dataset.metadata.sensorGeometry;

//   if ( brainImage === undefined ) {
//     console.log( 'No brain image in specified dataset.' );
//     // TODO Should have a neutral default image to use; perhaps all white.

//     if ( sensorGeometry === undefined ) {
//       // TODO If neither are provided, should create a "standardized" layout
//     }
//   } else {
//     if ( sensorGeometry === undefined ) {
//       console.log( 'No sensor geometry in specified dataset.' );
//       // TODO What can I do??
//     } else {
//       // Everything good!
//       uiManager.brain.setup( brainImage, sensorGeometry );
//     }
//   }

//   // Update task name
//   // TODO Improve logic
//   if ( dataset.metadata.setting !== undefined ) {
//     if ( dataset.metadata.setting.task !== undefined ) {
//       uiManager.updateTaskName( dataset.metadata.setting.task );
//     } else {
//       uiManager.updateTaskName( '(unknown)' );
//     }
//   } else {
//     uiManager.updateTaskName( '(unknown)' );
//   }

//   updateProperties( {
//     channels: dataset.metadata.montage
//   } );

// };

// if ( loadMode ) {       // Using data loaded from the hive

//   getRecordInfo( subjectName, recordName )    // Get header info for the data
//   .then( function( recordInfo ) {
//     return unpackBundle( recordInfo );  // Unpack to get us a dataset URI
//   } )
//   .then( function( recordUrl ) {
//     return dataset.get( recordUrl );           // Get the dataset for that URI
//   } )
//   .then( function() {
//     prepareFromDataset();
//     if(document.title=="WebFM: Map")
//     {
//       updateDataDisplay();
//     }
//   } );

// }

// // COMMON ROUTINES

// // Property registration

// var updateProperties = function( properties ) {

//   // Since this code is synchronous these calls won't do anything?
//   // uiManager.showIcon( 'transfer' );
//   // OLD This is only needed for online mode.
//   // Allocate data
//   //   properties.channels.forEach( function( ch ) {
//   //   channelStats[ch] = new fmstat.ChannelStat();
//   // } );
//   // Update GUI
//   // uiManager.hideIcon( 'transfer' );

//   uiManager.updateChannelNames( properties.channels );
// };

// // Data ingestion

// var ingestSignal = function( signal ) {
//   // Update scope view
//   // console.log(signal);
//   uiManager.scope.update( signal );
// };

// if(document.title=="WebFM: Live"){

//   var ingestFeatureSignal = function( featureSignal ) {
//     // console.log(featureSignal);
//     // console.log(featureSignalBufferManager);
//     // Update scope view
//     if ( featureSignalBufferManager.useFeatureSignalBuffer ) {
//            var _buffered = bufferFeatureSignal(featureSignal);
//       let maxVal = (Object.keys(featureSignal).reduce((a, b) => featureSignal[a] > featureSignal[b] ? a : b));
//       var sliderVal = document.getElementsByClassName("slider")[0];

//       Object.keys(_buffered).forEach((key) => {
//         _buffered[key] = _buffered[key]/(_buffered[maxVal]+(sliderVal.value*.01));
//       });
//       uiManager.brain.update( _buffered );
//       // uiManager.brain3.update( _buffered );
//     }
//     else {
//       uiManager.brain.update( featureSignal );
//       // uiManager.brain3.update( featureSignal );
//     }
//   };

//   var bufferFeatureSignal = function( featureSignal ) {
//     var bufferedFeatureSignal = {};
//     // Math
//     var runningAverage = function( newMeasurement, numOldMeasurements, oldAverage ) {
//       return (oldAverage * numOldMeasurements + newMeasurement) / (numOldMeasurements + 1);
//     }
//     var runningStandardDeviation = function( newMeasurement, numOldMeasurements, oldAvg, newAvg, oldStdev ) {
//       var numNewMeasurements = numOldMeasurements + 1;
//       return Math.sqrt( ( oldStdev^2 * ( numOldMeasurements - 1 )
//       +  ( newMeasurement - oldAvg ) * ( newMeasurement - newAvg ) ) / ( numNewMeasurements - 1 ) )
//     }
//     var average = function( data ) {
//       var sum = data.reduce( function( sum, value ) {
//         return sum + value;
//       }, 0);
//       var avg = sum / data.length;
//       return avg;
//     }
//     var standardDeviation = function ( values ) {
//       var avg = average( values );
//       var squareDiffs = values.map( function( value ) {
//         var diff = value - avg;
//         var sqrDiff = diff * diff;
//         return sqrDiff;
//       });
//       var avgSquareDiff = average( squareDiffs );
//       var stdDev = Math.sqrt( avgSquareDiff );
//       return stdDev;
//     }
//     // Get channels
//     var chans = uiManager.allChannels;
//     // Initialize buffer if needed
//     if ( featureSignalBufferManager.featureSignalBuffer === null ){
//       featureSignalBufferManager.featureSignalBuffer = {};
//       for ( var c = 0; c < chans.length; c++ ) {
//         featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ] = [ ];
//       }
//     }
//     if ( featureSignalBufferManager.runningAverage === null ){
//       featureSignalBufferManager.runningAverage = {};
//       for ( var c = 0; c < chans.length; c++ ) {
//         featureSignalBufferManager.runningAverage[ chans[ c ] ] = [ ];
//       }
//     }
//     if ( featureSignalBufferManager.runningStandardDeviation === null ){
//       featureSignalBufferManager.runningStandardDeviation = {};
//       for ( var c = 0; c < chans.length; c++ ) {
//         featureSignalBufferManager.runningStandardDeviation[ chans[ c ] ] = [ ];
//       }
//     }
//     if ( featureSignalBufferManager.featureSignalBufferLength === Infinity ){
//       // Add to buffer
//       for ( var c = 0; c < chans.length; c++ ) {
//         if ( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].length == 2 ) {
//           featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].shift();
//         }
//         featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].push( featureSignal[ chans[ c ] ] );
//       }
//     } else {
//       // Add to buffer
//       for ( var c = 0; c < chans.length; c++ ) {
//         if ( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].length == featureSignalBufferManager.featureSignalBufferLength ) {
//           featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].shift();
//         }
//         featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].push( featureSignal[ chans[ c ] ] );
//       }
//     }

//     // Create buffered signal
//     for ( var c = 0; c < chans.length; c++ ) {
//       if ( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].length == 1) {
//         featureSignalBufferManager.numBufferPoints = 1;
//         // Calculate running average
//         featureSignalBufferManager.runningAverage[ chans[ c ] ] = 0;
//         // Calculate running standard deviation
//         featureSignalBufferManager.runningStandardDeviation[ chans[ c ] ] = 0;

//         bufferedFeatureSignal[ chans[ c ] ] = 0;
//       }
//       else {
//         featureSignalBufferManager.numBufferPoints += 1;
//         if ( featureSignalBufferManager.featureSignalBufferLength === Infinity ){
//           // Calulate running average
//           var oldAvg = featureSignalBufferManager.runningAverage[ chans[ c ] ];
//           featureSignalBufferManager.runningAverage[ chans[ c ] ] =
//             runningAverage( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ][ 1 ],
//             featureSignalBufferManager.numBufferPoints - 1,
//             featureSignalBufferManager.runningAverage[ chans[ c ] ] );
//           // Calculate running standard deviation
//           featureSignalBufferManager.runningStandardDeviation[ chans[ c ] ] =
//             runningStandardDeviation( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ][ 1 ],
//             featureSignalBufferManager.numBufferPoints - 1,
//             oldAvg,
//           featureSignalBufferManager.runningAverage[ chans[ c ] ],
//             featureSignalBufferManager.runningStandardDeviation[ chans[ c ] ] );

//           bufferedFeatureSignal[ chans[ c ] ] = ( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ][ featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].length - 1 ]
//             -  featureSignalBufferManager.runningAverage[ chans[ c ] ])
//             / featureSignalBufferManager.runningStandardDeviation[ chans[ c ] ];
//           } else {
//             bufferedFeatureSignal[ chans[ c ] ] = ( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ][ featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ].length - 1 ]
//               - average( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ] ) )
//               / standardDeviation( featureSignalBufferManager.featureSignalBuffer[ chans[ c ] ] );
//           }
//       }
//     }
//   return bufferedFeatureSignal
//   }
// }

// var startTrial = function() {

//           // We're starting to transfer a trial, so engage the transfer icon
//           uiManager.showIcon( 'transfer' );
//           // Makes the trial count bold, to indicate we're in a trial
//           uiManager.activateTrialCount();

//           dataSource._bciConnection.execute('Get StimulusCode').then(function (result) {
//             currStimCode = result;
//             $('.stim-display').text(result);
//           });
//                 };

// var ingestTrial = function( trialData ) {

//           // Probably not the best place to put this. but this will update the .stim-display to show what stimulusCode was just presented via BCI2000

//           uiManager.hideIcon( 'transfer' );
//           // Now we're working
//           uiManager.showIcon( 'working' );

//           // Update our statistics
//           dataset.ingest( trialData, currStimCode )
//           .then( function() {
//             if(document.title=="WebFM: Map")
//             {
//               updateDataDisplay();
//             }
//             uiManager.hideIcon( 'working' );

//             uiManager.updateTrialCount( dataset.getTrialCount() );
//             uiManager.deactivateTrialCount();
//           } );
//         };

// var updateDataDisplay = function updateDataDisplay() {

//   uiManager.raster.update( dataset.displayData );
//   uiManager.brain.update( dataset.dataForTime( uiManager.raster.getCursorTime() ) );
//   // uiManager.brain3.update( dataset.dataForTime( uiManager.raster.getCursorTime() ) );
//   var timeBounds = dataset.getTimeBounds();
//   uiManager.raster.updateTimeRange( [timeBounds.start, timeBounds.end] );

//         }

// if(document.title=="WebFM: Map"){
//   uiManager.raster.oncursormove = function( newTime ) {
//     uiManager.updateSelectedTime( newTime );
//     uiManager.brain.update( dataset.dataForTime( newTime ) );
//     uiManager.brain3.update( dataset.dataForTime( newTime ) );
//   };
// }

// uiManager.onsave = function( saveName ) {

//   var putUrl = path.join( apiPath, 'data', subjectName, saveName );
//   // TODO Not so happy to have this be hard-coded like this
//   var standardImport = './.metadata';

//   dataset.put( putUrl, {
//     import: standardImport
//   } )
//   .then( function( response ) {

//     updateRecordListForSubject( subjectName );

//     // TODO Give user feedback
//     console.log( response );

//   } )
//   .catch( function( reason ) {

//     // TODO Give user feedback
//     console.log( reason );

//   } );

// };

// uiManager.onoptionchange = function( option, newValue ) {

//   if ( option == 'stim-trial-start' ) {
//     // updateTrialWindow( { start: newValue } );
//   }
//   if ( option == 'stim-trial-end' ) {
//     // updateTrialWindow( { end: newValue } );
//   }

//   if ( option == 'stim-baseline-start' ) {
//     updateBaselineWindow( { start: newValue } );
//   }
//   if ( option == 'stim-baseline-end' ) {
//     updateBaselineWindow( { end: newValue } );
//   }

//   if ( option == 'stim-timing' ) {
//     if ( onlineMode ) {
//       dataSource.dataFormatter.updateTimingMode( newValue );
//     }
//   }
//   if ( option == 'stim-channel' ) {
//     if ( onlineMode ) {
//       dataSource.dataFormatter.updateTimingChannel( newValue );
//     }
//   }
//   if ( option == 'stim-off' ) {
//     if ( onlineMode ) {
//       dataSource.dataFormatter.updateThreshold( { offValue: newValue } );
//     }
//   }
//   if ( option == 'stim-on' ) {
//     if ( onlineMode ) {
//       dataSource.dataFormatter.updateThreshold( { onValue: newValue } );
//     }
//   }

//   if ( option == 'stim-state' ) {
//     if ( onlineMode ) {
//       console.log(newValue);

//       dataSource.dataFormatter._updateTimingState( newValue );
//     }
//   }
//   if ( option == 'stim-state-off' ) {
//     if ( onlineMode ) {
//       dataSource.dataFormatter.updateThreshold( { offValue: newValue } );
//     }
//   }
//   if ( option == 'stim-off' ) {
//     if ( onlineMode ) {
//       dataSource.dataFormatter.updateThreshold( { onValue: newValue } );
//     }
//   }

// };

// var updateTiming = function( newMode ) {
//   // dataSource.dataFormatter.update
// }
// var updateTrialThreshold = function( newThreshold ) {
// };
// var updateTrialWindow = function( newWindow ) {
//   // TODO ...
// };

// var updateBaselineWindow = function( newWindow ) {

//   uiManager.showIcon( 'working' );

//   dataset.updateBaselineWindow( newWindow )
//   .then( function() {
//     if(document.title=="WebFM: Map")
//     {
//       updateDataDisplay();
//     }
//     uiManager.hideIcon( 'working' );

//   } );

// };

// $( window ).on( 'resize', function() {uiManager.didResize()});

// $( window ).on( 'beforeunload', function() {
//   if ( !dataset.isClean() ) {
//     return "There are unsaved changes to your map. Are you sure you want to leave?";
//   }
// } );