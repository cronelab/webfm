import "bootstrap";
import "./index.scss";
import "@fortawesome/fontawesome-free/js/all";
import {
	fetchAndStoreBrain,
	fetchAndStoreGeometry
} from "../shared/loaders";
import path from "path";
import BCI2K from "bci2k";
import {
	select
} from "d3-selection";

let bciOperator = new BCI2K.bciOperator();
let $ = require('jquery');

window.onload = async () => {
	document.getElementById("info-label").classList.remove("d-none");
	document.getElementById("map-button").classList.remove("disabled");

	let listPathRes = await fetch(`/api/list`);
	let subjects = await listPathRes.json();
	if (subjects.length > 0) {
		subjects.sort();
		addSubjectCell(subjects);
		let currentSubject = localStorage.getItem("subject")
		if (currentSubject != null) {
			selectSubject(currentSubject);
		}
		else {
			selectSubject(subjects[0]);

		}
	}

	let localSourceAddress =
		localStorage.getItem("source-address") || "127.0.0.1";
	localStorage.setItem("source-address", localSourceAddress);
	bciOperator
		.connect(`ws://${localSourceAddress}`)
		.then(event => bciOperator.stateListen())
		.catch(err => {
			console.log(err)
			bciOperator.onStateChange("Not Connected")
		})
};

bciOperator.onStateChange = currentState => {
	let stateClasses = {
		"Not Connected": "text-muted",
		Idle: "text-info",
		Suspended: "text-warning",
		Running: "text-success"
	};
	let stateLabel = document.getElementById("state-label");

	stateLabel.innerHTML = "<strong>" + currentState + "<strong>";
	Object.keys(stateClasses).map(v => {
		if (currentState == v) {
			stateLabel.classList.add(stateClasses[v]);
			return;
		}
		stateLabel.classList.remove(stateClasses[v]);
	});

	if (currentState == "Running" || currentState == "Suspended" || currentState == "Resting" || currentState == "Initialization") {
		bciOperator.getSubjectName().then(subjectName => {
			document.getElementById("subject-label").innerHTML = subjectName.trim();
			localStorage.setItem("subject", subjectName.trim());
			fetchAndStoreBrain(subjectName.trim());
			fetchAndStoreGeometry(subjectName.trim());
			//   selectSubject(subjectName.trim());
		});
		bciOperator.getTaskName().then(taskName => {
			document.getElementById("task-label").innerHTML = taskName.split(
				path.sep
			)[1];
			localStorage.setItem("task", taskName.split(path.sep)[1]);
		});
		document.getElementById("map-button").classList.remove("disabled");
		document.getElementById("info-label").classList.remove("d-none");
	} else {
		document.getElementById("map-button").classList.add("disabled");
		document.getElementById("info-label").classList.add("d-none");
	}
};

let addSubjectCell = subjects => {
	let PYSubjects = [];
	let otherSubjects = [];
	PYSubjects = subjects.filter(subj => subj.substring(0, 2) == "PY");
	otherSubjects = subjects.filter(subj => subj.substring(0, 2) != "PY");

	let dropdowns = PYSubjects.map(subj => {
		let dropItem = document.createElement("div");
		dropItem.classList.add("dropdown-item");
		dropItem.id = subj;
		dropItem.href = `#${subj}`;
		dropItem.innerHTML = subj;
		dropItem.onclick = (e) => {
			e.stopPropagation();
			selectSubject(subj)
		};
		return dropItem;
	});

	let uniquePYYears = [
		...new Set(PYSubjects.map(year => year.substring(2, 4)))
	];
	uniquePYYears.forEach(year => {
		let btnGroup = document.createElement("div");
		btnGroup.classList.add("btn-group");
		btnGroup.classList.add("dropright");

		let newYear = document.createElement("button");
		newYear.classList.add("btn");
		newYear.classList.add("btn-secondary");
		newYear.classList.add("dropdown-toggle");
		newYear.id = `PY${year}`;
		newYear.innerText = `20${year}`;
		newYear.setAttribute("data-toggle", "dropdown");

		let dropMenu = document.createElement("div");
		dropMenu.classList.add("dropdown-menu");

		btnGroup.append(dropMenu);
		btnGroup.append(newYear);

		dropdowns.forEach((dropItem, index) => {
			if (dropItem.innerHTML.substring(2, 4) == year) {
				dropMenu.append(dropItem);
			}
		});
		document.getElementById("subject-list").append(btnGroup);
	});

	otherSubjects.forEach(subject => {
		let newSubject = document.createElement("a");
		newSubject.id = subject;
		newSubject.href = `#${subject}`;
		newSubject.classList.add("list-group-item");
		newSubject.innerText = subject;
		newSubject.onclick = () => selectSubject(subject);
		document.getElementById("subject-list").append(newSubject);
	});
};

