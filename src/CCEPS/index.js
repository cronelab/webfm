import "bootstrap";
import "./index.scss";

import { load3DBrain_gltf } from '../shared/loaders'
import '@google/model-viewer';
import * as THREE from 'three';
import PY19N024_3D from '../../data/PY19N024/info/reconstruction.glb'
let scene;
let gyri;
let wm;
let subStructures;
let electrodes;
let gyriScale = 1;
let wmScale = 1;
let subStructuresScale = 1;
let electrodeNames = [];
let resInfo;
let elecValues = [];
let lineGroup;
window.onload = async e => {
	scene = await load3DBrain_gltf(PY19N024_3D);
	wm = scene.getObjectByName("WhiteMatter");
	gyri = scene.getObjectByName("Gyri");
	electrodes = scene.getObjectByName("Electrodes");
	subStructures = scene.getObjectByName("Brain");
	lineGroup = new THREE.Group();
	lineGroup.name = "lineGroup"

	var urlParams = new URLSearchParams(window.location.search);
	let subject = urlParams.get('subject');
	let cceplistPathRes = await fetch(`/api/${subject}/records/EP`);
	let ccep_records = [];
	if (cceplistPathRes.status == 200) {
		ccep_records = await cceplistPathRes.json();
	}
	ccep_records.forEach(record => {
		let newRecord = document.createElement("li");
		newRecord.id = record;
		newRecord.classList.add("list-group-item");
		newRecord.innerText = record;
		newRecord.onclick = () => displayStimulationResults(record);
		document.getElementById('recordHolder').append(newRecord);
	});
}

const displayStimulationResults = async record => {
	let resInfoReq = await fetch(`/z-score/PY19N024/${record}`)

	resInfo = await resInfoReq.json();
	let geometry, line;
	let stimPosition, stimElectrode;
	let empty;
	let material;
	Object.keys(resInfo).forEach(x => {
		electrodeNames.push(x)
		elecValues.push(resInfo[x].peak)
	})
	console.log(lineGroup.children)
	lineGroup.children = []
	// lineGroup.children.forEach(line => lineGroup.children.pop(0))
	console.log(lineGroup.children)
	electrodeNames = Object.keys(resInfo)
	electrodes.traverse(child => {
		electrodeNames.forEach(elec => {
			if (elec == child.name) {
				stimElectrode = scene.getObjectByName(record.split('_')[0])
				geometry = new THREE.Geometry();
				geometry.vertices.push(new THREE.Vector3(0, 0, 0));
				let x = child.getWorldPosition().x - stimElectrode.getWorldPosition().x
				let y = child.getWorldPosition().y - stimElectrode.getWorldPosition().y
				let z = child.getWorldPosition().z - stimElectrode.getWorldPosition().z
				geometry.vertices.push(new THREE.Vector3(x, y, z));
				material = new THREE.LineBasicMaterial({ color: 0x0000ff });
				material.color.setHSL(resInfo[elec].peak / Math.max(...elecValues), 1, .5)
				line = new THREE.Line(geometry, material);
				lineGroup.add(line);
				stimElectrode.getWorldPosition(line.position)
			}
		})
	})
	scene.add(lineGroup)
}

document.getElementById('transparencyToggle_g').onclick = () => {
	gyri.visible = true;
	wm.visible = false;
	if (gyriScale < .1) {
		gyriScale = 1;
	}
	else {
		gyriScale = gyriScale - .1
	}

	gyri.traverse(child => {
		if (child instanceof THREE.Mesh) {
			if (child.material.opacity < .0) {
				child.material.transparent = false;
				child.material.opacity = gyriScale;
			}
			else {
				child.material.transparent = true;
				child.material.opacity = gyriScale;
			}
		}
	});
}
document.getElementById('transparencyToggle_WM').onclick = () => {
	wm.visible = true;
	gyri.visible = false;
	if (wmScale < .1) {
		wmScale = 1;
	}
	else {
		wmScale = wmScale - .1
	}
	wm.traverse(child => {
		if (child instanceof THREE.Mesh) {
			if (child.material.opacity < .0) {
				child.material.transparent = false;
				child.material.opacity = wmScale;
			}
			else {
				child.material.transparent = true;
				child.material.opacity = wmScale;
			}
		}
	});
}
document.getElementById('transparencyToggle_sub').onclick = () => {
	subStructures.visible = true;
	gyri.visible = false;
	wm.visible = false;
	if (subStructuresScale < .1) {
		subStructuresScale = 1;
	}
	else {
		subStructuresScale = subStructuresScale - .1
	}
	subStructures.traverse(child => {
		if (child instanceof THREE.Mesh) {
			if (child.material.opacity < .0) {
				child.material.transparent = false;
				child.material.opacity = subStructuresScale;
			}
			else {
				child.material.transparent = true;
				child.material.opacity = subStructuresScale;
			}
		}
	});
}

document.getElementById('electrodeScaler').onclick = () => {
	if (child instanceof THREE.Mesh) {
		if (child.scale.x > 2) {
			child.scale.set(1, 1, 1)
		}
		else {
			child.scale.set(child.scale.x + .1, child.scale.y + .1, child.scale.z + .1)
		}
	}
}
