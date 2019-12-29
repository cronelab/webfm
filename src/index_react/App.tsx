import * as React from "react";
import {
	Row, Col, Card, Container, InputGroup, FormControl,
	Button, ListGroup, ListGroupItem, Navbar
} from '../../node_modules/react-bootstrap'
import "./index.scss";
import Brain from '../Components/Brain'
import { MyProvider } from '../Context'
import Header, { Footer } from '../Components/Header'
import Subjects from '../Components/Subjects'
import Online from '../Components/Online'
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

export class App extends React.Component {
	render() {
		return (
			<MyProvider>
				<Router>
					<div className="App">
						{/* <ul>
							<li>
								<Link to="/users">Home</Link>
							</li>
							<li>
								<Link to="/about">Home2</Link>
							</li>
						</ul> */}
						{/* <Switch> */}
						{/* <Route path="/about"> */}
						<Header />
						{/* </Route> */}
						{/* <Route path="/users">
								<Header2 />
							</Route> */}
						{/* </Switch> */}
						<Container fluid={true}>
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
						<Footer></Footer>
					</div>
				</Router>
			</MyProvider>

		);
	}
}