let selectSubject = async subject => {
	localStorage.setItem("subject", subject);

	let fmlistPathRes = await fetch(`/api/${subject}/records/FM`);
	let fm_records = [];
	if (fmlistPathRes.status == 200) {
		fm_records = await fmlistPathRes.json();
	}
	let hglistPathRes = await fetch(`/api/${subject}/records/HG`);
	let hg_records = [];
	if (hglistPathRes.status == 200) {
		hg_records = await hglistPathRes.json();
	}
	let cortStimlistPathRes = await fetch(`/api/${subject}/records/cortstim`);
	let cortStim_records = [];
	if (cortStimlistPathRes.status == 200) {
		cortStim_records = await cortStimlistPathRes.json();
	}
	let cceplistPathRes = await fetch(`/api/${subject}/records/EP`);
	let ccep_records = [];
	if (cceplistPathRes.status == 200) {
		ccep_records = await cceplistPathRes.json();
	}

	fetchAndStoreBrain(subject).then(brain => {
		document.getElementsByClassName("main-brain")[0].src = brain;
		document.getElementsByClassName("main-brain")[1].src = brain;
		scroll(0, 0);
	});
	fetchAndStoreGeometry(subject);

	document
		.getElementById("subject-list")
		.querySelectorAll(".active")
		.forEach(e => {
			e.classList.remove("active");
		});
	document.getElementById(subject).classList.add("active");

	let recordList = document.getElementById("record-list");
	while (recordList.hasChildNodes()) {
		recordList.removeChild(recordList.firstChild);
	}

	let btnGroup1 = document.createElement("div");
	btnGroup1.classList.add("btn-group");
	btnGroup1.classList.add("dropleft");

	let dropMenu1 = document.createElement("div");
	dropMenu1.classList.add("dropdown-menu");
	btnGroup1.append(dropMenu1);

	if (fm_records.length != 0) {
		let recordType = document.createElement("button");
		recordType.classList.add("btn");
		recordType.classList.add("btn-secondary");
		recordType.classList.add("dropdown-toggle");
		// recordType.id = `PY${year}`;
		recordType.innerText = `FM`;
		recordType.setAttribute("data-toggle", "dropdown");
		btnGroup1.append(recordType);
		document.getElementById("record-list").append(btnGroup1);

		fm_records.sort();
		fm_records.forEach(record => {
			let newRecord = document.createElement("a");
			newRecord.id = record;
			newRecord.href = `/record`;
			newRecord.classList.add("list-group-item");
			newRecord.innerText = record;
			newRecord.onclick = () => localStorage.setItem("record", record);
			dropMenu1.append(newRecord);
		});
	}

	let btnGroup2 = document.createElement("div");
	btnGroup2.classList.add("btn-group");
	btnGroup2.classList.add("dropleft");

	let dropMenu2 = document.createElement("div");
	dropMenu2.style.border = 0;

	dropMenu2.classList.add("dropdown-menu");
	btnGroup2.append(dropMenu2);

	if (cortStim_records.length != 0) {
		let recordType = document.createElement("button");
		recordType.classList.add("btn");
		recordType.classList.add("btn-secondary");
		recordType.classList.add("dropdown-toggle");
		// recordType.id = `PY${year}`;
		recordType.innerText = `Cortical Stimulation`;
		recordType.setAttribute("data-toggle", "dropdown");
		btnGroup2.append(recordType);
		document.getElementById("record-list").append(btnGroup2);

		let newRecord = document.createElement("a");
		newRecord.id = `cortstim_${subject}`;
		newRecord.href = `/api/${subject}/cortstim`;
		newRecord.classList.add("list-group-item");
		newRecord.innerText = 'Cortstim';
		newRecord.onclick = () => localStorage.setItem("record", record);
		dropMenu2.append(newRecord);
	}

	let btnGroup3 = document.createElement("div");
	btnGroup3.classList.add("btn-group");
	btnGroup3.classList.add("dropleft");

	let dropMenu3 = document.createElement("div");
	dropMenu3.classList.add("dropdown-menu");
	btnGroup3.append(dropMenu3);

	if (hg_records.length != 0) {
		let recordType = document.createElement("button");
		recordType.classList.add("btn");
		recordType.classList.add("btn-secondary");
		recordType.classList.add("dropdown-toggle");
		// recordType.id = `PY${year}`;
		recordType.innerText = `HG`;
		recordType.style.color = 'red'
		recordType.setAttribute("data-toggle", "dropdown");
		btnGroup3.append(recordType);
		document.getElementById("record-list").append(btnGroup3);

		hg_records.sort();
		hg_records.forEach(record => {
			let newRecord = document.createElement("a");
			newRecord.id = record;
			newRecord.href = `/record`;
			newRecord.classList.add("list-group-item");
			newRecord.innerText = record;
			newRecord.onclick = () => localStorage.setItem("record", record);
			dropMenu3.append(newRecord);
		});
	}

	let btnGroup4 = document.createElement("div");
	btnGroup4.classList.add("btn-group");
	btnGroup4.classList.add("dropleft");

	let dropMenu4 = document.createElement("div");
	dropMenu4.style.border = 0;
	dropMenu4.classList.add("dropdown-menu");
	btnGroup4.append(dropMenu4);

	if (ccep_records.length != 0) {
		let recordType = document.createElement("button");
		recordType.classList.add("btn");
		recordType.innerText = `CCEPS`;
		recordType.onclick = () => {
			window.location = `/CCEPS?subject=${localStorage.getItem('subject')}`
		}
		btnGroup4.append(recordType);

		document.getElementById("record-list").append(btnGroup4);


	}
	scroll(0, 0);
};

