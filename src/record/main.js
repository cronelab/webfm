import path from 'path';
// import $ from 'jquery'
// window.jQuery = $;
// window.$ = $;
import "./index.scss";
import "bootstrap";

import "@fortawesome/fontawesome-free/js/all";

var d3 = require('d3');

var Cookies = require('js-cookie');
var minimatch = require('minimatch');

d3.horizon = require('../lib/horizon'); // New kludge
// var cronelib = require('../lib/cronelib');
// var fmonline = require('./fmonline');
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';

var pathComponents = window.location.pathname.split('/');
console.log(pathComponents)
var modeString = pathComponents[2] || 'online';
let loadMode = true



var apiPath = '/api';
var configPath = '/map/config';
var dataset = new fmdata();

// UI
var uiManager = new fmui();



var subjectName = "PY19N015";
var recordName = "BrandtPictureNaming_Block1";


// TODO Handle rejection
uiManager.loadConfig(path.join(configPath, 'ui'))


// DATA SOURCE SET-UP
var dataSource = null;


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

var prepareSubjectDependencies = function (theSubject) {
    uiManager.updateSubjectName(subjectName);
    dataset.updateMetadata({
        subject: subjectName
    });

    var loadSubjectBrain = function () {
        fetch(`/api/brain/${theSubject}`).then(response => response.json()).then(imageData => {
            dataset.updateMetadata({
                brainImage: imageData
            });

        })
    };
    var loadSubjectGeometry = function () {
        fetch(`/api/geometry/${theSubject}`).then(response => response.json()).then(sensorGeometry => {
            dataset.updateMetadata({
                'sensorGeometry': sensorGeometry
            });

        })

    };
    Promise.all([
            loadSubjectBrain(),
            loadSubjectGeometry()
        ])
        .then(function (data) {
            var imageData = data[0];
            var sensorGeometry = data[1];
            uiManager.brain.setup(imageData, sensorGeometry);

        })
        .catch(function (reason) {
            console.log(reason);
        });
    updateRecordListForSubject(theSubject);
};


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

var updateDataDisplay = function () {
    uiManager.raster.update(dataset.displayData);
    uiManager.brain.update(dataset.dataForTime(uiManager.raster.getCursorTime()));
    var timeBounds = dataset.getTimeBounds();
    uiManager.raster.updateTimeRange([timeBounds.start, timeBounds.end]);
}

uiManager.raster.oncursormove = function (newTime) {
    uiManager.updateSelectedTime(newTime);
    uiManager.brain.update(dataset.dataForTime(newTime));
};


window.onresize = () => uiManager.didResize();