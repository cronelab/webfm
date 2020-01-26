import React, { useState, useEffect, useContext, useRef } from "react";
import {
	Container, Row, Col, Button
} from '../../node_modules/react-bootstrap'
import Brain from '../Components/Brain'
import { Context } from '../Context'
import { Brain_3D } from "../Components/Brain_3D";
import DataHeader from '../Components/DataHeader'
import HighGamma from '../Components/HighGamma'
import EvokedPotentials from "../Components/EvokedPotentials";
import CCSR from "../Components/CCSR"
export default React.memo(function Record() {
	const { brainType, setNewSubject, setNewRecord, brainCoord } = useContext(Context)
	const [brainCoords, setBrainCoords] = useState({})
	var urlParams = new URLSearchParams(window.location.search);
	let actualCoords = {}
	const [scene, setScene] = useState();

	useEffect(() => {
		let recordType = urlParams.get('type');
		let recordName = urlParams.get('record');
		let subjectName = urlParams.get('subject');
		setNewSubject({ name: subjectName, geometry: null });
		setNewRecord({ name: recordName, type: recordType });
	}, [])

	useEffect(() => {
		if (brainCoord.length > 0) {
			let brainCoordinates = JSON.parse(brainCoord)
			let brainContainer = document.getElementById('brain')

			//@ts-ignore
			Object.keys(brainCoordinates).forEach(electrodes => {
				let vals = brainCoordinates[electrodes]
				actualCoords[electrodes] = {
					u: vals.u * brainContainer.offsetWidth,
					v: (1 - vals.v) * brainContainer.offsetHeight,
					location: vals.location
				}
			})
			setBrainCoords(actualCoords)
		}
	}, [brainCoord])

	const BrainChoice = () => {
		if (brainType == "2D") {
			return <Brain ></Brain>
		}
		else if (brainType == "3D") {
			let props = {
				subject: urlParams.get('subject'),
				setScene
			}
			return <Brain_3D {...props} ></Brain_3D>
		}
	}

	const SetRecordType = () => {
		if (urlParams.get('type') == 'HG') {

			return <HighGamma scene={scene}></HighGamma>
		}
		else if (urlParams.get('type') == 'EP') {
			return <EvokedPotentials locations={brainCoords}></EvokedPotentials>
		}
		else if (urlParams.get('type') == 'CCSR') {
			return <CCSR></CCSR>
		}
	}

	return (
		<div className="Record">
			<DataHeader></DataHeader>

			<Container fluid={true}>
				<Row>
					<Col xs={6}>
						<SetRecordType ></SetRecordType>

					</Col>
					<Col xs={6}>

						<BrainChoice ></BrainChoice>
						<div id="imgContainer" style={{ "height": "100%", "width": "100%" }}>
							{/* <div id="imgContainer"> */}
							{/* <svg> */}
							<svg style={{ "height": "100%", "width": "100%" }}>
								{Object.keys(brainCoords).map((key, index) => {
									return (
										<circle
											key={`${key}_circle`}
											id={`${key}_circle`}
											cx={brainCoords[key].u}
											cy={brainCoords[key].v}
											r="2"
											fill="purple"
										/>
									);
								})}
							</svg>
						</div>
					</Col>
				</Row>
			</Container>
		</div >

	);
})