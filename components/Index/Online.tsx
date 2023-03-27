import React, { useState, useEffect } from 'react'
import { Card, Button, Form } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGear,
  faCheck,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons'
import { BCI2K_OperatorConnection } from 'bci2k'
import Link from 'next/link'

const EditArea = ({ sourceAddress, setSourceAddress }) => {
  const [localAddress, setLocalAddress] = useState(sourceAddress)
  return (
    <Card.Title
      className="h6"
      id="online-options"
      style={{ display: 'flex', alignItems: 'baseline' }}
    >
      <Card.Text>Source</Card.Text>
      <Form.Control
        value={localAddress}
        onChange={e => setLocalAddress(e.target.value)}
        onBlur={e => setSourceAddress(e.target.value)}
      ></Form.Control>
      <FontAwesomeIcon icon={faCheck} />
    </Card.Title>
  )
}

export const Online = () => {
  const [bciOperatorConn, setBCIOperatorConn] = useState(
    new BCI2K_OperatorConnection()
  )
  const [showEditArea, setShowEditArea] = useState(false)
  const [sourceAddress, setSourceAddress] = useState('')
  const [live, setLive] = useState(false)
  const [bciConnectedState, setBCIConnectedState] = useState('Not connected')
  const [subjectName, setSubjectName] = useState('')
  const [taskName, setTaskName] = useState('')
  const [allowMapping, setAllowMapping] = useState(false)

  useEffect(() => {
    ;(async () => {
      let defaultSourceAddress = localStorage.getItem('sourceAddress')
      setSourceAddress(defaultSourceAddress)
      if (defaultSourceAddress === null) {
        try {
          let config = await fetch(`/api/config/online`)
          let data = await config.json()
          localStorage.setItem('sourceAddress', data.sourceAddress)
          defaultSourceAddress = data.sourceAddress
          setSourceAddress(defaultSourceAddress)
        } catch (err) {
          console.log(err)
        }
      }
    })()
  }, [])

  useEffect(() => {
    if (sourceAddress === '' || sourceAddress === null) return
    localStorage.setItem('sourceAddress', sourceAddress)
    let newBCI = new BCI2K_OperatorConnection()
    setBCIOperatorConn(newBCI)
    ;(async () => {
      try {
        await newBCI.connect(sourceAddress)
        newBCI.stateListen()
        newBCI.ondisconnect = () => {
          setLive(false)
        }
        newBCI.onStateChange = e => {
          setBCIConnectedState(e)
        }
      } catch (err) {
        console.log(err)
      }
    })()
  }, [sourceAddress])

  useEffect(() => {
    ;(async () => {
      if (bciConnectedState !== 'Not connected') {
        setLive(true)
      }
      if (
        bciConnectedState === 'Resting' ||
        bciConnectedState === 'Running' ||
        bciConnectedState === 'Suspended' ||
        bciConnectedState === 'ParamsModified'
      ) {
        setSubjectName(await bciOperatorConn.getSubjectName())
        setTaskName(await (await bciOperatorConn.getTaskName()).split('/')[1])
      }
      if (bciConnectedState === 'Running') {
        setAllowMapping(true)
      }
      if (bciConnectedState === 'Suspended') {
        setAllowMapping(false)
      }
    })()
  }, [bciConnectedState])

  const ToggleLiveMode = () => {
    return (
      <Card>
        <Card.Header>
          <Card.Title>{bciConnectedState}</Card.Title>
        </Card.Header>
        <Card.Body>
          <Card.Text>Subject: {subjectName}</Card.Text>
          <Card.Text>Task: {taskName}</Card.Text>
          {allowMapping ? (
            <Link href="/map/?view=WebFM: Map">
              <Button>
                <FontAwesomeIcon
                  icon={faLocationDot}
                  // onClick={() => goWeb()}
                />
                <strong>Map it</strong>
              </Button>
            </Link>
          ) : (
            // <ListGroup>
            //   <ListGroupItem
            //     id="map-button"
            //     className="list-group-item-info"
            //     action
            //     href="/map/?view=WebFM: Map"
            //   >
            //   </ListGroupItem>
            // </ListGroup>
            <></>
          )}
        </Card.Body>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Card.Header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Card.Title>
            <Card.Text>Online</Card.Text>
          </Card.Title>
          <FontAwesomeIcon
            icon={faGear}
            onClick={() => setShowEditArea(!showEditArea)}
          />
        </Card.Header>

        {showEditArea ? (
          <Card.Header>
            <EditArea
              sourceAddress={sourceAddress}
              setSourceAddress={setSourceAddress}
            />
          </Card.Header>
        ) : null}
      </Card>
      {live ? <ToggleLiveMode /> : <></>}
    </>
  )
}
export default Online
