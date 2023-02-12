"use client"
import React from 'react'
import { Button, Container, Navbar } from 'react-bootstrap'

import styles from './Header.module.scss'

export const Header = () => {
  return (
    <Navbar fixed="top" className={styles["navbar-inverse"]}>
      <Container>
          <Navbar.Brand className={styles["navbar-brand"]} href="#">WebFM</Navbar.Brand>
      </Container>
    </Navbar>
  )
}

export default Header;