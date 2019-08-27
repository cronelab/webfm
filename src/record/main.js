import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';


var dataset = new fmdata();
var uiManager = new fmui();

var subjectName = localStorage.getItem('subject');
var recordName = localStorage.getItem('record');

uiManager.loadConfig(`/config`)

const updateProperties = properties => uiManager.updateChannelNames(properties.channels);

const prepareFromDataset = () => {

    uiManager.updateSubjectName(dataset.metadata.subject);

    let brainImage = dataset.metadata.brainImage;
    let sensorGeometry = dataset.metadata.sensorGeometry;

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

fetch(`/api/info/${subjectName}/${recordName}`).then(response => response.json())
    .then(recordUrl => {
        fetch(recordUrl.uri).then(response => response.json()).then(data => {
            dataset.get(data).then(dataset => {
                prepareFromDataset();
                updateDataDisplay()
            })
        })
    })


const updateDataDisplay = () => {
    uiManager.raster.update(dataset.displayData);
    uiManager.brain.update(dataset.dataForTime(uiManager.raster.getCursorTime()));
    let timeBounds = dataset.getTimeBounds();
    uiManager.raster.updateTimeRange([timeBounds.start, timeBounds.end]);
}

uiManager.raster.oncursormove = newTime => {
    uiManager.updateSelectedTime(newTime);
    uiManager.brain.update(dataset.dataForTime(newTime));
};


window.onresize = () => uiManager.didResize();