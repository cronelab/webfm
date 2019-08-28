import "bootstrap";
import "./index.scss";
import "@fortawesome/fontawesome-free/js/all";
import {
    fetchAndStoreBrain,
    fetchAndStoreGeometry
} from '../shared/loaders'
import path from 'path'

import BCI2K from "@cronelab/bci2k";
let bciOperator = new BCI2K.bciOperator();

window.onload = async () => {
    let listPathRes = await fetch(`/api/list`);
    let configURIRes = await fetch('/config');
    let subjects = await listPathRes.json()
    let config = await configURIRes.json();

    subjects.sort();
    addSubjectCell(subjects)
    selectSubject(subjects[0]);

    let localSourceAddress = localStorage.getItem('source-address') || config.online.sourceAddress

    bciOperator.connect(`ws://${localSourceAddress}`).then(event => bciOperator.stateListen())
};

bciOperator.onStateChange = currentState => {
    let stateClasses = {
        'Not Connected': 'text-muted',
        'Idle': 'text-info',
        'Suspended': 'text-warning',
        'Running': 'text-success'
    };
    let stateLabel = document.getElementById('state-label')

    stateLabel.innerHTML = '<strong>' + currentState + '<strong>';
    Object.keys(stateClasses).map(v => {
        if (currentState == v) {
            stateLabel.classList.add(stateClasses[v]);
            return;
        }
        stateLabel.classList.remove(stateClasses[v]);
    })
    if (currentState == 'Running') {
        document.getElementById('map-button').classList.remove('disabled');
    } else {
        document.getElementById('map-button').classList.add('disabled');
    }

    bciOperator.getSubjectName().then(subjectName => document.getElementById('subject-label').innerHTML = subjectName)
    bciOperator.getTaskName().then(taskName => document.getElementById('task-label').innerHTML = taskName.split(path.sep)[1])
}

let addSubjectCell = subjects => {
    let PYSubjects = [];
    let otherSubjects = [];
    PYSubjects = subjects.filter(subj => subj.substring(0, 2) == "PY")
    otherSubjects = subjects.filter(subj => subj.substring(0, 2) != "PY")

    let dropdowns = PYSubjects.map(subj => {
        let dropItem = document.createElement('div')
        dropItem.classList.add('dropdown-item')
        dropItem.id = subj;
        dropItem.href = `#${subj}`
        dropItem.innerHTML = subj;
        dropItem.onclick = () => selectSubject(subj);
        return dropItem
    })

    let uniquePYYears = [...new Set(PYSubjects.map(year => year.substring(2, 4)))]
    uniquePYYears.forEach(year => {

        let btnGroup = document.createElement('div')
        btnGroup.classList.add('btn-group')
        btnGroup.classList.add('dropright')


        let newYear = document.createElement('button');
        newYear.classList.add('btn')
        newYear.classList.add('btn-secondary')
        newYear.classList.add('dropdown-toggle')
        newYear.id = `PY${year}`
        newYear.innerText = `PY${year}`;
        newYear.setAttribute('data-toggle', "dropdown")


        let dropMenu = document.createElement('div')
        dropMenu.classList.add('dropdown-menu')

        btnGroup.append(dropMenu)
        btnGroup.append(newYear)

        dropdowns.forEach((dropItem, index) => {
            if (dropItem.innerHTML.substring(2, 4) == year) {
                dropMenu.append(dropItem)
            }
        })
        document.getElementById('subject-list').append(btnGroup);
    })

    otherSubjects.forEach(subject => {
        let newSubject = document.createElement('a');
        newSubject.id = subject;
        newSubject.href = `#${subject}`;
        newSubject.classList.add('list-group-item');
        newSubject.innerText = subject;
        newSubject.onclick = () => selectSubject(subject);
        document.getElementById('subject-list').append(newSubject);
    })
};


let selectSubject = async (subject) => {
    let listPath = `/api/list/${subject}`;
    let listPathRes = await fetch(listPath);
    let records = await listPathRes.json();

    fetchAndStoreBrain(subject).then(brain => {
        document.getElementById('main-brain').setAttribute('src', brain);
        scroll(0, 0)
    })

    fetchAndStoreGeometry(subject);

    localStorage.setItem('subject', subject);
    document.getElementById('subject-list').querySelectorAll('.active').forEach(e => {
        e.classList.remove('active')
    })
    document.getElementById(subject).classList.add('active');
    let recordList = document.getElementById('record-list')
    while (recordList.hasChildNodes()) {
        recordList.removeChild(recordList.firstChild);
    }
    records.sort();
    records.forEach(record => {
        let newRecord = document.createElement('a');
        newRecord.id = record;
        newRecord.href = `/record`;
        newRecord.classList.add('list-group-item');
        newRecord.innerText = record;
        newRecord.onclick = () => localStorage.setItem('record', record);
        document.getElementById('record-list').append(newRecord);
    });
    scroll(0, 0)
};

document.getElementsByClassName('toggle-online-options')[0].onclick = () => {
    if (document.getElementById('online-options').classList.contains('d-none')) {
        document.getElementById('online-options').classList.remove('d-none');
    } else {
        document.getElementById('online-options').classList.add('d-none')
    }
};
document.getElementsByClassName('toggle-new-subject')[0].onclick = () => {
    if (document.getElementById('new-subject-options').classList.contains('d-none')) {
        document.getElementById('new-subject-options').classList.remove('d-none');
    } else {
        document.getElementById('new-subject-options').classList.add('d-none');
    }
};


document.getElementById('source-address-ok').onclick = () => {
    let newSourceAddress = document.getElementById('source-address').value;
    localStorage.setItem('source-address', newSourceAddress)
    bciOperator.connect(`ws://${newSourceAddress}`).then(event => bciOperator.stateListen())
};

document.getElementById('new-subject-ok').onclick = () => {
    let newSubjectId = document.getElementById('new-subject-id').value;
    fetch(`/api/data/${newSubjectId}`, {
        method: 'PUT'
    }).then(response => {
        addSubjectCell(newSubjectId);
        selectSubject(newSubjectId)
        location.href = `#${newSubjectId}`
    })
};

document.getElementsByClassName('upload-sensor-geometry')[0].onclick = () => document.getElementById('upload-sensor-geometry-input').click();
document.getElementById('upload-sensor-geometry-input').onchange = async e => {
    let file = e.target.files[0];
    let subject = window.location.hash.slice(1);
    let formData = new FormData();

    formData.append('sensorGeometry', file, file.name);

    await fetch(`/api/geometry/${subject}`, {
        method: 'PUT',
        body: formData
    })
};

document.getElementsByClassName('upload-brain-image')[0].onclick = () => document.getElementById('upload-brain-image-input').click();
document.getElementById('upload-brain-image-input').onchange = async e => {
    let file = e.target.files[0];
    let subject = window.location.hash.slice(1);
    let formData = new FormData();
    formData.append('brainImage', file, file.name);

    await fetch(`/api/brain/${subject}`, {
        method: 'PUT',
        body: formData
    })
    selectSubject(subject)
};