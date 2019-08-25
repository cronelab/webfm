import path from 'path';
import $ from 'jquery'
window.jQuery = $;
window.$ = $;
import "./index.scss";
import "bootstrap";

import "@fortawesome/fontawesome-free/js/all";

var d3 = require('d3');

var Cookies = require('js-cookie');
var minimatch = require('minimatch');

d3.horizon = require('../lib/horizon'); // New kludge
import BCI2K from "@cronelab/bci2k";
var cronelib = require('../lib/cronelib');
var fmstat = require('./fmstat');
var fmonline = require('./fmonline');
import fmui from './fmui'
var fmgen = require('./fmgen');
import fmdata from './fmdata';
var fmfeature = require('./fmfeature');

var pathComponents = window.location.pathname.split('/');
console.log(pathComponents)
var modeString = pathComponents[2] || 'online';

var onlineMode = modeString == 'online';
// var loadMode = !onlineMode;
let loadMode = true

var subjectName = "PY19N015";
var recordName = "BrandtPictureNaming_Block1";

// if (loadMode) {
//     subjectName = pathComponents[2] || undefined;
//     recordName = pathComponents[3] || undefined;
// } else {
//     subjectName = pathComponents[3] || undefined;
//     recordName = pathComponents[4] || undefined;
// }


var apiPath = '/api';
var configPath = '/map/config';
var dataset = new fmdata();

// UI
var uiManager = new fmui();
// TODO Handle rejection
uiManager.loadConfig(path.join(configPath, 'ui'))


// DATA SOURCE SET-UP
var dataSource = null;
if (onlineMode) { // Using BCI2000Web over the net
    dataSource = new fmonline.OnlineDataSource();
    dataSource.onproperties = function (properties) {
        dataset.setupChannels(properties.channels);
        updateProperties(properties);
    };
    dataSource.onBufferCreated = function () {
        dataset.updateTimesFromWindow(dataSource.getTrialWindow(), dataSource.getTrialLength());
    };
    dataSource.onStartTrial = function () {
        startTrial();
    };
    dataSource.ontrial = function (trialData) {
        ingestTrial(trialData);
    };
    dataSource.onRawSignal = function (rawSignal) {
        ingestSignal(rawSignal);
    };

    fetch(path.join(configPath, 'online')).then(response => response.json()).then(onlineConfig => {
        dataSource.setConfig(onlineConfig);
        prepareOnlineDataSource();

    })

    // dataSource.loadConfig( onlineConfig, taskConfig )
    //             .then( function() {
    //                 prepareOnlineDataSource();
    //             } )
    //             .catch( function( reason ) {    // TODO Respond intelligently
    //                 console.log( reason );
    //             } );

}

var getSourceAddress = function () {
    return new Promise(function (resolve, reject) {
        var sourceAddress = Cookies.get('sourceAddress');
        if (sourceAddress === undefined) {
            var configURI = path.join(configPath, 'online');
            fetch(configURI).then(response => response.json()).then(data => {
                Cookies.set('sourceAddress', data.sourceAddress);
                resolve(data.sourceAddress);
            })
        }
        resolve(sourceAddress);
    });
};

var prepareOnlineDataSource = function () {
    getSourceAddress()
        .then(function (sourceAddress) {
            dataSource.connect(`ws://${sourceAddress}`)
                .then(function () {
                    dataset.updateMetadata({
                        kind: 'high gamma power',
                        labels: ['timeseries']
                    });
                    dataSource.getParameter('SubjectName')
                        .then(function (result) {
                            subjectName = result.trim();
                            prepareSubjectDependencies(subjectName);
                        })
                        .catch(function (reason) {
                            console.log('Could not obtain SubjectName: ' + reason);
                        });
                    dataSource.getParameter('DataFile')
                        .then(function (result) {
                            // TODO Error checking
                            var taskName = result.trim().split('/')[1];
                            prepareTaskDependencies(taskName);
                        })
                        .catch(function (reason) {
                            console.log('Could not obtain DataFile: ' + reason);
                        });
                })
                .catch(function (reason) { // TODO Something intelligent
                    console.log(reason);
                });
        });
};

