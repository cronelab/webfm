import React, { useEffect, useState } from 'react'
import * as horizon from "d3-horizon-chart";
import {
	select, selectAll, mouse
} from "d3-selection";
import fmdata from '../shared/fmdata'
import fmui from '../shared/fmui'
import { scaleLinear } from 'd3-scale'
import { extent, max, min } from 'd3-array'
import '../record_react/Record.scss'
import * as THREE from "../../node_modules/three/src/Three";

export default function HighGamma(props) {

	const [height, setHeight] = useState(0);
	const [width, setWidth] = useState(0);
	const [zeroMark, setZeroMark] = useState(0);
	const [displayData, setDisplayData] = useState({});
	const [isMounted, setMounted] = useState(false);
	const [times, setTimes] = useState();
	let chartContainer;
	useEffect(() => {
		(async () => {
			let request = await fetch(`/config`)
			let configData = await request.json()
			let dataset = new fmdata();
			let uiManager = new fmui();

			uiManager.config.ui = configData;
			uiManager.setup()
			var urlParams = new URLSearchParams(window.location.search);

			let recordType = urlParams.get('type');
			let recordName = urlParams.get('record');
			let subjectName = urlParams.get('subject');
			let fetchRoute = `/api/data/${subjectName}/${recordName}/${recordType}`

			let response = await fetch(fetchRoute);
			let data = await response.json();
			await dataset.get(data)
			let dataTime = data.contents.times
			setTimes(dataTime)
			setDisplayData(dataset.displayData)
			setMounted(true)
		})()
	}, [])
	useEffect(() => {
		chartContainer = document.getElementById("fm");

		if (isMounted) {

			// let threeDElectrodes = props.scene.getObjectByName("Electrodes")
			if (props.scene) {

			}
			let locked = false;
			let x = scaleLinear()
				.domain(extent(times))
				.range([0, chartContainer.offsetWidth]);

			setZeroMark(x(0))

			let horizonChart = horizon
				.horizonChart()
				.height(30)
				// @ts-ignore
				.step(chartContainer.offsetWidth / displayData[Object.keys(displayData)[0]].length)
				.colors([
					"#313695",
					"#4575b4",
					"#74add1",
					"#abd9e9",
					// "#ffffff",
					"#fee090",
					"#fdae61",
					"#f46d43",
					"#d73027"
				]);
			console.log(displayData)
			selectAll(".fm-horizon")
				// @ts-ignore
				.data(Object.values(displayData))
				.each(horizonChart)
				.select(".title")
				.text((d, i) => Object.keys(displayData)[i]);

			setHeight(chartContainer.offsetHeight)
			setWidth(chartContainer.offsetWidth)

			selectAll(".fm-horizon").on("click", (d, i) => {
				locked = !locked;
			});
			selectAll(".fm-horizon")
				.on("mousemove", (d, i, nodes) => {
					// @ts-ignore
					let goal = x.invert(mouse(nodes[i])[0]);
					let answer = times.reduce((prev, curr) => Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);

					console.log(props.scene.getObjectByName("Electrodes").children[0].material.color)
					// @ts-ignore
					Object.values(times).map((x, i) => {
						console.log(nodes[i])
						// @ts-ignore
						if (x == answer) cursorLineMover(mouse(nodes[i])[0], i)
					});
				})
			const cursorLineMover = (position, dataIndex) => {
				if (!locked) {
					select(".cursorLine")
						.attr("x1", position)
						.attr("y1", 0)
						.attr("x2", position)
						.attr("y2", chartContainer.offsetHeight);
				}
			};
		}
	}, [isMounted])
	return (
		<div id="fm">
			<svg className="fm-cursor-svg"
				width={width}
				height={height}
			>
				<line
					className="zeroLine"
					style={{ "stroke": "black" }}
					strokeWidth={3}
					x1={zeroMark}
					x2={zeroMark}
					y1={0}
					y2={height}
				/>
				<line
					className="cursorLine"
					style={{ "stroke": "red" }}
					strokeWidth={3}
					y1={0}
					y2={height}
				/>
			</svg>
			{isMounted && Object.keys(displayData).map(channel => {
				return (
					<div className="fm-horizon"
						key={`${channel}_horizon`}
						id={`${channel}_horizon`}
						style={{ "outline": "thin solid black", "height": "20px" }}>
					</div>
				)
			})}
		</div>
	)
}


