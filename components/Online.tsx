import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Form,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGear,
  faCheck,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons'
import Cookies from 'js-cookie'
import { BCI2K_OperatorConnection } from 'bci2k'
import Link from 'next/link'

const EditArea = props => {
  return (
    <Card.Title
      className="h6"
      id="online-options"
      style={{ display: 'flex', alignItems: 'baseline' }}
    >
      <Card.Text>Source</Card.Text>
      <Form.Control
        value={props.sourceAddress}
        onChange={e => props.setSourceAddress(e.target.value)}
      ></Form.Control>
      <FontAwesomeIcon
        className="icon-exclamation-sign"
        icon={faCheck}
        // onClick={() => setSourceAddress()}
      />
    </Card.Title>
  )
}

// var bciWatcher = new BCI2KWatcher()
const bciOperatorConn = new BCI2K_OperatorConnection()

export const Online = () => {
  const [showEditArea, setShowEditArea] = useState(false)
  const [sourceAddress, setSourceAddress] = useState('ws://localhost')
  const [live, setLive] = useState(false)
  const [bciConnectedState, setBCIConnectedState] = useState('Not connected')
  const [subjectName, setSubjectName] = useState('')
  const [taskName, setTaskName] = useState('')
  const [allowMapping, setAllowMapping] = useState(false)

  useEffect(() => {
    ;(async () => {
      let defaultSourceAddress = Cookies.get('sourceAddress')
      if (defaultSourceAddress === undefined) {
        try {
          let config = await fetch(`/api/config/online`)
          let data = await config.json()
          console.log(data)
          Cookies.set('sourceAddress', data.sourceAddress)
          defaultSourceAddress = data.sourceAddress
        } catch (err) {
          console.log(err)
        }
      }
      try {
        await bciOperatorConn.connect(defaultSourceAddress)
        bciOperatorConn.stateListen()
        bciOperatorConn.ondisconnect = () => {
          setLive(false);
        }
        bciOperatorConn.onStateChange = e => {
          setBCIConnectedState(e)
        }
      } catch (err) {
        console.log(err)
      }
    })()
  }, [])

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
        <Card.Header>
          <Card.Title
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Card.Text>Online</Card.Text>
            <FontAwesomeIcon
              className="icon-exclamation-sign"
              icon={faGear}
              onClick={() => setShowEditArea(!showEditArea)}
            />
          </Card.Title>
          {showEditArea ? (
            <EditArea
              sourceAddress={sourceAddress}
              setSourceAddress={setSourceAddress}
            />
          ) : null}
        </Card.Header>
      </Card>
      {live ? <ToggleLiveMode /> : <></>}
    </>
  )
}
export default Online
