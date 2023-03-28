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
import { Header } from '../Shared/Header'
import { useAppSelector } from '../../app/redux/hooks'

const MenuColumn = () => {
  const { currentSubject } = useAppSelector(state => state.subjects)
  const { onlineState } = useAppSelector(state => state.online)
  return (
    <Container fluid>
      <Row>
        <Col md={4} className={styles.column1}>
          {onlineState ? <Online /> : <Subjects />}
          {currentSubject && (
            <>
              <Metadata />
              <Records />
            </>
          )}
        </Col>
        <Col md={8} className={styles.imageContainer}>
          <BrainContainer />
        </Col>
      </Row>
    </Container>
  )
}

export const IndexContainer = () => {
  return (
    <Provider store={store}>
      <Header />
      <MenuColumn />
    </Provider>
  )
}

export default IndexContainer