document.getElementById('3DViewer').onclick = () => {

	location.href = `/${localStorage.getItem('subject')}`;
}

document.getElementsByClassName("toggle-online-options")[0].onclick = () => {
	if (document.getElementById("online-options").classList.contains("d-none")) {
		document.getElementById("online-options").classList.remove("d-none");
	} else {
		document.getElementById("online-options").classList.add("d-none");
	}
	$('#exampleModal').modal("show")
};

document.getElementsByClassName("toggle-new-subject")[0].onclick = () => {
	if (
		document.getElementById("new-subject-options").classList.contains("d-none")
	) {
		document.getElementById("new-subject-options").classList.remove("d-none");
	} else {
		document.getElementById("new-subject-options").classList.add("d-none");
	}
};

document.getElementById("source-address-ok").onclick = () => {
	let newSourceAddress = document.getElementById("source-address").value;
	localStorage.setItem("source-address", newSourceAddress);
	bciOperator
		.connect(`ws://${newSourceAddress}`)
		.then(event => bciOperator.stateListen());
};

document.getElementById("new-subject-ok").onclick = () => {
	let newSubjectId = document.getElementById("new-subject-id").value;
	fetch(`/api/data/${newSubjectId}`, {
		method: "PUT"
	}).then(response => {
		addSubjectCell([newSubjectId]);
		selectSubject(newSubjectId);
	});
};

document.getElementsByClassName("upload-sensor-geometry")[0].onclick = () =>
	document.getElementById("upload-sensor-geometry-input").click();
document.getElementById("upload-sensor-geometry-input").onchange = async e => {
	let subject = localStorage.getItem("subject");

	let file = e.target.files[0];
	var reader = new FileReader();
	let jsonRecord = {};
	reader.addEventListener(
		"load",
		() => {
			let channelInfo = reader.result.split("\n");
			channelInfo.forEach(ch => {
				let channelData = ch.split(",");
				if (channelData.length > 1) {
					jsonRecord[channelData[0]] = {
						u: parseFloat(channelData[1]),
						v: parseFloat(channelData[2])
					};
				}
			});
			fetch(`/api/geometry/${subject}`, {
				method: "PUT",
				body: JSON.stringify(jsonRecord),
				headers: {
					"Content-Type": "application/json"
				}
			});
			localStorage.setItem(`geometry`, JSON.stringify(jsonRecord));
		},
		false
	);
	reader.readAsText(file);
	// let storedGeometry = {
	//   subject: subject,
	//   geometry: file
	// };
};

document.getElementsByClassName("upload-brain-image")[0].onclick = () =>
	document.getElementById("upload-brain-image-input").click();
