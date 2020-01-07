import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./index.scss";
import Index from './index_react/Index'
import Record from './record_react/Record'
import { MyProvider } from './Context'
import Header, { Footer } from './Components/Header'

ReactDOM.render(
	<Router>
		<MyProvider>
			<Header></Header>
			<Switch>
				<Route exact path="/blank">
					<Record />
				</Route>
				<Route exact path="/recordlist">
					<Record />
				</Route>
				<Route path="/">
					<Index />
				</Route>
			</Switch>
			<Footer></Footer>
		</MyProvider>
	</Router>
	, document.getElementById("root"));