import React from 'react'
import { Card, Form, ListGroup, ListGroupItem } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowUp, faPencil } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../app/redux/hooks'

import styles from './Index.module.scss'

export const Metadata = ({}) => {
  const currentSubject = useAppSelector(state => state.subjects.currentSubject)

  const uploadMetadata = async (e, type) => {
    const file = e.target.files[0]
    const formData = new FormData()
    if (type === 'brain') {
      formData.append('brainImage', file, file.name)
      let req = await fetch(`/api/brains/${currentSubject}`, {
        method: 'PUT',
        body: formData,
      })
      let res = await req.json()
    }
    if (type === 'geometry') {
      formData.append('sensorGeometry', file, file.name)
      let req = await fetch(`/api/geometry/${currentSubject}`, {
        method: 'PUT',
        body: formData,
      })
    }
  }

  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title>Metadata</Card.Title>
        </Card.Header>
        <ListGroup style={{ display: 'flex' }}>
          <ListGroupItem className={styles.fileButton}>
            Sensor
            <div className={styles.geoIcons}>
              <Form.Label htmlFor="geoInput">
                <FontAwesomeIcon icon={faCloudArrowUp} />
              </Form.Label>
              <Form.Control
                id="geoInput"
                type="file"
                style={{ display: 'none' }}
                required
                name="file"
                onChange={e => uploadMetadata(e, 'geometry')}
              />
              <FontAwesomeIcon icon={faPencil} />
            </div>
          </ListGroupItem>
          <ListGroupItem className={styles.fileButton}>
            Brain Image
            <Form.Label htmlFor="brainInput">
              <FontAwesomeIcon icon={faCloudArrowUp} />
            </Form.Label>
            <Form.Control
              id="brainInput"
              type="file"
              style={{ display: 'none' }}
              required
              name="file"
              onChange={e => uploadMetadata(e, 'brain')}
            />
          </ListGroupItem>
        </ListGroup>
      </Card>
    </>
  )
}
export default Metadata