document.getElementById("upload-brain-image-input").onchange = e => {
	let file = e.target.files[0];
	let subject = localStorage.getItem("subject");
	let formData = new FormData();
	formData.append("brainImage", file, file.name);
	var reader = new FileReader();
	reader.addEventListener(
		"load",
		() => {
			document.getElementsByClassName("main-brain")[0].src = reader.result;
			document.getElementsByClassName("main-brain")[1].src = reader.result;
		},
		false
	);
	reader.readAsDataURL(file);

	fetch(`/api/brain/${subject}`, {
		method: "PUT",
		body: formData
	});

};
let brainDots
let sensorGeometry
let positionInfoelement
document.getElementById('modal-geometry-generator-tab').onclick = e => {

	sensorGeometry = JSON.parse(localStorage.getItem('geometry')).data;
	brainDots = select('#fm-brain').append('svg').attr('class', 'fm-brain-svg').append('g')
		.attr('class', 'fm-brain-dots').selectAll('.fm-brain-dot').data(Object.keys(sensorGeometry).map(ch => {
			return {
				channel: ch,
				value: 1
			};
		}), d => d.channel);


	let electrodeList = document.getElementById('electrodeList')
	let electrodeListTable = document.createElement('table');
	let electrodeListTableHead = document.createElement('thead');
	let electrodeListTableBody = document.createElement('tbody');
	electrodeListTableBody.id = 'electrodeTable'
	let electrodeListTableHeadRow = document.createElement('tr');
	let electrodeListTableHeadRowCol1 = document.createElement('th');
	electrodeListTableHeadRowCol1.setAttribute('scope', 'col')
	electrodeListTableHeadRowCol1.innerHTML = "Channel"
	let electrodeListTableHeadRowCol2 = document.createElement('th');
	electrodeListTableHeadRowCol2.setAttribute('scope', 'col')
	electrodeListTableHeadRowCol2.innerHTML = "X"
	let electrodeListTableHeadRowCol3 = document.createElement('th');
	electrodeListTableHeadRowCol3.setAttribute('scope', 'col')
	electrodeListTableHeadRowCol3.innerHTML = "Y"
	let table = electrodeList.appendChild(electrodeListTable)
	let tableHeadRow = table.appendChild(electrodeListTableHead).appendChild(electrodeListTableHeadRow)
	tableHeadRow.appendChild(electrodeListTableHeadRowCol1)
	tableHeadRow.appendChild(electrodeListTableHeadRowCol2)
	tableHeadRow.appendChild(electrodeListTableHeadRowCol3)
	electrodeListTable.appendChild(electrodeListTableBody)
	electrodeListTable.classList.add('table-striped')

	setTimeout(() => {
		positionInfoelement = document.getElementById('fm-brain').getBoundingClientRect();
		brainDots.enter().append('circle')
			.attr('class', 'fm-brain-dot')
			.merge(brainDots)
			.style('fill', d => 'green')
			.attr('visibility', "visible")
			.attr('cx', d => sensorGeometry[d.channel].u * positionInfoelement.width)
			.attr('cy', d => (1 - sensorGeometry[d.channel].v) * positionInfoelement.height)
			.attr('r', d => 2)
			.attr('id', d => `dot_${d.channel}`)

		Object.keys(sensorGeometry).forEach(ch => {
			let valueToPlot = {
				name: `${ch}`,
				x: sensorGeometry[ch].u * positionInfoelement.width,
				y: (1 - sensorGeometry[ch].v) * positionInfoelement.height
			}
			let channelEntry = document.createElement('tr')
			channelEntry.id = `table_${ch}`
			channelEntry.onclick = () => changeDots(valueToPlot, "highlight")
			channelEntry.ondblclick = () => changeDots(valueToPlot, "clear")

			let channelName = document.createElement('td')
			channelName.innerHTML = ch
			let xPos = document.createElement('td')
			xPos.innerHTML = (valueToPlot.x).toFixed(0)
			let yPos = document.createElement('td')
			yPos.innerHTML = (valueToPlot.y).toFixed(0)
			electrodeListTableBody.appendChild(channelEntry)
			channelEntry.appendChild(channelName)
			channelEntry.appendChild(xPos)
			channelEntry.appendChild(yPos)
		})
	}, 300)

}
const changeDots = (e, type) => {
	if (type == "highlight") {
		document.getElementById(`dot_${e.name}`).style.fill = "red"
		document.getElementById(`dot_${e.name}`).setAttribute('r', 5)
		setTimeout(() => {
			document.getElementById(`dot_${e.name}`).style.fill = "green"
			document.getElementById(`dot_${e.name}`).setAttribute('r', 2)
		}, 1000)
	} else {
		document.getElementById(`dot_${e.name}`).style.fill = "red"
		document.getElementById(`dot_${e.name}`).setAttribute('r', 5)
		setTimeout(() => {
			select(`#dot_${e.name}`).remove()
			document.getElementById('fm-brain').addEventListener('click', logger)

			function logger(zed) {
				select('.fm-brain-dots').append('circle')
					.attr('class', 'fm-brain-dot')
					.style('fill', 'green')
					.attr('visibility', "visible")
					.attr('cx', zed.offsetX)
					.attr('cy', zed.offsetY)
					.attr('r', 2)
					.attr('id', `dot_${e.name}`)
				document.getElementById(`table_${e.name}`).childNodes[1].innerText = zed.offsetX
				document.getElementById(`table_${e.name}`).childNodes[2].innerText = zed.offsetY
				document.getElementById('fm-brain').removeEventListener('click', logger)
			}
		}, 1000)
	}
}

