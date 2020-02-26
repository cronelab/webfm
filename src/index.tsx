import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./index.scss";
import Record from './record_react/Record'
import Map from './map_react/Map'
import { MyProvider } from './Context'
import Header, { Footer } from './Components/Header'
import Online from './Components/Online'
import Subjects from './Components/Subjects'
import Brain from './Components/Brain'
import Cortstim from './Components/Cortstim'
import {
	Row, Col, Container,
} from '../node_modules/react-bootstrap'
import Reconstruction from './3Drecon_react/Reconstruction'
ReactDOM.render(
	<Router>
		<MyProvider>
			<Header></Header>
			<Switch>
				<Route exact path="/blank">
					<Record />
				</Route>
				<Route exact path="/records">
					<Record />
				</Route>
				<Route exact path="/map">
					<Map />
				</Route>
				<Route exact path="/reconstruction">
					<Reconstruction />
				</Route>
				<Route exact path="/cortstim">
					<Cortstim />
				</Route>
				<Route path="/">
					<Container style={{ marginTop: 5 }} fluid={true}>
						<Row>
							<Col>
								<Online />
							</Col>
							<Col xs="6">
								<Brain />
							</Col>
							<Col>
								<Subjects />
							</Col>
						</Row>
					</Container>
				</Route>
			</Switch>
			<Footer></Footer>
		</MyProvider>
	</Router>
	, document.getElementById("root"));