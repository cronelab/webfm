import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./index.scss";
import { MyProvider } from "./Context";
import { Header, Footer } from "./Components/Header";
import Brain from "./Components/Brain";
import Cortstim from "./Components/Cortstim";
import { Row, Col, Container } from "react-bootstrap";
import CortstimResults from "./Components/CortstimResults";
import Online from './Components/Online'
ReactDOM.render(
  <MyProvider
    style={{ overflow: "hidden" }}
  >
    <Router>
      <>
        <Header></Header>
        <Switch>

          <Route exact path="/cortstim">
            <Cortstim />
          </Route>
          <Route exact path="/cortstimresults">
            <CortstimResults />
          </Route>
          <Route path="/">
            <Container style={{ marginTop: 5 }} fluid={true}>
              <Row>
                <Col xs="8" style={{ "padding": "0" }}>
                  <Brain containerID={"container"} />
                </Col>
                <Col>
                  <Online />
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
