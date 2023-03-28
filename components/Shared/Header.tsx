"use client"
import Link from 'next/link'
import React from 'react'
import { Button, Container, Navbar } from 'react-bootstrap'

import styles from './Header.module.scss'

export const Header = () => {
  return (
    <Navbar fixed="top" className={styles.header}>
      <Container>
        <Link href="/">
          <Navbar.Brand className={styles["navbar-brand"]}>WebFM</Navbar.Brand>
        </Link>
        <div className='fm-subject-name' />
      </Container>
    </Navbar>
  )
}

export const Footer = () => {
  return (
    <Navbar fixed="bottom" className={styles.header}>
      <Container>
      </Container>
    </Navbar>
  )
}