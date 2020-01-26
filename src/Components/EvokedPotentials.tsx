import React, { useEffect, useState } from 'react';
import { scaleLinear } from 'd3-scale'
import {
	select, selectAll, mouse
} from "d3-selection";
import { extent, max, min } from 'd3-array'
import { line } from 'd3-shape'
import {
	OverlayTrigger, Popover, Tooltip
} from '../../node_modules/react-bootstrap'
import '../record_react/Record.scss'

import { interpolateRdBu, interpolatePuOr, interpolateRdYlBu, interpolateSpectral } from 'd3-scale-chromatic'

export default function EvokedPotentials(props) {
	const [data, setData] = useState();
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const [stimulatingElectrodes, setStimulatingElectrodes] = useState()
	const [zeroMark, setZeroMark] = useState(0);
	const [zScores, setZScores] = useState([])
	const [anatomicalLocation, setAnatomicalLocation] = useState([])

	useEffect(() => {
		var urlParams = new URLSearchParams(window.location.search);

		let recordType = urlParams.get('type');
		let recordName = urlParams.get('record');
		let subjectName = urlParams.get('subject');
		(async () => {

			let fetchRoute = `/api/data/${subjectName}/${recordName}/${recordType}`
			let response = await fetch(fetchRoute);
			let respData = await response.json()
			const chartContainer = document.getElementById("fm")
			let elec1 = recordName.split('_')[0]
			let elec2 = recordName.split('_')[1]
			setStimulatingElectrodes([elec1, elec2])
			setWidth(chartContainer.offsetWidth)
			setHeight(chartContainer.offsetHeight)
			setData(respData)
		})()
	}, [])

	useEffect(() => {
		if (data) {
			var x = scaleLinear()
				.domain([0, data[Object.keys(data)[0]].times.length])
				.range([0, width])
			setZeroMark(x(0))

			let responseGeometry = Object.keys(data).map(electrode => {
				let y = scaleLinear()
					.domain(extent(data[electrode].times))
					.range([0, 40]);

				console.log()

				select(`#${electrode}_container`).append('line').attr('x1', x(500)).attr('y1', 0).attr('x2', x(500)).attr('y2', 40).attr('stroke', 'red').attr('stroke-width', '1')


				select(`#${electrode}_path`)
					.datum(data[electrode].times)
					.attr("d", line()
						.x((d, i) => x(i))
						//@ts-ignore
						.y((d, i) => y(d))
					)
				let xCoord = document.getElementById(`${electrode}_circle`) ? parseFloat(document.getElementById(`${electrode}_circle`).getAttribute('cx')) : 0
				let yCoord = document.getElementById(`${electrode}_circle`) ? parseFloat(document.getElementById(`${electrode}_circle`).getAttribute('cy')) : 0
				return [xCoord, yCoord, data[electrode].zscores, props.locations[electrode]]
			})

			let circle1 = document.getElementById(`${stimulatingElectrodes[0]}_circle`)
			let circle2 = document.getElementById(`${stimulatingElectrodes[1]}_circle`)
			let xPos = (parseFloat(circle1.getAttribute('cx')) + parseFloat(circle2.getAttribute('cx'))) / 2
			let yPos = (parseFloat(circle1.getAttribute('cy')) + parseFloat(circle2.getAttribute('cy'))) / 2
			select('#imgContainer').select('svg').append('circle').attr('cx', xPos).attr('cy', yPos).attr('r', 5).attr('fill', 'white')
			let zscores = responseGeometry.map(elec => elec[2][1].toFixed(1))
			setZScores(zscores)
			console.log(responseGeometry)
			let locations = responseGeometry.map(elec => {
				if (elec[0] != 0) {
					return elec[3]["location"]
				}
				else return "Unknown"
			})
			setAnatomicalLocation(locations)
			responseGeometry.forEach((elec, i) => {
				// let color = interpolateRdBu(zscores[i] / Math.max(...zscores));
				// let color = interpolatePuOr(zscores[i] / Math.max(...zscores));
				// let color = interpolateRdYlBu(zscores[i] / Math.max(...zscores));
				let color = interpolateSpectral(zscores[i] / Math.max(...zscores));
				if (elec[0] != 0) {
					select('#imgContainer').select('svg').append('line').attr('x1', xPos).attr('y1', yPos).attr('x2', elec[0]).attr('y2', elec[1]).attr('stroke', color).attr('stroke-width', '3')
				}
			})
		}
	}, [data])

	const mouseEntered = e => {
		let channelSelected = e.target.getAttribute("title")
		let electrodeDot = document.getElementById(`${channelSelected}_circle`)
		select(electrodeDot).attr('fill', 'red').attr('r', '10')
	}
	const mouseLeft = e => {
		let channelSelected = e.target.getAttribute("title")
		let electrodeDot = document.getElementById(`${channelSelected}_circle`)
		select(electrodeDot).attr('fill', 'purple').attr('r', '2');
	}
	return (
		<div id="fm">
			{data && Object.keys(data).map((electrode, i) => {
				return (
					<OverlayTrigger
						placement="auto"
						overlay={
							<Tooltip id={`tooltip-${electrode}`}>
								<div>
									{electrode}
									<br />
									z-score: <strong>{zScores[i]}</strong>.
									<br />
									Location: <strong>{anatomicalLocation[i]}</strong>.
								</div>
							</Tooltip>
						}
					>
						<svg
							//@ts-ignore
							title={electrode}
							width={width}
							height={'40px'}
							onMouseEnter={e => mouseEntered(e)}
							onMouseLeave={e => mouseLeft(e)}
							id={`${electrode}_container`}

						>

							<text x="0" y="20" fontWeight="bold" fontSize="16">{electrode}</text>
							<path
								id={`${electrode}_path`}
								width={width}
								fill={'none'}
								stroke={'steelblue'}
								strokeWidth={1.5}
							></path>
						</svg>
					</OverlayTrigger>

				)

			})}


		</div>
	)




}