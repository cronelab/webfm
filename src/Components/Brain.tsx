import React, { useContext, useEffect, useRef } from "react";
import { Image } from '../../node_modules/react-bootstrap'
import "./Brain.scss";
import { Context } from "../Context";
import { fetchAndStoreBrain } from '../shared/loaders'

let GetDots = (dataList?: any) => {
	let [context]: any = useContext(Context);
	return (
		<div id="imgContainer">
			<svg>
				{Object.keys(context.subject.geometry).map((key, index) => {
					return (
						<circle
							key={`${key}_circle`}
							id={`${key}_circle`}
							cx={
								context.subject.geometry[key].u * context.brainContainer.width
							}
							cy={
								(1 - context.subject.geometry[key].v) *
								context.brainContainer.height
							}
							// cy={
							//   context.subject.geometry[key].v * context.brainContainer.height
							// }
							r="2"
							fill="purple"
						/>
					);
				})}
			</svg>
			{/* <Image src={context.brain} /> */}
		</div>
	);
};

const Brain = () => {
	let [context]: any = useContext(Context);

	// useEffect(() => {
	// 	const dotSize = () => {
	// 		context.setBrainSize({
	// 			width: document.getElementById("brainContainer").offsetWidth,
	// 			height: document.getElementById("brainContainer").offsetHeight
	// 		});
	// 	};

	// 	window.addEventListener("resize", dotSize);

	// 	return () => {
	// 		window.removeEventListener("resize", dotSize);
	// 	};
	// });

	useEffect(() => {
		fetchAndStoreBrain(context.subject.name).then(x => {
			console.log(context.subject)
			// context.setNewSubject({ name: context.subject, geometry: null })
			context.setNewBrain(x);
			context.setBrainSize({
				width: '100%',
				height: ''
			});
		});
	}, [context.subject]);

	return <Image id="imgRA" src={context.brain} style={context.brainContainer} />;
};

export default Brain;