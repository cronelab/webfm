import React, { useContext } from "react";
import { Navbar, Button } from 'react-bootstrap'
import { Context } from '../Context'

/**
 * @returns      Returns Header displaying "WebFM" and the subject/record name
 * @category Components
 */
export const Header = () => {
	const { subject, record }: any = useContext(Context)
	return (
		<Navbar
			id="header"
			// sticky="top"
			style={{
				"backgroundColor": "#397ad0",
				"borderColor": "#316198"
			}}>
				<Navbar.Brand style={{ "color": "#fffff6" }}>
					WebFM
				</Navbar.Brand>
			{/* <Navbar.Text
				style={{
					"margin": "0 auto",
					"color": "#fffff6"
				}}
				id="navbar_subject">{subject.name ? subject.name : ''} {record.name ? `: ${record.name}` : ''}
			</Navbar.Text> */}
		</Navbar>

	)
}

/**
 * @returns      Returns Footer displaying the current state of BCI2000
 * @category Components
 */
export const Footer = () => {
	const { bciState } = useContext(Context);
	return (
		<Navbar id="footer" sticky="bottom" style={{
			"backgroundColor": "#397ad0",
			"borderColor": "#316198",
			"position": "absolute",
			"left": "0",
			"bottom": "0",
			"right": "0"
		}}>
			<Navbar.Collapse id="bciStatus"
				style={{
					"position": "absolute",
					"right": "0%",
					"paddingRight": "1%"
				}}>
				{/* <Navbar.Text>BCI2000: </Navbar.Text> */}
				{/* <Navbar.Text>{bciState}</Navbar.Text> */}
			</Navbar.Collapse>
		</Navbar>
	);
};
