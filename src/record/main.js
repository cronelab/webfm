import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from '../shared/fmui'
import fmdata from '../shared/fmdata';

let uiManager;
window.onload = async () => {
    let subjectName = localStorage.getItem('subject');
    let recordName = localStorage.getItem('record');

    let request = await fetch(`/config`)
    let data = await request.json()
    let dataset = new fmdata();
    uiManager = new fmui();

    uiManager.config.ui = data;
    uiManager.setup();

    fetch(`/api/data/${subjectName}/${recordName}`).then(response => response.json()).then(data => {
        dataset.get(data).then(x => {
            document.getElementsByClassName('fm-subject-name')[0].innerHTML = subjectName;
            document.getElementsByClassName('fm-subject-name')[1].innerHTML = subjectName;
            document.getElementsByClassName('fm-task-name')[0].innerHTML = dataset.metadata.setting.task;
            document.getElementById('fm-option-save-name').value = dataset.metadata.setting.task;
            uiManager.updateChannelNames(dataset.metadata.montage);
            uiManager.raster.update(dataset.displayData);
            uiManager.brain.setup(JSON.parse(localStorage.getItem('brain')).brain, JSON.parse(localStorage.getItem('geometry')).geometry);
            uiManager.brain.update(dataset.dataForTime(uiManager.raster.cursorTime));
            if (!uiManager.raster.timeScale) return;
            uiManager.raster.timeScale.range([dataset.getTimeBounds().start, dataset.getTimeBounds().end]);
        })
    })
    uiManager.raster.oncursormove = newTime => {
        document.getElementsByClassName('fm-time-selected')[0].innerHTML = `${(newTime > 0 ? '+' : '')}${newTime.toFixed(3)} s`;
        uiManager.brain.update(dataset.dataForTime(newTime));
    };
    document.getElementById('playButton').onclick = e => {
        uiManager.brain.update(dataset.dataForTime(0));
    }
}

window.onresize = () => uiManager.didResize();