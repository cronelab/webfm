import React, { useEffect, useState, useContext } from "react";
// import "./DataStore.scss";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { ListGroupItem, Container, Col, Row } from "react-bootstrap";
import { Context } from "../Context";


let loadGeometry = async subject => {
	let geometryPath = `api/${subject}/geometry`;
	const response = await fetch(geometryPath);
	const geometry = await response.json();
	return geometry;
};

const DataStore = () => {
	const context = useContext(Context);

	useEffect(() => {
		loadSubjects().then(x => {
			context.setAllSubjects(x);
		});
		if (localStorage.getItem("subject")) {
			loadRecords(localStorage.getItem("subject")).then(recordType => {
				context.setAllRecords({ HG: recordType[0], EP: recordType[1] });
			});
			loadGeometry(localStorage.getItem("subject")).then(x => {
				context.setNewSubject({
					name: localStorage.getItem("subject"),
					geometry: x
				});
			});
		}
	}, []);

	const subjectClick = e => {
		let subjName = e.target.innerHTML;
		Array.from(e.target.parentNode.children).forEach(x =>
			x.classList.remove("active")
		);
		e.target.className = e.target.className + " active";
		loadRecords(subjName).then(recordType => {
			context.setAllRecords({ HG: recordType[0], EP: recordType[1] });
		});
		loadGeometry(subjName).then(x => {
			context.setNewSubject({ name: subjName, geometry: x });
			localStorage.setItem("subject", subjName);
		});
	};

	return (
		<Row id="subject-list" style={{ marginBottom: "50px" }}>
			<Col>
				<Card className="text-center">
					<Card.Header>
						<Card.Title> Subjects </Card.Title>
					</Card.Header>
					<ListGroup>
						{context.subjects.map(x => {
							return (
								<ListGroupItem
									key={x}
									className="text-center"
									action
									onClick={subjectClick}>
									{x}
								</ListGroupItem>
							);
						})}
					</ListGroup>
				</Card>
			</Col>
			<Col>
				<Records />
			</Col>
		</Row>
	);
};

const Records = () => {
	let context = useContext(Context);

	if (context.subject == "  ") {
		return <div />;
	} else {
		return (
			<>
				<RecordType type={"EP"} />
				<RecordType type={"HG"} />
			</>
		);
	}
};

const RecordType = props => {
	let context = useContext(Context);
	const recordClick = e => {
		context.setOnline(false);
		Array.from(e.target.parentNode.children).forEach(x =>
			x.classList.remove("active")
		);
		e.target.className = e.target.className + " active";
		context.setNewRecord({ name: e.target.innerHTML, type: props.type });
	};
	return (
		<>
			<Card className="text-center">
				<Card.Header>
					<Card.Title> {`${props.type}_Records`} </Card.Title>
				</Card.Header>
				<ListGroup>
					{context.records[props.type].map(x => {
						return (
							<ListGroupItem
								key={x}
								className="text-center"
								action
								onClick={recordClick}>
								{x}
							</ListGroupItem>
						);
					})}
				</ListGroup>
			</Card>
		</>
	);
};

export default loadRecords;
