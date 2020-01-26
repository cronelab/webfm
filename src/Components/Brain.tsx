import React, { useContext, useEffect, useRef } from "react";
import { Image } from '../../node_modules/react-bootstrap'
import { Context } from "../Context";
import { fetchAndStoreBrain, fetchAndStoreGeometry } from '../shared/loaders'

const Brain = (props) => {
	let { subject, setNewBrainCoord, setNewBrain, brain }: any = useContext(Context);
	if (subject.name == "") subject.name = "PY17N005"


	//Initial render once all the subjects are queried
	useEffect(() => {
		(async () => {
			let brainImage = await fetchAndStoreBrain(subject.name)
			setNewBrain(brainImage)
			let geometry = await fetchAndStoreGeometry(subject.name);
			setNewBrainCoord(JSON.stringify(geometry))
		})()
	}, [subject])

	return <Image id="brain" src={brain} style={{ "marginTop": "50px", "zIndex": -1, "height": "85%", "position": "fixed" }} />;
};

export default Brain;
