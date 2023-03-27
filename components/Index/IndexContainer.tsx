'use client'
import React, { useState } from 'react'
import { Container, Row, Col, Image } from 'react-bootstrap'
import Metadata from './Metadata'
import Online from './Online'
import Records from './Records'
import Subjects from './Subjects'
import { store } from '../../app/redux/store'
import { Provider } from 'react-redux'

import Cookies from 'js-cookie'

var parameterRecheckDuration = 2000
var goLiveStates = ['Suspended', 'Running']
var mapItStates = ['Running']
var infoStates = ['Suspended', 'Running']
var stateClasses = {
  'Not Connected': 'text-muted',
  Idle: 'text-info',
  Suspended: 'text-warning',
  Running: 'text-success',
}

export const IndexContainer = ({ subjects }) => {
  const [subjectRecords, setSubjectRecords] = useState([])
  const [subject, setSubject] = useState('')
  const [brainImage, setBrainImage] = useState('')
  return (
    <Provider store={store}>
      <Container>
        <Row>
          <Col
            md={3}
            sm={6}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <Online />
            <Subjects
              subjects={subjects}
              setSubjectRecords={setSubjectRecords}
              setBrainImage={setBrainImage}
              setSubject={setSubject}
            />
          </Col>

          <Col md={5} sm={6}>
            {brainImage == '' ? (
              <></>
            ) : (
              <Image
                id="main-brain"
                src={brainImage}
                className="img-thumbnail"
                alt="brainImage"
              />
            )}
          </Col>

          <Col md={4} sm={6}>
            <Metadata />
            <Records records={subjectRecords} subject={subject} />
          </Col>
        </Row>
      </Container>
    </Provider>
  )
}

export default IndexContainer
