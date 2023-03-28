import React from 'react'
import { Card, ListGroup, ListGroupItem } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowUp, faPencil } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../app/redux/hooks'

import './fileUpload.scss'

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
      console.log(res);
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
    <Card>
      <Card.Header>
        <Card.Title>Metadata</Card.Title>
      </Card.Header>

      <ListGroup>
        <ListGroupItem style={{ display: 'flex' }}>
          <p>Sensor Geometry</p>
          <span className="btn-file" style={{ margin: '0px 10px 0px 10px' }}>
            <FontAwesomeIcon icon={faCloudArrowUp} />
            <input type="file" onChange={e => uploadMetadata(e, 'geometry')} />
          </span>
          <FontAwesomeIcon icon={faPencil} />
        </ListGroupItem>
        <ListGroupItem>
          Brain Image
          <span className="btn-file" style={{ margin: '0px 10px 0px 10px' }}>
            <FontAwesomeIcon icon={faCloudArrowUp} />
            <input type="file" onChange={e => uploadMetadata(e, 'brain')} />
          </span>
        </ListGroupItem>
      </ListGroup>
    </Card>
  )
}
export default Metadata
