import * as React from "react";
import {
	Row, Col, Card, Container, InputGroup, FormControl, Nav, Navbar,
	Button, ListGroup, ListGroupItem, Image
} from '../../node_modules/react-bootstrap'
import "./index.scss";
import Brain from './Brain'
export class App extends React.Component {
	render() {
		return (
			<div className="App">
				<Nav className="navbar-inverse navbar-fixed-top justify-content-start navbar-expand">
					<Container>
						<Navbar>
							<Navbar.Brand>
								WebFM
							</Navbar.Brand>
						</Navbar>
					</Container>
				</Nav>
				<Container>
					<Row>
						<Col className="col-md-3 col-sm-6">
							<Card>
								<Card.Header>
									<Card.Title as="h3">
										Online <span className="pull-right"><a className="toggle-online-options"></a></span>
									</Card.Title>
								</Card.Header>
								{/* <Card.Header id="online-options"> */}
								<Card.Header className="d-none" id="online-options">
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
							<Card>
								<Card.Header>
									<Card.Title as="h3">
										Subjects <span className="pull-right"><a className="toggle-new-subject"></a></span>
									</Card.Title>
								</Card.Header>
							</Card>
							<Card>
								<Card.Header id="new-subject-options">
								</Card.Header>
								<InputGroup>
									<InputGroup.Prepend>
										<InputGroup.Text id="basic-addon1">ID</InputGroup.Text>
									</InputGroup.Prepend>
									<FormControl
										id="new-subject-id"
										type="text"
										placeholder="PYXXN000"
									/>
									<InputGroup.Append>
										<Button id="new-subject-ok" variant="outline-secondary">Button</Button>
									</InputGroup.Append>
								</InputGroup>
							</Card>
							<ListGroup id="subject-list">
							</ListGroup>
						</Col>

						<Col>
							<Brain></Brain>
							{/* <div class="col-md-5 d-none-sm d-none-xs"> */}
							{/* <Image src="" className="main-brain img-fluid" alt="No image found"></Image>
							<div id="fm-brain-container">
							</div> */}
						</Col>
						<Col>
							<Card>
								<Card.Header>
									<Card.Title>
										Metadata
									</Card.Title>
								</Card.Header>
								<ListGroup>
									<ListGroupItem>
										Test
									</ListGroupItem>
								</ListGroup>
							</Card>
						</Col>
					</Row>
				</Container>
			</div>

		);
	}
}
