
import React, { useContext, useEffect, useState } from "react";
import {
	Card, InputGroup, FormControl,
	Button, ButtonGroup, DropdownButton, Dropdown
} from '../../node_modules/react-bootstrap'
import { Context } from '../Context'

export default function Subjects() {
	let [context]: any = useContext(Context);
	let [subject, setSubject] = useState('');

	useEffect(() => {
		(async () => {
			let listPathRes = await fetch(`/api/list`);
			let foundSubjects = await listPathRes.json();
			if (foundSubjects.length > 0) {
				foundSubjects.sort();
				context.setAllSubjects(foundSubjects);
			}
			else {
				console.log("Nobody can be found")
			}
		})()
	}, []);

	const uploadGeometry = () => { }
	const uploadBrain = () => {
		context.setNewBrain("");
	}

	const handleChange = (e) => {
		setSubject(e.target.value)
	}
	const createNewSubject = (e) => {
		context.setNewSubject({ name: subject, geometry: null });
		context.setAllSubjects([...context.subjects, subject])
	}

	const selectSubject = (e) => {
		context.setNewSubject({ name: e, geometry: null });
	}

	return (
		<div>
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

					{/* <InputGroup.Append>
					</InputGroup.Append> */}
				</InputGroup>
				<Button onClick={uploadBrain}>Upload brain</Button>
				<Button onClick={uploadGeometry}>Upload geometry</Button>

				<DropdownButton as={ButtonGroup} title="Subjects" id="subject-list" vertical style={{ "width": "100%" }}>
					{context.subjects.sort().map((individualSubject: string, index: string) => {
						return <Dropdown.Item key={index} onClick={selectSubject.bind(this, individualSubject)}>{individualSubject}</Dropdown.Item>
						// change brain
						// load records
					})}
				</DropdownButton>
			</Card>
		</div>
	)
}