import React, { useState, useContext } from 'react';
import { ToggleButton, ButtonToolbar, ToggleButtonGroup, Navbar, Container, Button } from '../../node_modules/react-bootstrap'
import { Context } from '../Context'

const DataHeader = () => {
	const { brainType, setBrainType, mapData, setMapData } = useContext(Context);
	const [defaultChoice, setDefaultChoice] = useState(1)

	const brainSetter = e => {
		if (e == 1) { setBrainType("2D") }
		else if (e == 2) { setBrainType("3D") }
	}

	const dataChanger = e => {
		if (e == 1) {
			setMapData('CCEP')
			setDefaultChoice(1)
		}
		if (e == 2) {
			setMapData('lgData')
			setDefaultChoice(2)
		}
		if (e == 3) {
			setMapData('hgData')
			setDefaultChoice(3)
		}
	}
	const EPSelector = () => {
		let urlParams = new URLSearchParams(window.location.search);

		if (urlParams.get('type') == "EP" || urlParams.get('type') == "CCSR") {
			return (
				<ButtonToolbar style={{ "float": "left" }}>
					<ToggleButtonGroup
						name="options"
						type="radio"
						defaultValue={defaultChoice}
						onChange={(e) => dataChanger(e)}
					>
						<ToggleButton value={1}>CCSR (low gamma) </ToggleButton>
						<ToggleButton value={2}>CCSR (high gamma)</ToggleButton>
					</ToggleButtonGroup>
				</ButtonToolbar>

			)
		}
		else {
			return <div></div>
		}
	}
	return (
		<Container fluid style={{ "padding": "0" }}>
			<Navbar id="dataHeader" fixed="top" expand="lg" variant="dark" bg="dark" style={{ "marginTop": "60px" }}>
				<EPSelector></EPSelector>

				<ButtonToolbar style={{ "position": "absolute", "right": "0px" }}>
					<ToggleButtonGroup
						name="options"
						type="radio"
						defaultValue={1}
						onChange={e => brainSetter(e)}
					>
						<ToggleButton value={1}>2D</ToggleButton>
						<ToggleButton value={2}>3D</ToggleButton>
					</ToggleButtonGroup>

				</ButtonToolbar>
			</Navbar>
		</Container>
	)
}

export default DataHeader;