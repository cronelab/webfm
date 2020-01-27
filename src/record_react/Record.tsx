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
import { HeatMap } from "../Components/HeatMap";
export default React.memo(function Record() {
	const { brainType, setNewSubject, setNewRecord, brainCoord } = useContext(Context)
	var urlParams = new URLSearchParams(window.location.search);
	const [scene, setScene] = useState();
	useEffect(() => {
		let recordType = urlParams.get('type');
		let recordName = urlParams.get('record');
		let subjectName = urlParams.get('subject');
		setNewSubject({ name: subjectName, geometry: null });
		setNewRecord({ name: recordName, type: recordType });
	}, [])



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
			return <EvokedPotentials ></EvokedPotentials>
		}
		else if (urlParams.get('type') == 'CCSR') {
			return <HeatMap></HeatMap>
		}
	}

	return (
		<div className="Record">
			<DataHeader></DataHeader>

			<Container fluid={true} style={{ "height": "100%" }}>
				<Row style={{ "height": "100%", "paddingBottom": 50 }}>
					<Col xs={6} style={{ "paddingBottom": "50px", "paddingLeft": "0px" }}>
						<SetRecordType ></SetRecordType>
					</Col>
					<Col xs={6} style={{ "paddingBottom": "50px", "paddingLeft": "0px" }}>
						<BrainChoice ></BrainChoice>
					</Col>
				</Row>
			</Container>
		</div >

	);
})