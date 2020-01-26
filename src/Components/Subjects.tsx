
import React, { useContext, useEffect, useState } from "react";
import {
	Card, InputGroup, FormControl, Row, Col, Container,
	Tab, Nav, Button, Modal, ListGroup, ListGroupItem
} from '../../node_modules/react-bootstrap'
import { Context } from '../Context'
import './Subjects.scss'

export default function Subjects() {
	let { records, subjects, subject, setNewSubject, setNewBrain, setAllSubjects, setAllRecords, setNewRecord }: any = useContext(Context);
	const [show, setShow] = useState(false);
	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);
	let tempArray = {}

	//Request all EP and HG records from server
	const getRecords = async (subj) => {
		let epPath = `/api/${subj}/records/EP`;
		let hgPath = `/api/${subj}/records/HG`;
		let epReq = await fetch(epPath);
		let hgReq = await fetch(hgPath);
		let epResp = null;
		let hgResp = null;
		if (hgReq.status != 204) {
			hgResp = await hgReq.json();
		}
		else {
			hgResp = []
		}
		if (epReq.status != 204) {
			epResp = await epReq.json();
		}
		else {
			epResp = [];
		}
		tempArray[subj] = { EP: epResp, HG: hgResp };
		setAllRecords(tempArray)
	};

	//Request all subjects from server
	useEffect(() => {
		(async () => {
			let listPathRes = await fetch(`/api/list`);
			let foundSubjects = await listPathRes.json();
			if (foundSubjects.length > 0) {
				foundSubjects.sort();
				foundSubjects.forEach(subject => getRecords(subject))
				setAllSubjects(foundSubjects);
			}
			else {
				console.log("Nobody can be found")
			}
		})()
	}, []);

	const uploadGeometry = () => { }
	const uploadBrain = () => {
		setNewBrain("");
	}

	const handleChange = (e) => {
		console.log(e.target.value)
		setNewSubject(e.target.value)
	}
	const createNewSubject = (e) => {
		setNewSubject({ name: subject, geometry: null });
		setAllSubjects([...subjects, subject])
	}

	const SubjectModal = () => {
		return (
			<Modal
				show={show}
				onHide={handleClose}
				animation={false}
				size="lg">
				<Modal.Header closeButton>
					<Modal.Title>Subject list</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<SubjectList />
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleClose}>
						Close
				</Button>
				</Modal.Footer>
			</Modal>
		)
	}

	const SubjectList = () => {
		return (
			<Tab.Container defaultActiveKey="first">
				<Row>
					<Col sm={3}>
						<Nav
							variant="pills"
							className="flex-column"
						>
							{subjects.map((subject, index) => {
								return (
									<Nav.Item key={`${subject}_${index}`}>
										<Nav.Link eventKey={subject}>
											{subject}
										</Nav.Link>
									</Nav.Item>
								)
							})}
						</Nav>
					</Col>
					<Col sm={9}>
						<Tab.Content>
							{subjects.map((subject, index) => {
								return (
									<Tab.Pane
										id={subject}
										eventKey={`${subject}`}
										key={`${subject}_${index}_pane`}>
										<h1>{subject}</h1>
										<Container>
											<Row>
												<Col>
													<ListGroup>
														<ListGroupItem key="EP_Records" style={{ backgroundColor: "#00f" }}>
															Evoked Potentials
														</ListGroupItem>
														{records[subject].EP.map(ep => {
															return (
																<ListGroupItem key={`${subject}_${ep}`}
																	action href={`/records?subject=${subject}&type=EP&record=${ep}`}
																>
																	{ep}
																</ListGroupItem>
															)
														})}
													</ListGroup>
												</Col>
												<Col>
													<ListGroup>
														<ListGroupItem key="HG_Records" style={{ backgroundColor: "#00f" }}>
															High Gamma
														</ListGroupItem>
														{records[subject].HG.map(hg => {

															return (
																<ListGroupItem key={`${subject}_${hg}`}
																	action href={`/records?subject=${subject}&type=HG&record=${hg}`}
																>
																	{hg}
																</ListGroupItem>
															)
														})}
													</ListGroup>
												</Col>
											</Row>
										</Container>
									</Tab.Pane>
								)
							})}
						</Tab.Content>
					</Col>
				</Row>
			</Tab.Container >
		)
	}
	return (
		<React.Fragment>
			<Card>
				<Card.Header>
					<Card.Title as="h3">
						Subjects <span className="pull-right"></span>
					</Card.Title>
				</Card.Header>
				<InputGroup>
					<InputGroup.Prepend>
						<InputGroup.Text id="basic-addon1">ID</InputGroup.Text>
					</InputGroup.Prepend>
					<FormControl
						id="new-subject-id"
						type="text"
						placeholder="PYXXN000"
						onChange={handleChange}
					/>
					<Button onClick={createNewSubject} type="submit" id="new-subject-ok" variant="outline-secondary">Button</Button>
				</InputGroup>
				<Button onClick={uploadBrain}>Upload brain</Button>
				<Button onClick={uploadGeometry}>Upload geometry</Button>

				<Button
					title="Subjects"
					id="subject-list"
					style={{ width: "100%" }}
					onClick={handleShow.bind(this)}
				>
					Subjects
				</Button>
			</Card>
			<SubjectModal />
		</React.Fragment >
	)
}