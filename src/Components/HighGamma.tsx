//@ts-nocheck
import React, { useEffect, useState } from 'react'
import * as horizon from "d3-horizon-chart";
import {
	select, selectAll, mouse
} from "d3-selection";
import { scaleLinear } from "d3-scale"
import fmdata from '../shared/fmdata'
import fmui from '../shared/fmui'
import { extent, max, min } from 'd3-array'
import '../record_react/Record.scss'

export default function HighGamma(props) {

	const [height, setHeight] = useState(0);
	const [width, setWidth] = useState(0);
	const [zeroMark, setZeroMark] = useState(0);
	const [displayData, setDisplayData] = useState({});
	const [isMounted, setMounted] = useState(false);
	const [times, setTimes] = useState();
	let locked = false;
	const [colors, setColors] = useState([
		"#313695",
		"#4575b4",
		"#74add1",
		"#abd9e9",
		"#ffffff",
		"#fee090",
		"#fdae61",
		"#f46d43",
		"#d73027"
	])

	let chartContainer;
	let dotColorScale = scaleLinear()
		//@ts-ignore
		.domain([-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9])
		//@ts-ignore
		.range(colors)
		.clamp(true);

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

		// document.getElementById('sweepButton').onclick = async () => {
		// 	for (let i = 250; i < 900; i++) {
		// 		await sleep(10)
		// 		lineAndDotUpdate(i);
		// 	}
		// }

		if (isMounted) {
			let x = scaleLinear()
				.domain(extent(times))
				.range([0, chartContainer.offsetWidth]);

			setZeroMark(x(0))

			let horizonChart = horizon
				.horizonChart()
				.height(15)
				// @ts-ignore
				.step(chartContainer.offsetWidth / displayData[Object.keys(displayData)[0]].length)
				.colors(colors);
			selectAll(".fm-horizon")
				// @ts-ignore
				.data(Object.values(displayData))
				.each(horizonChart)
				.select(".title")
				.text((d, i) => Object.keys(displayData)[i]);

			setHeight(chartContainer.offsetHeight)
			setWidth(chartContainer.offsetWidth)

			selectAll(".fm-horizon").on("click", () => {
				locked = !locked;
			});

			selectAll(".fm-horizon")
				.on("mousemove", () => {
					if (!locked) {
						let firstHorizon = document.getElementsByClassName('fm-horizon')[0]
						//@ts-ignore
						let position = mouse(firstHorizon)[0];
						lineAndDotUpdate(position);
					}
				})
		}
	}, [isMounted])

	const lineAndDotUpdate = (position) => {
		cursorLineMover(position);
		dotUpdator(position)
	}

	const dotUpdator = (position) => {
		let nodes = document.getElementsByClassName('fm-horizon');
		let firstHorizon = nodes[0];
		//@ts-ignore

		let zedIndex = Math.floor(position / (firstHorizon.offsetWidth / times.length));
		//@ts-ignore
		[...nodes].map((node, i) => {
			//@ts-ignore
			let dot = document.getElementById(`${node.id.split("_")[0]}_circle`)
			if (dot) {
				//@ts-ignore
				if ((node.__data__[zedIndex]).toString() != "NaN") {
					//@ts-ignore
					dot.setAttribute('r', (Math.abs(node.__data__[zedIndex]) * 5 + 2).toString())
					//@ts-ignore
					dot.setAttribute('fill', dotColorScale(node.__data__[zedIndex]))
				}
			}
		})
	}

	const cursorLineMover = position => {
		if (!locked) {
			select(".cursorLine")
				.attr("x1", position)
				.attr("y1", 0)
				.attr("x2", position)
				.attr("y2", chartContainer.offsetHeight);
		}
	};


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
						style={{ "outline": "thin solid black", "height": `${height / Object.keys(displayData).length}px` }}>
					</div>
				)
			})}
		</div>
	)
}


