import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./index.scss";
import Record from "./Record/Record";
import Map from "./Map/Map";
import { MyProvider } from "./Context";
import Header, { Footer } from "./Components/Header";
import Online from "./Components/Online";
import Subjects from "./Components/Subjects";
import Brain from "./Components/Brain";
import Cortstim from "./Components/Cortstim";
import { Row, Col, Container } from "react-bootstrap";
import Reconstruction from "./3Drecon_react/Reconstruction";
ReactDOM.render(
  <MyProvider>
    <Router>
		<>
      <Header></Header>
      <Switch>
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
	  </>
    </Router>
  </MyProvider>,
  document.getElementById("root")
);
