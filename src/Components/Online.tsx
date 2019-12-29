import React, { useContext, useEffect, useRef } from "react";
import { Card, InputGroup, Button, FormControl, ListGroup, ListGroupItem } from '../../node_modules/react-bootstrap'
import "./Brain.scss";
import { Context } from "../Context";
import { fetchAndStoreBrain } from '../shared/loaders'

const Online = () => {

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
					Not Connected
</ListGroupItem>
				<ListGroupItem id="subject-label" className="text-center d-none">
				</ListGroupItem>
				<ListGroupItem id="task-label" className="text-center d-none">
				</ListGroupItem>
				<Button id="map-button" className="disabled text-center">
					Map
</Button>
			</ListGroup>
		</Card>
	)
}
export default Online;
