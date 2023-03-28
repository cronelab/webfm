'use client'
import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import Metadata from './Metadata'
import Online from './Online'
import Records from './Records'
import Subjects from './Subjects'
import { store } from '../../app/redux/store'
import { Provider } from 'react-redux'
import styles from './Index.module.scss'
import { BrainContainer } from '../Shared/BrainContainer'

export const IndexContainer = () => {
  return (
    <Provider store={store}>
      <Container fluid>
        <Row>
          <Col md={3} sm={6} className={styles.column1}>
            <Online />
            <Subjects />
          </Col>

          <Col md={5} sm={6} className={styles.imageContainer}>
            <BrainContainer />
          </Col>

          <Col md={4} sm={6}>
            <Metadata />
            <Records />
          </Col>
        </Row>
      </Container>
    </Provider>
  )
}

export default IndexContainer
