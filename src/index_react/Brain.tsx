import React, { Component, useContext, useEffect, useRef } from "react";
import Image from "react-bootstrap/Image";
import "./Brain.scss";
import { Context } from "../Context";

let getImage = async subject => {
	let response = await fetch(`/api/brain/PY19N024`);
	// let response = await fetch(`/api/brain/${subject}`);
	let brain = await response.arrayBuffer();
	let binary = "";
	Array.prototype.slice
		.call(new Uint8Array(brain))
		.map(b => (binary += String.fromCharCode(b)));
	return `data:image/jpeg;base64,${btoa(binary)}`;
};

let GetDots = dataList => {
	let context: any = useContext(Context);

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
			<Image id="imgRA" src={context.brain} />
		</div>
	);
};

const Brain = () => {
	let context: any = useContext(Context);

	useEffect(() => {
		const dotSize = () => {
			context.setBrainSize({
				width: document.getElementById("brainContainer").offsetWidth,
				height: document.getElementById("brainContainer").offsetHeight
			});
		};

		window.addEventListener("resize", dotSize);

		return () => {
			window.removeEventListener("resize", dotSize);
		};
	});

	useEffect(() => {
		getImage(context.subject.name).then(x => {
			context.setNewBrain(x);
		});
		context.setBrainSize({
			width: document.getElementById("brainContainer").offsetWidth,
			height: document.getElementById("brainContainer").offsetHeight
		});
	}, [context.subject]);

	// if (context.subject.geometry != null) {
	// 	return <GetDots />;
	// } else {
	// 	return <div />;
	// }
};

export default Brain;
