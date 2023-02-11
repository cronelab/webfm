"use client"
import React from 'react'
import {
  Container,
  Row,
  Col,
  Image,
} from 'react-bootstrap'
import Metadata from './Metadata'
import Online from './Online'
import Records from './Records'
import Subjects from './Subjects'


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
  const [subjectRecords, setSubjectRecords] = React.useState([])
  const [subject, setSubject] = React.useState('')
  const [brainImage, setBrainImage] = React.useState('');
  return (
    <Container>
      <Row>
        <Col md={3} sm={6}>
          <Online />
          <Subjects subjects={subjects} setSubjectRecords={setSubjectRecords} setBrainImage={setBrainImage} setSubject={setSubject}/>
        </Col>

        <Col md={5} sm={6}>
          <Image id="main-brain" src={brainImage} className="img-thumbnail" alt='brainImage' />
        </Col>

        <Col md={4} sm={6}>
          <Metadata />
          <Records records={subjectRecords} subject={subject}/>
        </Col>
      </Row>
    </Container>
  )
}

export default IndexContainer;