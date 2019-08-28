import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';
import {
    OnlineDataSource
} from './fmonline'

var minimatch = require('minimatch');
var onlineMode = true
var subjectName = null


let dataset;
let uiManager;
window.onload = async () => {

    let request = await fetch(`/config`)
    let data = await request.json()

    dataset = new fmdata();
    uiManager = new fmui();
    uiManager.config.ui = data;
    uiManager.setup();
    uiManager.raster.oncursormove = newTime => {
        document.getElementsByClassName('fm-time-selected')[0].innerHTML = (newTime > 0 ? '+' : '') + newTime.toFixed(3) + ' s';
        uiManager.brain.update(dataset.dataForTime(newTime));
    };

    uiManager.onsave = function (saveName) {
        dataset.put(`/api/data/${subjectName}/${saveName}`, {
                import: './.metadata'
            })
            .then(response => updateRecordListForSubject(subjectName))
            .catch(reason => console.log(reason));
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
}

var apiPath = '/api';

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

    fetch(`/config`).then(response => response.json()).then(onlineConfig => {
        localStorage.setItem('source-address', onlineConfig.online.sourceAddress);
        dataSource.setConfig(onlineConfig.online);
        prepareOnlineDataSource();
    })
}


var prepareOnlineDataSource = async function () {
    var sourceAddress = localStorage.getItem('source-address')
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

const prepareSubjectDependencies = async () => {

    document.getElementsByClassName('fm-subject-name')[0].innerHTML = subjectName;
    document.getElementsByClassName('fm-subject-name')[1].innerHTML = subjectName;
    document.getElementsByClassName('fm-back')[0].setAttribute('href', `/#${subjectName}`);

    let brainResponse = await fetch(`/api/brain/${subjectName}`)
    let imageData = await brainResponse.text()
    let geoResponse = await fetch(`/api/geometry/${subjectName}`)
    let sensorGeometry = await geoResponse.json()

    dataset.updateMetadata({
        subject: subjectName,
        brainImage: imageData,
        'sensorGeometry': sensorGeometry
    });
    uiManager.brain.setup(imageData, sensorGeometry);

    updateRecordListForSubject(subjectName);
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

    let request = await fetch(`/config`);
    let config = await request.json();

    var taskConfig = matchTaskConfig(taskName, config.tasks);
    if (taskConfig === undefined) {
        return;
    }
    if (taskConfig.trialWindow !== undefined) {
        dataSource.dataFormatter.updateTrialWindow(taskConfig.trialWindow);
    }
    if (taskConfig.baselineWindow !== undefined) {
        dataset.updateBaselineWindow(taskConfig.baselineWindow);
    }

    document.getElementsByClassName('fm-task-name')[0].innerHTML = taskName;
    document.getElementById('fm-option-save-name').value = taskName;

    dataset.updateMetadata({
        setting: {
            task: taskName
        }
    });

};

var updateProperties = properties => uiManager.updateChannelNames(properties.channels);

var ingestSignal = signal => uiManager.scope.update(signal);

var startTrial = function () {
    document.getElementsByClassName('fm-transfer-icon')[0].style.display = '';
    document.getElementsByClassName('fm-trial-label')[0].classList.add('fm-trial-label-active');
};

var ingestTrial = function (trialData) {
    setTimeout(() => document.getElementsByClassName(`fm-transfer-icon`)[0].classList.add('d-none'), 500);
    document.getElementsByClassName(`fm-working-icon`)[0].style.display = '';
    dataset.ingest(trialData)
        .then(function () {
            updateDataDisplay();
            setTimeout(() => document.getElementsByClassName(`fm-working-icon`)[0].classList.add('d-none'), 500);
            uiManager.updateTrialCount(dataset.getTrialCount());

            document.getElementsByClassName('fm-trial-label')[0].classList.remove('fm-trial-label-active');
        });
}
var updateDataDisplay = function () {
    uiManager.raster.update(dataset.displayData);
    uiManager.brain.update(dataset.dataForTime(uiManager.raster.cursorTime));
    var timeBounds = dataset.getTimeBounds();
    if (!uiManager.raster.timeScale) {
        return;
    }
    uiManager.raster.timeScale.range([timeBounds.start, timeBounds.end]);
}





var updateTiming = function (newMode) {
    // dataSource.dataFormatter.update
}
var updateTrialThreshold = function (newThreshold) {};
var updateTrialWindow = function (newWindow) {
    // TODO ...
};
var updateBaselineWindow = function (newWindow) {
    document.getElementsByClassName(`fm-working-icon`)[0].style.display = '';

    dataset.updateBaselineWindow(newWindow)
        .then(function () {
            updateDataDisplay();
            setTimeout(() => document.getElementsByClassName(`fm-working-icon`)[0].classList.add('d-none'), 500);
        });
};



window.onresize = e => {
    uiManager.didResize();

}

window.onbeforeunload = () => {
    if (!dataset.isClean()) {
        return "There are unsaved changes to your map. Are you sure you want to leave?";
    }
}