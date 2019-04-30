import "./main.scss";
import "@fortawesome/fontawesome-free/js/all";
import "bootstrap";
import path from "path";
import BCI2K from 'bci2k'
import {
  loadBrain,
  loadRecords,
  loadSubjects
} from '../loaders.js'

const bci = new BCI2K();

window.onload = () => {
  loadSubjects().then(subjects => {
    subjects.sort().forEach(subject => {
      let subjectCell = document.createElement("a");
      subjectCell.id = subject;
      subjectCell.href = '#';
      subjectCell.classList = 'list-group-item text-center';
      subjectCell.innerHTML = subject;
      subjectCell.onclick = () => selectSubject(subject => {
        if (subject.length == 0) return;
        Array.from(document.getElementById('subject-list').children).map(subj => subj.classList.remove('active'))
        document.getElementById(subject).classList.add('active');

        // Clear records for a clean slate
        let recordList = document.getElementById('record-list');
        Array.from(recordList.children).map(rec => recordList.removeChild(rec))

        loadRecords(subject)
          .then(records => {
            records.sort().map(record => (record, subject) => {
              let recordCell = document.createElement('a');
              recordCell.id = record;
              recordCell.href = "/replay";
              recordCell.classList = "list-group-item";
              recordCell.innerHTML = record;
              recordCell.onclick = () => {
                localStorage.setItem('subject', subject)
                localStorage.setItem('task', record)
              };
              document.getElementById('record-list').appendChild(recordCell);
            })
          })
        // Load the brain image from the server
        loadBrain(subject)
      });
      document.getElementById('subject-list').appendChild(subjectCell);
    });
  })
  bci.connect('127.0.0.1');
  bci.onconnect = e => {
    setInterval(() => {
      bci
        .execute("Get System State", result => result)
        .then(state => document.getElementById('bciConnectionStatus').innerHTML = state.trim());
      parseParameter("SubjectName");
      parseParameter("DataFile")
    }, 1000);
  };
}

let parseParameter = async (param) => {
  let parameter = await bci.execute(`Get Parameter ${param}`);
  let label1 = document.getElementById('dataFileInfo1')
  let label2 = document.getElementById('dataFileInfo2')
  if (param == "SubjectName") {
    label1.innerHTML = `${parameter} -`;
  } else if (param == "DataFile") {
    if (parameter.length > 0) {
      let dataPathParts = parameter.split(path.sep);
      label2.innerHTML = `- ${dataPathParts[1]}`;
    }
  }
}

let canvas = document.getElementById('geometryCanvas');
let electrodeGroup = null;
let electrodeItem = null;
let positionClicked = null;
let geometryStore = {};
let electrodeHolder = []
let electrodePositionHolder = []
let count = 1;
let ctx = canvas.getContext("2d");

canvas.addEventListener('click', evt => {
  evt.preventDefault();
  let electrodeGroupHolder = document.getElementById(electrodeGroup);
  let electrode = `${electrodeGroup}${count}`
  let rect = canvas.getBoundingClientRect();
  positionClicked = {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
  ctx.beginPath();
  ctx.arc(positionClicked.x, positionClicked.y, 1, 0, Math.PI * 2, false);
  ctx.stroke();
  ctx.fillStyle = 'red';
  ctx.fill();
  electrodeItem = document.createElement('a');
  electrodeItem.className = 'list-group-item electrode'
  electrodeItem.href = '#'
  electrodeItem.innerHTML = electrode
  electrodeItem.id = electrode
  Array.from(document.getElementsByClassName('electrode')).forEach(elec => {
    elec.classList.remove('active')
  })


  electrodeItem.onclick = () => {
    Array.from(document.getElementsByClassName('electrode')).forEach(elec => {
      elec.classList.remove('active')
    })
    document.getElementById(electrode).classList.add('active')
  };
  electrodeGroupHolder.appendChild(electrodeItem);
  count++;
  electrodeHolder.push(electrode);
  electrodePositionHolder.push({
    x: positionClicked.x / canvas.width,
    y: positionClicked.y / canvas.height
  });

  geometryStore = {
    electrodeName: electrodeHolder,
    electrodePosition: electrodePositionHolder
  }
})

document.onkeydown = e => {
  if (e.code == 'KeyX') {
    Array.from(document.getElementsByClassName('electrode')).forEach(elec => {
      if (elec.classList.contains('active')) {
        let indexToRemove = geometryStore.electrodeName.indexOf(elec.id);
        ctx.clearRect(geometryStore.electrodePosition[indexToRemove].x - 2, geometryStore.electrodePosition[indexToRemove].y - 2, 10, 10);
        geometryStore.electrodeName.splice(indexToRemove, 1);
        geometryStore.electrodePosition.splice(indexToRemove, 1);
        elec.remove();
        count--;
      }
    })
  }
}

document.getElementById("geometryButton").onclick = () => {
  count = 1;
  let canvas = document.getElementById('geometryCanvas');
  let canvasBrain = document.getElementsByClassName('fm-brain-2D')[0]
  if (canvas.width != canvasBrain.width) {
    canvas.width = canvasBrain.width;
    canvas.height = canvasBrain.height;
  }
  let electrodeList = document.getElementById('electrodeList')
  let electrodeListItem = document.createElement('ul');
  electrodeGroup = document.getElementById('geometryCreator').value;
  electrodeListItem.setAttribute('class', 'list-group');
  electrodeListItem.id = electrodeGroup;
  electrodeListItem.innerHTML = electrodeGroup;
  electrodeList.appendChild(electrodeListItem);
}

document.getElementById("saveGeometry").onclick = () => {
  fetch(`/api/${document.getElementById('subjectEntry').value}/geometry`, {
      method: 'PUT',
      body: JSON.stringify(geometryStore),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
    .then(response => console.log('Success:', JSON.stringify(response)))
    .catch(error => console.error('Error:', error));
}

document.getElementById("createSubject").onclick = () => {
  let subjFile = document.getElementById('subjectBrainUpload');
  const data = new URLSearchParams();
  for (const pair of new FormData(subjFile)) {
    data.append(pair[0], pair[1]);
  }
  let formData = new FormData(subjFile)
  fetch(`/api/${document.getElementById('subjectEntry').value}/brain`, {
      method: 'post',
      body: formData,
    }).then(res => res.text())
    .then(response => {
      loadBrain(`${document.getElementById('subjectEntry').value}`)
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('saveNotes').onclick = () => {
  fetch(`/api/${document.getElementById('subjectEntry').value}/notes`, {
    method: 'PUT',
    body: JSON.stringify({
      note: document.getElementById('webfmNotes').value
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}