import React, { useEffect, useState } from 'react'
import { Group, Vector3, SphereGeometry, Color } from 'three'
import { LineGeometry } from '../../node_modules/three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from '../../node_modules/three/examples/jsm/lines/LineMaterial';
import { Line2 } from '../../node_modules/three/examples/jsm/lines/Line2';
import { Container, Row, Col, Button } from '../../node_modules/react-bootstrap'
import Slider from 'react-input-slider';

import { fetch3DBrain } from '../shared/anatomy'

export default function Cortstim() {
	const [brainScene, setBrainScene] = useState();
	const [taskData, setTaskData] = useState()
	const [threeDCoords, setThreeDCoords] = useState();
	const [gyriState, setGyriState] = useState(100);
	const [wmState, setWmState] = useState(100);
	const [subStructState, setSubStructState] = useState(100);

	let lineGroup = new Group()
	lineGroup.name = "cortstimLine"

	useEffect(() => {
		var urlParams = new URLSearchParams(window.location.search);
		let subjectName = urlParams.get('subject');
		(async () => {
			let cortstimReq = await fetch(`/api/data/${subjectName}/cortstim`)
			let cortStimRes = await cortstimReq.json()
			let actualData = Object.keys(cortStimRes).map(entry => {
				if (cortStimRes[entry].Result != null) {
					return {
						channel: entry,
						color: cortStimRes[entry].Color,
						result: [...cortStimRes[entry].Result, "All"]
					}
				}
				else {
					return {
						channel: entry,
						color: cortStimRes[entry].Color,
						result: ["All"]
					}
				}
			})
			//@ts-ignore
			setTaskData(actualData)
			let brainContainer = document.getElementById('brain3D');
			let scene = await fetch3DBrain(subjectName, brainContainer);
			//@ts-ignore

			setBrainScene(scene)
			let electrodes = scene.getObjectByName("Electrodes");
			electrodes.traverse((child) => {
				if (child.type == "Mesh") {
					//@ts-ignore
					child.geometry = new SphereGeometry(1, 32, 32, 0, Math.PI * 2, 0, Math.PI)
				}
			})
			let gyri = scene.getObjectByName("Gyri");
			gyri.traverse(child => {
				if (child.type == "Mesh") {
					var color = new Color(0xdcdcdc);
					//@ts-ignore
					child.material.color = color
				}
			})
		})()

	}, [])



	useEffect(() => {
		if (brainScene) {

			//@ts-ignore
			let object = brainScene.getObjectByName("Gyri");
			object.visible = true
			if (gyriState == 0) {
				object.visible = false;
			}
			else {
				object.visible = true
			}
			object.traverse(child => {
				if (child.type == "Mesh") {
					child.material.opacity = gyriState / 100
					child.material.transparent = true

				}
			})
		}
	}, [gyriState])


	useEffect(() => {
		if (brainScene) {
			//@ts-ignore
			let object = brainScene.getObjectByName("WhiteMatter");
			//@ts-ignore
			let gyri = brainScene.getObjectByName("Gyri");
			gyri.visible = false
			if (wmState == 0) {
				object.visible = false;
			}
			else {
				object.visible = true
			}
			object.traverse(child => {
				if (child.type == "Mesh") {
					child.material.opacity = wmState / 100
					child.material.transparent = true

				}
			})
		}
	}, [wmState])

	useEffect(() => {
		if (brainScene) {
			//@ts-ignore

			let object = brainScene.getObjectByName("Brain");
			if (subStructState == 0) {
				object.visible = false;
			}
			else {
				object.visible = true
			}
			object.traverse(child => {
				if (child.type == "Mesh") {
					child.material.opacity = subStructState / 100
					child.material.transparent = true

				}
			})
			//@ts-ignore

			let electrodes = brainScene.getObjectByName("Electrodes");
			electrodes.traverse(child => {
				if (child.type == "Mesh") {
					child.material.opacity = 100;
				}
			})
		}
		// selectTask("All")

	}, [subStructState])


	const selectTask = (task) => {
		//@ts-ignore

		let oldLines = brainScene.getObjectByName("cortstimLine")
		if (oldLines != undefined) {
			let childrenNum = oldLines.children.length;
			for (let i = 0; i < childrenNum; i++) {
				oldLines.remove(oldLines.children[0])
			}
		}
		//@ts-ignore
		taskData.forEach(entry => {
			let result = entry.result.filter(t => t == task)
			if (result.length > 0) {
				let lineGeom = new LineGeometry
				let chan1 = entry.channel.split("_")[0]
				let chan2 = entry.channel.split("_")[1]
				//@ts-ignore
				let stimElec1 = brainScene.getObjectByName(chan1)
				//@ts-ignore
				let stimElec2 = brainScene.getObjectByName(chan2)
				//@ts-ignore
				brainScene.updateMatrixWorld();
				var vector1 = new Vector3();
				var vector2 = new Vector3();
				let elec1Pos = vector1.setFromMatrixPosition(stimElec1.matrixWorld);
				let elec2Pos = vector2.setFromMatrixPosition(stimElec2.matrixWorld);
				lineGeom.setPositions([elec1Pos.x, elec1Pos.y, elec1Pos.z, elec2Pos.x, elec2Pos.y, elec2Pos.z])
				let material = new LineMaterial({
					color: entry.color,
					linewidth: .01
				});

				let line = new Line2(lineGeom, material);
				line.computeLineDistances();
				line.scale.set(1, 1, 1);
				lineGroup.add(line);
			}
		})
		//@ts-ignore

		brainScene.add(lineGroup)
	}

	const disableHemisphere = (hem) => {
		//@ts-ignore

		let gyri = brainScene.getObjectByName("Gyri")
		//@ts-ignore
		let wm = brainScene.getObjectByName("WhiteMatter")

		gyri.traverse((child) => {
			if (child.type == "Mesh") {
				if (child.name.startsWith(hem)) {
					child.visible = false
				}
			}
		})
		wm.traverse((child) => {
			if (child.type == "Mesh") {
				if (child.name.startsWith(hem) || child.name.startsWith(hem.toUpperCase())) {
					child.visible = false
				}
			}
		})
	}


	return (
		<div>
			<Container fluid>
				<Row>
					<Col sm={10}>
						<div id="brain3D" />
						<Row>
							<Col>
								<Slider axis="x" x={gyriState} onChange={({ x }) => setGyriState(state => (x))} />
								         Gyri
							</Col>
						</Row>
						<Row>
							<Col>
								<Slider axis="x" x={wmState} onChange={({ x }) => setWmState(state => (x))} />
								      White Matter

							</Col>
						</Row>
						<Row>
							<Col>
								<Slider axis="x" x={subStructState} onChange={({ x }) => setSubStructState(state => (x))} />
							        Subcortical structures

							</Col>
						</Row>
					</Col>
					<Col sm={2}>
						<Button block={true}
							onClick={() => selectTask("SS")}
						>SS</Button>
						<Button block={true}
							onClick={() => selectTask("C")}
						>C</Button>
						<Button block={true}
							onClick={() => selectTask("N")}
						>N</Button>
						<Button block={true}
							onClick={() => selectTask("R")}
						>R</Button>
						<Button block={true}
							onClick={() => selectTask("AN")}
						>AN</Button>
						<br></br>

						<Button block={true}
							onClick={() => selectTask("All")}
						>All</Button>
						<br></br>
						<Button block={true}
							onClick={() => selectTask("SZ")}
						>SZ</Button>
						<Button block={true}
							onClick={() => disableHemisphere("l")}
						>
							Disable Left Hemisphere
						</Button>
						<Button block={true}
							onClick={() => disableHemisphere("r")}
						>
							Disable Right Hemisphere
						</Button>
					</Col>
				</Row>
			</Container>
		</div>
	)
}