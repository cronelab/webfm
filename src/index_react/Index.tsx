import * as React from "react";
import {
	Row, Col, Card, Container, InputGroup, FormControl,
	Button, ListGroup, ListGroupItem, Navbar
} from '../../node_modules/react-bootstrap'
import Brain from '../Components/Brain'
import { MyProvider } from '../Context'
import Subjects from '../Components/Subjects'
import Online from '../Components/Online'
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

const Index = () => {
	return (
		<div>
			<Container style={{ marginTop: 5 }} fluid={true}>
				<Row>
					<Col>
						<Online></Online>
					</Col>
					<Col xs="6">
						<Brain></Brain>
					</Col>
					<Col>
						<Subjects></Subjects>

					</Col>
				</Row>
			</Container>
		</div>

	);
}
export default Index;