document.getElementById("geometryButton").onclick = () => {
	let newChannel = document.getElementById('geometryCreator').value;
	console.log(newChannel)
	let elecTable = document.getElementById('electrodeTable')
	let channelEntry = document.createElement('tr')
	channelEntry.id = `table_${newChannel}`
	let channelName = document.createElement('td')
	channelName.innerHTML = newChannel
	channelEntry.appendChild(channelName)

	elecTable.appendChild(channelEntry)
	document.getElementById('fm-brain').addEventListener('click', logger)

	function logger(zed) {
		let xPos = document.createElement('td')
		xPos.innerHTML = zed.offsetX
		let yPos = document.createElement('td')
		yPos.innerHTML = zed.offsetY
		let valueToPlot = {
			name: `${newChannel}`,
			x: xPos,
			y: yPos
		}
		channelEntry.onclick = () => changeDots(valueToPlot, "highlight")
		channelEntry.ondblclick = () => changeDots(valueToPlot, "clear")
		channelEntry.appendChild(xPos)
		channelEntry.appendChild(yPos)
		select('.fm-brain-dots').append('circle')
			.attr('class', 'fm-brain-dot')
			.style('fill', 'green')
			.attr('visibility', "visible")
			.attr('cx', zed.offsetX)
			.attr('cy', zed.offsetY)
			.attr('r', 2)
			.attr('id', `dot_${newChannel}`)
		document.getElementById('fm-brain').removeEventListener('click', logger)
	}
}

document.getElementById("saveGeometry").onclick = () => {
	let newSensorGeometry = {}
	Array.from(document.getElementById('electrodeTable').children).forEach(elec => {
		newSensorGeometry[elec.childNodes[0].innerText] = {
			u: parseFloat(document.getElementById(`table_${elec.childNodes[0].innerText}`).childNodes[1].innerText) / positionInfoelement.width,
			v: (1 - parseFloat(document.getElementById(`table_${elec.childNodes[0].innerText}`).childNodes[2].innerText) / positionInfoelement.height)
		}
	})
	localStorage.setItem(`geometry`, JSON.stringify({
		subject: JSON.parse(localStorage.getItem('geometry')).subject,
		data: newSensorGeometry
	}));
	fetch(`/api/geometry/${JSON.parse(localStorage.getItem('geometry')).subject}`, {
		method: "PUT",
		body: JSON.stringify(newSensorGeometry),
		headers: {
			"Content-Type": "application/json"
		}
	});
	//   fetch(`/api/${document.getElementById('subjectEntry').value}/geometry`, {
	//       method: 'PUT',
	//       body: JSON.stringify(geometryStore),
	//       headers: {
	//         'Content-Type': 'application/json'
	//       }
	//     }).then(res => res.json())
	//     .then(response => console.log('Success:', JSON.stringify(response)))
	//     .catch(error => console.error('Error:', error));
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
document.getElementsByClassName("main-brain")[0].ondblclick = e => $('#exampleModal').modal("show")
$('#exampleModal').on('hidden.bs.modal', function () {
	console.log("closed modal")
	$(".table_striped").remove();
	select(".fm-brain-svg").remove();

})

