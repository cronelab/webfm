import React, { useState, useEffect } from 'react'
import { Card, Button, Form } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { BCI2K_OperatorConnection } from 'bci2k'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from '../../app/redux/hooks'
import { setSourceAddress, toggleOnline } from '../../app/redux/online'
export const Online = () => {
  const [bciOperatorConn, setBCIOperatorConn] = useState(
    new BCI2K_OperatorConnection()
  )

  const dispatch = useAppDispatch()

  const [bciConnectedState, setBCIConnectedState] = useState('Not connected')
  const [subjectName, setSubjectName] = useState('')
  const [taskName, setTaskName] = useState('')
  const [allowMapping, setAllowMapping] = useState(false)

  const { sourceAddress, onlineState } = useAppSelector(state => state.online)

  useEffect(() => {
    ;(async () => {
      // dispatch(setSourceAddress(defaultSourceAddress))
      // if (defaultSourceAddress === null) {
      try {
        let config = await fetch(`/api/config/online`)
        let data = await config.json()
        localStorage.setItem('sourceAddress', data.sourceAddress)
        // defaultSourceAddress = data.sourceAddress
        dispatch(setSourceAddress(data.sourceAddress))
      } catch (err) {
        console.log(err)
      }
      // }
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
          toggleOnline(false)
          // setLive(false)
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
        // setLive(true)
        toggleOnline(true)
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

  return (
    <>
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
      </Card>{' '}
    </>
  )
}
export default Online
