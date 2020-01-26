import React, { useState, useContext } from 'react';
import { ToggleButton, ButtonToolbar, ToggleButtonGroup, Navbar, Container, Button } from '../../node_modules/react-bootstrap'
import { Context } from '../Context'

const DataHeader = () => {
	const { brainType, setBrainType } = useContext(Context);

	const brainSetter = e => {
		if (e == 1) { setBrainType("2D") }
		else if (e == 2) { setBrainType("3D") }
	}
	var urlParams = new URLSearchParams(window.location.search);

	const dataChanger = e => {
		if (e == 1) {

		}
	}
	const EPSelector = () => {
		if (urlParams.get('type') == "EP") {
			return (
				<ToggleButtonGroup name="options"
					type="radio"
					defaultValue={1}
					onChange={(e) => dataChanger(e)}
				>
					<ToggleButton value={1}>EP</ToggleButton>
					<ToggleButton value={2}>CCSR_lg</ToggleButton>
					<ToggleButton value={3}>CCSR_hg</ToggleButton>
				</ToggleButtonGroup>
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
				<ButtonToolbar style={{ "float": "right" }}>
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