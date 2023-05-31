'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { Container, Navbar, Offcanvas, Nav, Form, Card } from 'react-bootstrap'
import { toggleOnline } from '../../app/redux/online'
import styles from './Header.module.scss'
import { useAppSelector, useAppDispatch } from '../../app/redux/hooks'
import { setSourceAddress } from '../../app/redux/online'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const Header = () => {
  const { sourceAddress, onlineState } = useAppSelector(state => state.online)

  const [localAddress, setLocalAddress] = useState(sourceAddress)

  const dispatch = useAppDispatch()
  return (
    <>
      <Navbar expand={false} fixed="top" className={styles.header}>
        <Container fluid>
          <Link href="/">
            <Navbar.Brand className={styles['navbar-brand']}>
              WebFM
            </Navbar.Brand>
          </Link>{' '}
          <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${false}`} />
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-${false}`}
            aria-labelledby={`offcanvasNavbarLabel-expand-${false}`}
            placement="end"
          >
            <Offcanvas.Header
              closeButton
              style={{ borderBottom: '2px solid black' }}
            >
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${false}`}>
                Options
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Form>
                <Form.Check
                  type="switch"
                  label="Live mode"
                  onChange={() => dispatch(toggleOnline(!onlineState))}
                />
              </Form>
              {onlineState && (
                <Card.Title
                  className="h6"
                  id="online-options"
                  style={{ display: 'flex', alignItems: 'baseline' }}
                >
                  <Card.Text>Source</Card.Text>
                  <Form.Control
                    value={localAddress}
                    onChange={e => setLocalAddress(e.target.value)}
                    onBlur={e => dispatch(setSourceAddress(e.target.value))}
                  ></Form.Control>
                  <FontAwesomeIcon icon={faCheck} />
                </Card.Title>
              )}
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    </>
  )
}

export const Footer = () => {
  return (
    <Navbar fixed="bottom" className={styles.header}>
      <Container></Container>
    </Navbar>
  )
}
