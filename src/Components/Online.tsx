import React, { useContext, useEffect, useRef } from "react";
import { Card, InputGroup, Button, FormControl, ListGroup, ListGroupItem } from '../../node_modules/react-bootstrap'
import { Context } from "../Context";

import BCI2K from "bci2k";
let bciOperator = new BCI2K.bciOperator();
let bciSourceConnection = new BCI2K.bciData();


const Online = () => {
	let { bciState } = useContext(Context);

	// useEffect(() => {
	// 	bciOperator.connect("ws://127.0.0.1").then(() => {
	// 		bciOperator.onStateChange = e => {
	// 			context.setBciState(e);
	// 		};
	// 		(async () => {
	// 			let subject = await bciOperator.execute(`Get Parameter SubjectName`);
	// 			let dataFile = await bciOperator.execute(`Get Parameter DataFile`);
	// 			context.setTask(dataFile.split("/")[1]);

	// 			context.setNewSubject({ name: subject });
	// 		})();
	// 		bciSourceConnection.connect("127.0.0.1:20100").then(() => { });
	// 		bciSourceConnection.onReceiveBlock = () => {
	// 			context.setSourceData(bciSourceConnection.signal);
	// 		};
	// 	});
	// }, []);


	return (
		<Card>
			<Card.Header>
				<Card.Title as="h3">
					Online <span className="pull-right"><a className="toggle-online-options"></a></span>
				</Card.Title>
			</Card.Header>
			<Card.Header className="" id="online-options">
				{/* <Card.Header className="d-none" id="online-options"> */}
				<InputGroup>
					<InputGroup.Prepend>
						<InputGroup.Text id="basic-addon1">Source</InputGroup.Text>
					</InputGroup.Prepend>
					<FormControl
						id="source-address"
						type="text"
						placeholder="Address"
					/>
					<InputGroup.Append>
						<Button id="source-address-ok" variant="outline-secondary">Button</Button>
					</InputGroup.Append>
				</InputGroup>
			</Card.Header>
			<ListGroup>
				<ListGroupItem id="state-label" className="text-center">
					{bciState}
				</ListGroupItem>
				<ListGroupItem id="subject-label" className="text-center d-none">
				</ListGroupItem>
				<ListGroupItem id="task-label" className="text-center d-none">
				</ListGroupItem>
				<Button id="map-button" className="text-center"
					// <Button id="map-button" className="disabled text-center"
					href={`/map?subject=${'PY20N001'}&type=HG&record=${'AF_SentenceCompletion'}`}
				>
					Map
</Button>
			</ListGroup>
		</Card>
	)
}
export default Online;
