
import React, { useContext, useEffect, useState } from "react";
import './Subjects.scss'
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
	useEffect(() => {
		(async () => {
			let subject = 'PY19N024'
			let epPath = `/api/${subject}/records/EP`;
			let resP = await fetch(epPath);
			let res = await resP.json();
			context.setAllRecords({ EP: res, HG: [] })
		})();
	}, [])

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

	const selectRecord = (e) => {
		console.log(e);
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

				<DropdownButton as={ButtonGroup}
					title="Subjects"
					id="subject-list"
					vertical
					style={{ width: "100%" }}>
					{context.subjects.sort().map((individualSubject: string, index: string) => {
						return (
							// <DropdownButton id="dropdown-item-button" title="Dropdown button">
							// </DropdownButton>
							<DropdownButton as={ButtonGroup}
								key={index}
								onClick={selectSubject.bind(this, individualSubject)}
								title={individualSubject}
								id="subject-record-list"
								drop={'left'}
							>
								{context.records.EP.map((EPrecord: string, index: string) => {
									return (
										<Dropdown.Item as="button"
											key={index}
											id={EPrecord}
											onClick={selectRecord.bind(this, EPrecord)}
										>
											{EPrecord}
										</Dropdown.Item>
									)
								})}
							</DropdownButton>
						)
						// load records
					})}
				</DropdownButton>
			</Card>
		</React.Fragment >
	)
}