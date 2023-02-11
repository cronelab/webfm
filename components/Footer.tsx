"use client"
import React from 'react'
import styles from '../styles/Footer.module.scss'
import { Navbar, Container } from 'react-bootstrap'

export const Footer = () => {
  return (
    <Navbar fixed="bottom" className={styles['footer']}>
      <Container>
        <Navbar.Text>
          Fork me on <a href="http://github.com/cronelab/webfm">GitHub</a>.
          Powered by <a href="#">Bootstrap</a> and <a href="#">node.js</a>.
        </Navbar.Text>
      </Container>
    </Navbar>
  )
}

export default Footer;