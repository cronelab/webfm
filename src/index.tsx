import React, {Suspense} from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "../node_modules/bootstrap/dist/css/bootstrap.css";

import { MyProvider} from "./Context";
import { Header, Footer } from "./Components/Header";
import Cortstim_V3 from "./Components/Cortstim_V3";
import { Row, Col, Container } from "react-bootstrap";
import Online from "./Components/Online";
import EvokedPotentials from "./Components/EvokedPotentials";
import HighGamma from "./Components/HighGamma";
import BrainSelector from './Components/BrainSelector'
import ReactFiber from './Components/ReactFiber'
ReactDOM.render(
  <MyProvider style={{ height: "100%" }}>
    <Router>
      <Header></Header>
      <Container fluid >
        <Row>
          <Col>
            <Switch>
              <Route exact path="/cortstim">
                <Cortstim_V3 />
              </Route>
              <Route exact path="/hg">
                <HighGamma />
              </Route>
              <Route exact path="/ep">
                <EvokedPotentials />
              </Route>
              <Route exact path="/">
                <Online />
              </Route>
            </Switch>
          </Col>
          <Col>
            {/* <BrainSelector></BrainSelector> */}
            <Suspense fallback={null}>
            <ReactFiber></ReactFiber>
            </Suspense>
          </Col>
        </Row>
      </Container>

      <Footer></Footer>
    </Router>
  </MyProvider>,
  document.getElementById("root")
);
