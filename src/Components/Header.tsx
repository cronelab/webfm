import React, { useContext } from "react";
import { Navbar, Button } from 'react-bootstrap'
import { Context } from '../Context'

const bciStatusStyle = {
	"position": "absolute",
	"right": "0%",
	"paddingRight": "1%"
} as React.CSSProperties

const footerStyle = {
	"backgroundColor": "#397ad0",
	"borderColor": "#316198",
	"position": "absolute",
	"left": "0",
	"bottom": "0",
	"right": "0"
} as React.CSSProperties



/**
 * @returns      Returns Header displaying "WebFM" and the subject/record name
 * @category Components
 */
export const Header = () => {
	const header = {
		main: {
			"backgroundColor": "#397ad0",
			"borderColor": "#316198"
		},
		subject: {
			"margin": "0 auto",
			"color": "#fffff6"
		}
	} as React.CSSProperties
	const { subject, record }: any = useContext(Context)
	return (
		<Navbar id="header" sticky="top" style={header["main"]}>
			<Button href="/">
				<Navbar.Brand style={{ "color": "#fffff6" }}>
					WebFM
				</Navbar.Brand>
			</Button>
			<Navbar.Text style={header["subject"]} id="navbar_subject">{subject.name ? subject.name : ''} {record.name ? `: ${record.name}` : ''}</Navbar.Text>
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
		<Navbar id="footer" sticky="bottom" style={footerStyle}>
			<Navbar.Collapse id="bciStatus" style={bciStatusStyle}>
				<Navbar.Text>BCI2000: </Navbar.Text>
				<Navbar.Text>{bciState}</Navbar.Text>
			</Navbar.Collapse>
		</Navbar>
	);
};
