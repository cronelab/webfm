import "./main.scss";
import $ from "jquery";

import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";

import BCI2KWatcher from "./bciwatch.js";
import {loadBrain} from '../loaders.js'
import path from "path";

const apiPath = "/api";
const configPath = "/index/config";

const parameterRecheckDuration = 2000;

const goLiveStates = ["Suspended", "Running"];
const mapItStates = ["Running"];
const infoStates = ["Suspended", "Running"];

// TODO Shouldn't have to edit JS to change look and feel ...
// should use special-purpose CSS classes
var stateClasses = {
  "Not Connected": "text-muted",
  Idle: "text-info",
  Suspended: "text-warning",
  Running: "text-success"
};

let bciWatcher = null;

window.onload = () => {
  bciWatcher = new BCI2KWatcher();
  bciWatcher.onstatechange = bciStateChange;
  loadSubjects();
  getSourceAddress(path.join(configPath,"online"))
  .then(sourceAddress => {
    document.getElementById('source-address').value = sourceAddress;
    bciWatcher.connect(sourceAddress)
  })
  .then(() => bciWatcher.start())
  .catch(reason => console.log(`Could not set up BCI Watcher: ${reason}`));
  
  
  
  document.getElementsByClassName('toggle-online-options')[0].onclick = () => {
    let onlineOptions = document.getElementById('online-options')
    console.log(onlineOptions)
    if (onlineOptions.className.indexOf('d-none') > -1) {
      onlineOptions.classList.remove("d-none");
    } else {
      hideOnlineOptions();
    }
  }
  document.getElementById('new-subject-ok').onclick = () =>{
    $.ajax({
      url: path.join(apiPath, "data", document.getElementById("new-subject-id").value),
      method: "PUT"
    })
      .done(function(data, status, xhr) {
        console.log(status);
        console.log(data);
      })
      .fail(function(xhr, status, err) {
        console.log(status);
        console.log(xhr.responseText);
      });
    };
  document.getElementsByClassName('toggle-new-subject')[0].onclick = () => {
    let newSubjectOptions = document.getElementById('new-subject-options')
    if(newSubjectOptions.className.indexOf('d-none') > -1){
      newSubjectOptions.classList.remove('d-none')
    } else{
      newSubjectOptions.classList.add('d-none')
    }
  }
  document.getElementsByClassName('upload-sensor-geometry')[0].onclick = () => {
    $("#upload-sensor-geometry-input").click(); 
  }

  document.getElementById('source-address-ok').onclick = () => {
    let newSourceAddress = document.getElementById('source-address').value
    localStorage.setItem('sourceAddress', newSourceAddress)
    // Cookies.set("sourceAddress", newSourceAddress);
    // Reset our connection
    bciWatcher.stop();
    setupWatcher();
    hideOnlineOptions();
  }
  document.getElementById('upload-sensor-geometry-input').onchange = () =>{
    let files = $(this).get(0).files;
  
    // TODO This will fail in certain obvious cases; should be caching a
    // current subject state variable
    let subject = window.location.hash.slice(1);
  
    if (files.length > 0) {
      let file = files[0];
  
      // FormData carries the payload for our PUT request
      let formData = new FormData();
  
      // We only care about the first file
      // TODO Get name from jquery element somehow?
      formData.append("sensorGeometry", file, file.name);
  
      // Make an AJAX request
  
      $.ajax({
        url: path.join(apiPath, "geometry", subject),
        method: "PUT",
        data: formData,
        processData: false,
        contentType: false
      })
        .done(function(data, status, xhr) {
          // Reload the newly uploaded brain
          selectSubject(subject);
        })
        .fail(function(xhr, status, err) {
          // TODO GUI for error
          console.log("Upload failed :( " + JSON.stringify(err));
        });
    }
  }

  document.getElementsByClassName('upload-brain-image')[0].onclick = () =>{
    document.getElementById('upload-brain-image-input').click()
  }
  
  document.getElementById('upload-brain-image-input').onchange = () =>{
    var files = $(this).get(0).files;
  
    // TODO This will fail in certain obvious cases; should be caching a
    // current subject state variable
    var subject = window.location.hash.slice(1);
  
    if (files.length > 0) {
      var file = files[0];
  
      // FormData carries the payload for our PUT request
      var formData = new FormData();
  
      // We only care about the first file
      // TODO Get name from jquery element somehow?
      formData.append("brainImage", file, file.name);
  
      // Make an AJAX request
  
      $.ajax({
        url: path.join(apiPath, "brain", subject),
        method: "PUT",
        data: formData,
        processData: false,
        contentType: false
      })
        .done((data, status, xhr) => {
          // Reload the newly uploaded brain
          selectSubject(subject);
        })
        .fail((xhr, status, err) => {
          // TODO GUI for error
          console.log("Upload failed :( " + JSON.stringify(err));
        });
    }

  }
}



