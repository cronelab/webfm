import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';


let dataset;
let uiManager;
var subjectName = localStorage.getItem('subject');
var recordName = localStorage.getItem('record');


window.onload = async () => {
    uiManager = new fmui();
    dataset = new fmdata();
    let request = await fetch(`/config`)
    let data = await request.json()

    uiManager.config.ui = data;
    uiManager.setup();
    uiManager.raster.oncursormove = newTime => {
        document.getElementsByClassName('fm-time-selected')[0].innerHTML = (newTime > 0 ? '+' : '') + newTime.toFixed(3) + ' s';
        uiManager.brain.update(dataset.dataForTime(newTime));
    };

}



fetch(`/api/data/${subjectName}/${recordName}`).then(response => response.json()).then(data => {
    dataset.get(data).then(() => {

        let {
            brainImage,
            sensorGeometry,
            montage,
        } = dataset.metadata;

        document.getElementsByClassName('fm-subject-name')[0].innerHTML = subjectName;
        document.getElementsByClassName('fm-subject-name')[1].innerHTML = subjectName;
        document.getElementsByClassName('fm-back')[0].setAttribute('href', `/#${subjectName}`);

        document.getElementsByClassName('fm-task-name')[0].innerHTML = dataset.metadata.setting.task;
        document.getElementById('fm-option-save-name').value = dataset.metadata.setting.task;

        uiManager.updateChannelNames(montage);
        uiManager.raster.update(dataset.displayData);
        uiManager.brain.setup(brainImage, sensorGeometry);
        uiManager.brain.update(dataset.dataForTime(uiManager.raster.cursorTime));
        let timeBounds = dataset.getTimeBounds();



        if (!uiManager.raster.timeScale) {
            return;
        }
        uiManager.raster.timeScale.range([timeBounds.start, timeBounds.end]);



    })
})




window.onresize = () => uiManager.didResize();