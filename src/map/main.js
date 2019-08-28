import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';
import {
    OnlineDataSource
} from './fmonline'

let dataset;
let uiManager;
let subject;
let task;
window.onload = async () => {
    subject = localStorage.getItem('mapping_subject').trim();

    let request = await fetch(`/config`)
    let config = await request.json()
    task = localStorage.getItem('mapping_task')
    dataset = new fmdata();
    uiManager = new fmui();
    uiManager.config.ui = config;
    uiManager.setup();
    uiManager.raster.oncursormove = newTime => {
        document.getElementsByClassName('fm-time-selected')[0].innerHTML = (newTime > 0 ? '+' : '') + newTime.toFixed(3) + ' s';
        uiManager.brain.update(dataset.dataForTime(newTime));
    };

    uiManager.onsave = saveName => {
        dataset.put(`/api/data/${subject}/${saveName}`, {
                import: './.metadata'
            })
            .then(response => updateRecordListForSubject(subject))
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
            dataSource.dataFormatter.updateTimingMode(newValue);
        }
        if (option == 'stim-channel') {
            dataSource.dataFormatter.updateTimingChannel(newValue);
        }
        if (option == 'stim-off') {
            dataSource.dataFormatter.updateThreshold({
                offValue: newValue
            });
        }
        if (option == 'stim-on') {
            dataSource.dataFormatter.updateThreshold({
                onValue: newValue
            });
        }
    };

    var sourceAddress = localStorage.getItem('source-address')
    document.getElementsByClassName('fm-subject-name')[0].innerHTML = subject;
    document.getElementsByClassName('fm-subject-name')[1].innerHTML = subject;
    document.getElementsByClassName('fm-back')[0].setAttribute('href', `/#${subject}`);
    document.getElementsByClassName('fm-task-name')[0].innerHTML = task;
    document.getElementById('fm-option-save-name').value = task;


    let imageData = JSON.parse(localStorage.getItem('brain')).brain
    let sensorGeometry = JSON.parse(localStorage.getItem('geometry')).geometry
    dataset.updateMetadata({
        kind: 'high gamma power',
        labels: ['timeseries'],
        subject: subject,
        brainImage: imageData,
        'sensorGeometry': sensorGeometry,
        setting: {
            task: task
        }
    });

    uiManager.brain.setup(imageData, sensorGeometry);
    updateRecordListForSubject(subject);


    var taskConfig = JSON.parse(JSON.stringify(config.tasks.default || {}));
    Object.keys(config.tasks).every(function (configTask) {
        Object.assign(taskConfig, config.tasks[configTask]);
    });

    if (taskConfig.trialWindow !== undefined) {
        dataSource.dataFormatter.updateTrialWindow(taskConfig.trialWindow);
    }
    if (taskConfig.baselineWindow !== undefined) {
        dataset.updateBaselineWindow(taskConfig.baselineWindow);
    }
    dataSource.connect(`ws://${sourceAddress}`)
}

let dataSource = new OnlineDataSource();
dataSource.onproperties = properties => {
    dataset.setupChannels(properties.channels);
    uiManager.updateChannelNames(properties.channels);

};
dataSource.onBufferCreated = () => {
    dataset.updateTimesFromWindow(dataSource.dataFormatter.trialWindow, dataSource.dataFormatter._trialBlocks);
};
dataSource.onStartTrial = () => {
    document.getElementsByClassName('fm-transfer-icon')[0].style.display = '';
    document.getElementsByClassName('fm-trial-label')[0].classList.add('fm-trial-label-active');
}
dataSource.ontrial = trialData => {
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
dataSource.onRawSignal = rawSignal => uiManager.scope.update(rawSignal);


var updateRecordListForSubject = function (theSubject) {
    fetch(`/api/list/${theSubject}`).then(response => response.json())
        .then(records => {
            records.sort();
            uiManager.updateSubjectRecords(records);
        })
};





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