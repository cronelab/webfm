import path from 'path';
import "bootstrap";
import "./index.scss";
import "@fortawesome/fontawesome-free/js/all";
import BCI2K from "@cronelab/bci2k";

let parameterRecheckDuration = 2000;
let _bciConnection = null;
let currentState = 'Not Connected';
let watching = false;
let config = null;

const _updateState = (newState) => {
    if (currentState != newState) {
        currentState = newState;
        bciStateChange(currentState);
    }
}
let goLiveStates = ['Suspended', 'Running'];
let mapItStates = ['Running'];
let infoStates = ['Suspended', 'Running'];
let stateClasses = {
    'Not Connected': 'text-muted',
    'Idle': 'text-info',
    'Suspended': 'text-warning',
    'Running': 'text-success'
};

let bciStateChange = newState => {
    document.getElementById('state-label').innerHTML = '<strong>' + newState + '<strong>';
    Object.keys(stateClasses).map(v => {
        if (newState == v) {
            document.getElementById('state-label').classList.add(stateClasses[v]);
            return;
        }
        document.getElementById('state-label').classList.remove(stateClasses[v]);

    })
    if (mapItStates.indexOf(newState) >= 0) {
        document.getElementById('map-button').classList.remove('disabled');
    } else {
        document.getElementById('map-button').classList.add('disabled');
    }

    if (goLiveStates.indexOf(newState) >= 0) {
        document.getElementById('live-button').classList.remove('disabled');
    } else {
        document.getElementById('live-button').classList.add('disabled');
    }

    if (infoStates.indexOf(newState) >= 0) {
        document.getElementById('info-label').classList.remove('d-none');
        getSubjectName();
        getTaskName();
    } else {
        document.getElementById('info-label').classList.add('d-none');
        document.getElementById('subject-label').innerHTML = '';
    }
};

const _checkState = () => {
    let tryLaterIfWatching = () => {
        if (watching) {
            setTimeout(() => _checkState(), config.online.checkStateInterval);
        }
    };

    if (!_bciConnection.connected()) {
        _updateState('Not Connected');
        tryLaterIfWatching();
        return;
    }

    _bciConnection.execute('Get System State', result => {
        let newState = result.output.trim();
        _updateState(newState);
        tryLaterIfWatching();
    });
}

let setupWatcher = async () => {
    _bciConnection = new BCI2K.bciOperator();
    let configURIRes = await fetch('/config');
    config = await configURIRes.json();

    let localSourceAddress = localStorage.getItem('source-address');
    if (localSourceAddress === null) {
        localSourceAddress = config.online.sourceAddress;
    }
    _bciConnection.connect(`ws://${localSourceAddress}`).then(event => {
            _updateState('Connected');
            watching = true;
            setTimeout(() => _checkState(), 0);
            return event;
        })
        .catch(reason => console.log('Could not set up BCI Watcher: ' + reason));
};

let getSubjectName = async () => {
    let subjectName = await _bciConnection.execute('Get Parameter SubjectName');
    if (subjectName.length == 0) {
        document.getElementById('subject-label').innerHTML = '<small>(No SubjectName set.)</small>';
        setTimeout(() => getSubjectName(), parameterRecheckDuration);
        return;
    }
    document.getElementById('subject-label').innerHTML = subjectName;
};

let getTaskName = async () => {
    let data = await _bciConnection.execute('Get Parameter DataFile');
    if (data.length == 0) {
        document.getElementById('task-label').innerHTML = '<small>(No DataFile set.)</small>';
        setTimeout(() => getTaskName(), parameterRecheckDuration);
        return;
    }
    let dataPathParts = data.split(path.sep);
    let taskName = dataPathParts[1];
    document.getElementById('task-label').innerHTML = taskName;
};


let addSubjectCell = subject => {
    let newSubject = document.createElement('a');
    newSubject.id = subject;
    newSubject.href = `#${subject}`;
    newSubject.classList.add('list-group-item');
    newSubject.innerText = subject;
    newSubject.onclick = () => selectSubject(subject);
    document.getElementById('subject-list').append(newSubject);
};

let loadBrain = async subject => {
    let brainPath = `/api/brain/${subject}`;
    let response = await fetch(brainPath);
    let brain = await response.text();
    document.getElementById('main-brain').setAttribute('src', brain);
    scroll(0, 0)
};

let loadRecords = async (subject) => {
    let listPath = `/api/list/${subject}`;
    let listPathRes = await fetch(listPath);
    let records = await listPathRes.json();
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
let selectSubject = (subject) => {
    localStorage.setItem('subject', subject);
    document.getElementById('subject-list').querySelectorAll('.active').forEach(e => {
        e.classList.remove('active')
    })
    if (subject.length == 0) {
        return;
    }
    document.getElementById(subject).classList.add('active');
    let recordList = document.getElementById('record-list')
    while (recordList.hasChildNodes()) {
        recordList.removeChild(recordList.firstChild);
    }
    loadRecords(subject);
    loadBrain(subject);

};

let loadSubjects = async () => {
    let listPath = `/api/list`;
    let listPathRes = await fetch(listPath);
    let subjects = await listPathRes.json()
    subjects.sort();
    subjects.forEach(addSubjectCell);
    let hashSubject = window.location.hash.slice(1);
    selectSubject(hashSubject);
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
    watching = false;
    setupWatcher();
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

window.onload = () => {
    loadSubjects();
    setupWatcher();
};