let loadSubjects = () => {
  let listPath = path.join('/api/subjects');
  fetch(listPath)
  .then(res => { return res.json()})
  .then(subjects => { 
    subjects.sort().forEach(addSubjectCell);
    selectSubject(window.location.hash.slice(1));
  })
  .catch(err => console.log(err));
};

// Load the records from the server API
let loadRecords = subject => {
  let listPath = path.join('/api/', subject, '/records');
  fetch(listPath)
  .then(res => res.json())
  .then(records => { 
    records.sort().map( record => recordCellAdderFor(record,subject))
  })
  .catch(err => console.log(err))
};


let selectSubject = subject => {

  if (subject.length == 0) return;

  Array.from(document.getElementById('subject-list').children).map(subj => subj.classList.remove('active'))
  document.getElementById(subject).classList.add('active');

  // Clear records for a clean slate
  let recordList = document.getElementById('record-list');
  Array.from(recordList.children).map(rec => recordList.removeChild(rec))

  loadRecords(subject);

  // Load the brain image from the server API
  loadBrain(subject)
};


let getSourceAddress = async (configURI) =>{
    let sourceAddress = localStorage.getItem('sourceAddress')
    // let sourceAddress = Cookies.get("sourceAddress");

    if (sourceAddress === undefined) {
      let response = await fetch(configURI)
      let parameters = await response.json()
      localStorage.setItem('sourceAddress',parameters.sourceAddress)
      return await parameters.sourceAddress
    }
    else{
      return await sourceAddress
    }
};


let parseParameter = async (param) => {
  let parameter = await bciWatcher.getParameter(param);
  let label = null
  let taskName = null
  if(param == "SubjectName"){
    label = document.getElementById('subject-label')
    label.innerHTML = parameter;
  }
  else if(param=="DataFile"){
    label = document.getElementById('task-label')
    if(parameter.length > 0) {
      let dataPathParts = parameter.split(path.sep);
      label.innerHTML = dataPathParts[1];
    }
  }
  if (parameter.length == 0) {
    label.innerHTML = `<small>(${param} is unavailable)</small>`
    setTimeout(() => parseParameter(param), parameterRecheckDuration);
    return;
  }
}

let bciStateChange = newState => {
  document.getElementById('state-label').innerHTML = "<strong>" + newState + "<strong>";
  Object.keys(stateClasses).map(v => {
    if(newState==v){
      document.getElementById('state-label').classList.add(stateClasses[v])
      return
    }
    document.getElementById('state-label').classList.remove(stateClasses[v])
  })

  if (mapItStates.indexOf(newState) >= 0) {
    document.getElementById('map-button').classList.remove('disabled')
  } else {
    document.getElementById('map-button').classList.add('disabled')  }

  if (mapItStates.indexOf(newState) >= 0) {
    document.getElementById('live-button').classList.remove('disabled')
  } else {
    document.getElementById('live-button').classList.add('disabled')  }
  
  if (infoStates.indexOf(newState) >= 0) {
    document.getElementById('info-label').classList.remove('d-none')
    parseParameter("SubjectName");
    parseParameter("DataFile")
  } else {
    document.getElementById('info-label').classList.add('d-none')
    document.getElementById('subject-label').innerHTML = '';
  }
};

let recordCellAdderFor = (record, subject) => {

  let storeParams = () => {
    localStorage.setItem('subject',subject)
    localStorage.setItem('task',record)
  }

  $("<a/>", {
    id: record,
    href: "/replay",
    class: "list-group-item",
    text: record,
    on: {
      click: storeParams
    }
  }).appendTo("#record-list");  
};

let addSubjectCell = subject => {
  let cellClick = () => {
    selectSubject(subject);
  };
  // TODO Need to incorporate number of members for badge
  $("<a/>", {
    id: subject,
    href: "#" + subject,
    class: "list-group-item",
    text: subject,
    on: {
      click: cellClick
    }
    // ,
    // onclick: "document.cookie='WebFM: Map'"
  }).appendTo("#subject-list");
};


let hideOnlineOptions = () => document.getElementById('online-options').classList.add('d-none')








