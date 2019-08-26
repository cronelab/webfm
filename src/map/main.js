import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import path from 'path';
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';

import $ from 'jquery'
window.jQuery = $;
window.$ = $;

import {
    OnlineDataSource
} from './fmonline'


var minimatch = require('minimatch');

var fmstat = require('./fmstat');
var fmgen = require('./fmgen');
var fmfeature = require('./fmfeature');


var onlineMode = true

var subjectName = null
var recordName = null




var apiPath = '/api';
var configPath = '/map/config';
var dataset = new fmdata();

var uiManager = new fmui();
uiManager.loadConfig(path.join(configPath, 'ui'))


// DATA SOURCE SET-UP
var dataSource = null;
if (onlineMode) { // Using BCI2000Web over the net
    dataSource = new OnlineDataSource();
    dataSource.onproperties = function (properties) {
        dataset.setupChannels(properties.channels);
        console.log(properties.channels)
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
}


var prepareOnlineDataSource = async function () {
    var sourceAddress = localStorage.getItem('source-address')
    if (sourceAddress === undefined) {
        let request = await fetch(`${configPath}/online`);
        let data = await request.json()
        localStorage.setItem('source-address', data.sourceAddress);
        resolve(data.sourceAddress);
    }

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
};

var updateRecordListForSubject = function (theSubject) {
    fetch(`${apiPath}/list/${theSubject}`).then(response => response.json())
        .then(records => {
            records.sort();
            uiManager.updateSubjectRecords(records);
        })
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
var prepareTaskDependencies = async function (taskName) {

    let request = await fetch(`${configPath}/tasks`);
    let config = await request.json();

    var taskConfig = matchTaskConfig(taskName, config);
    if (taskConfig === undefined) {
        return;
    }
    if (taskConfig.trialWindow !== undefined) {
        dataSource.dataFormatter.updateTrialWindow(taskConfig.trialWindow);
    }
    if (taskConfig.baselineWindow !== undefined) {
        dataset.updateBaselineWindow(taskConfig.baselineWindow);
    }
    uiManager.updateTaskName(taskName);
    dataset.updateMetadata({
        setting: {
            task: taskName
        }
    });

};



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