var updateRecordListForSubject = function (theSubject) {

    cronelib.promiseJSON(path.join(apiPath, 'list', theSubject))
        .then(function (records) {
            // Ensure consistent ordering
            records.sort();
            // Update the save page with the records
            uiManager.updateSubjectRecords(records);
        })
        .catch(function (reason) {
            // TODO Handle errors
            console.log(err);
        });

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

var prepareSubjectDependencies = function (theSubject) {

    // Update UI elements that depend on subject
    uiManager.updateSubjectName(subjectName);

    // Update our data's knowledge of subject
    dataset.updateMetadata({
        subject: subjectName
    });

    // First we'll load the brain
    var loadSubjectBrain = function () {
        return new Promise(function (resolve, reject) {
            $.get(path.join(apiPath, 'brain', theSubject))
                .done(function (imageData) {
                    // Put the imageData into our metadata
                    dataset.updateMetadata({
                        brainImage: imageData
                    });
                    // Pass the data down the chain
                    resolve(imageData);
                })
                .fail(function (req, reason, err) {
                    reject('Could not load subject brain: ' + reason);
                });
        });
    };

    // Next we'll load the sensor geometry
    var loadSubjectGeometry = function () {
        return new Promise(function (resolve, reject) {
            $.get(path.join(apiPath, 'geometry', theSubject))
                .done(function (sensorGeometry) {
                    // Put the geometry into our metadata
                    dataset.updateMetadata({
                        'sensorGeometry': sensorGeometry
                    });
                    // Pass the data down the chain
                    resolve(sensorGeometry);
                })
                .fail(function (req, reason, err) {
                    reject('Could not load subject sensor geometry: ' + reason);
                });
        });
    };

    // Execute both, and collate the results
    Promise.all([
            loadSubjectBrain(),
            loadSubjectGeometry()
        ])
        .then(function (data) {

            var imageData = data[0];
            var sensorGeometry = data[1];

            // We have what we need, make the brain plot!
            uiManager.brain.setup(imageData, sensorGeometry);

        })
        .catch(function (reason) {
            console.log(reason);
        });

    updateRecordListForSubject(theSubject);


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

var matchTaskConfig = function (taskName, config) {
    var taskConfig = JSON.parse(JSON.stringify(config.default || {}));
    Object.keys(config).every(function (configTask) {
        if (minimatch(taskName, configTask)) {
            Object.assign(taskConfig, config[configTask]);
            return false; // "break"
        }
        return true;
    });
    return taskConfig;
}
var prepareTaskDependencies = function (taskName) {
    cronelib.promiseJSON(path.join(configPath, 'tasks'))
        .then(function (config) {
            return new Promise(function (resolve, reject) {
                var taskConfig = matchTaskConfig(taskName, config);
                if (taskConfig === undefined) {
                    reject('No suitable task config present.');
                    return;
                }
                if (taskConfig.trialWindow !== undefined) {
                    // TODO Kludgey?
                    dataSource.dataFormatter.updateTrialWindow(taskConfig.trialWindow);
                }
                if (taskConfig.baselineWindow !== undefined) {
                    dataset.updateBaselineWindow(taskConfig.baselineWindow);
                }
            });
        })
        .catch(function (reason) {
            console.log('Could not load task config: ' + reason);
        });
    uiManager.updateTaskName(taskName);
    dataset.updateMetadata({
        setting: {
            task: taskName
        }
    });

};



// TODO Naming semantics imply it takes dataset as argument (better design anyway)
var prepareFromDataset = function () {

    uiManager.updateSubjectName(dataset.metadata.subject);

    // Update brain image & sensor geometry
    var brainImage = dataset.metadata.brainImage;
    var sensorGeometry = dataset.metadata.sensorGeometry;

    if (brainImage === undefined) {
        if (sensorGeometry === undefined) {}
    } else {
        if (sensorGeometry === undefined) {} else {
            uiManager.brain.setup(brainImage, sensorGeometry);
        }
    }
    if (dataset.metadata.setting !== undefined) {
        if (dataset.metadata.setting.task !== undefined) {
            uiManager.updateTaskName(dataset.metadata.setting.task);
        } else {
            uiManager.updateTaskName('(unknown)');
        }
    } else {
        uiManager.updateTaskName('(unknown)');
    }
    updateProperties({
        channels: dataset.metadata.montage
    });

};

if (loadMode) { // Using data loaded from the hive
    var infoPath = `/api/info/${subjectName}/${recordName}`;
    fetch(infoPath).then(response => response.json())
        .then(recordUrl => {
            fetch(recordUrl.uri).then(response => response.json()).then(data => {
                dataset.get(data).then(dataset => {
                    prepareFromDataset();
                    updateDataDisplay()
                })
            })
        })
}


var updateProperties = properties => uiManager.updateChannelNames(properties.channels);

var ingestSignal = signal => uiManager.scope.update(signal);

var startTrial = function () {
    uiManager.showIcon('transfer');
    uiManager.activateTrialCount();
};

var ingestTrial = function (trialData) {
    uiManager.hideIcon('transfer');
    uiManager.showIcon('working');
    dataset.ingest(trialData)
        .then(function () {
            updateDataDisplay();
            uiManager.hideIcon('working');
            uiManager.updateTrialCount(dataset.getTrialCount());
            uiManager.deactivateTrialCount();

        });
}
var updateDataDisplay = function () {
    uiManager.raster.update(dataset.displayData);
    uiManager.brain.update(dataset.dataForTime(uiManager.raster.getCursorTime()));
    var timeBounds = dataset.getTimeBounds();
    uiManager.raster.updateTimeRange([timeBounds.start, timeBounds.end]);
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

uiManager.raster.oncursormove = function (newTime) {

    uiManager.updateSelectedTime(newTime);

    /*
    var meanDataSlice = dataForTime( newTime );
    uiManager.brain.update( meanDataSlice );
    */

    uiManager.brain.update(dataset.dataForTime(newTime));

};

uiManager.onsave = function (saveName) {
    var putUrl = path.join(apiPath, 'data', subjectName, saveName);
    var standardImport = './.metadata';
    dataset.put(putUrl, {
            import: standardImport
        })
        .then(function (response) {
            updateRecordListForSubject(subjectName);
        })
        .catch(function (reason) {
            console.log(reason);
        });
};

uiManager.onoptionchange = function (option, newValue) {

    if (option == 'stim-trial-start') {
        // updateTrialWindow( { start: newValue } );
    }
    if (option == 'stim-trial-end') {
        // updateTrialWindow( { end: newValue } );
    }

    if (option == 'stim-baseline-start') {
        updateBaselineWindow({
            start: newValue
        });
    }
    if (option == 'stim-baseline-end') {
        updateBaselineWindow({
            end: newValue
        });
    }

    if (option == 'stim-timing') {
        if (onlineMode) {
            dataSource.dataFormatter.updateTimingMode(newValue);
        }
    }
    if (option == 'stim-channel') {
        if (onlineMode) {
            dataSource.dataFormatter.updateTimingChannel(newValue);
        }
    }
    if (option == 'stim-off') {
        if (onlineMode) {
            dataSource.dataFormatter.updateThreshold({
                offValue: newValue
            });
        }
    }
    if (option == 'stim-on') {
        if (onlineMode) {
            dataSource.dataFormatter.updateThreshold({
                onValue: newValue
            });
        }
    }
};

var updateTiming = function (newMode) {
    // dataSource.dataFormatter.update
}
var updateTrialThreshold = function (newThreshold) {};
var updateTrialWindow = function (newWindow) {
    // TODO ...
};
var updateBaselineWindow = function (newWindow) {
    uiManager.showIcon('working');
    dataset.updateBaselineWindow(newWindow)
        .then(function () {
            updateDataDisplay();
            uiManager.hideIcon('working');
        });
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

$(window).on('resize', function () {
    uiManager.didResize();
});

$(window).on('beforeunload', function () {
    if (!dataset.isClean()) {
        return "There are unsaved changes to your map. Are you sure you want to leave?";
    }
});