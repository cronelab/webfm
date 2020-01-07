
import React, { useContext } from "react";
import "./Header.scss";
import {
	Container, Nav, Navbar, Button
} from '../../node_modules/react-bootstrap'
import { Context } from '../Context'

export default function Header() {
	const { subject, record }: any = useContext(Context)
	return (
		<Navbar id="header" sticky="top">
			<Button>
				<Navbar.Brand>
					WebFM
				</Navbar.Brand>
			</Button>
			<Navbar.Text id="navbar_subject">{subject.name || ''} : {record.name || ''}</Navbar.Text>
		</Navbar>

	)
}

export const Footer = () => {
	const { bciState } = useContext(Context);

	return (
		<Navbar id="footer" fixed="bottom">
			<Navbar.Collapse id="bciStatus">
				<Navbar.Text>BCI2000: </Navbar.Text>
				<Navbar.Text>{bciState}</Navbar.Text>
			</Navbar.Collapse>
		</Navbar>
	);
};
