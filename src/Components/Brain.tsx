import React, { useContext, useEffect, useState } from "react";
import { Image } from '../../node_modules/react-bootstrap'
import { Context } from "../Context";
import { fetchAndStoreBrain, fetchAndStoreGeometry } from '../shared/loaders'

const Brain = (props) => {
	let { subject, setNewBrainCoord, setNewBrain, brain, brainCoord }: any = useContext(Context);
	if (subject.name == "") subject.name = "PY17N005"
	const [brainCoords, setBrainCoords] = useState({})
	let actualCoords = {}

	//Initial render once all the subjects are queried
	useEffect(() => {
		let brainContainer = document.getElementById('brain');

		Promise.all([fetchAndStoreBrain(subject.name), fetchAndStoreGeometry(subject.name)]).then(vals => {
			setNewBrain(vals[0])
			let geometry = vals[1]

			//@ts-ignore
			Object.keys(geometry).forEach(electrodes => {
				let vals = geometry[electrodes]
				actualCoords[electrodes] = {
					u: vals.u * brainContainer.offsetWidth,
					v: (1 - vals.v) * brainContainer.offsetHeight,
					location: vals.location
				}
			})
			setNewBrainCoord(JSON.stringify(actualCoords))
			setBrainCoords(actualCoords)

		})

	}, [subject])



	return (
		<>
			<div id="imgContainer" style={{ "height": "100%", "width": "100%", "marginTop": "50px", "position": "fixed" }}>
				<svg style={{ "height": "100%", "width": "100%" }}>
					{Object.keys(brainCoords).map((key, index) => {
						return (
							<circle
								key={`${key}_circle`}
								id={`${key}_circle`}
								cx={brainCoords[key].u}
								cy={brainCoords[key].v}
								r="2"
								fill="white"
							/>
						);
					})}
				</svg>
			</div>
			<Image id="brain" src={brain} style={{ "marginTop": "50px", "zIndex": -1 }} fluid />
		</>
	)
};

export default Brain;
