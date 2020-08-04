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
ReactDOM.render(
  <MyProvider
    style={{overflow:"hidden"}}
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
         
        </Switch>
        <Footer></Footer>
      </>
    </Router>
  </MyProvider>,
  document.getElementById("root")
);
