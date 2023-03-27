import React from 'react'
import { Card, ListGroup, ListGroupItem } from 'react-bootstrap'
import { useAppSelector } from '../../app/redux/hooks'

export const Records = ({ records, subject }) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Records</Card.Title>
      </Card.Header>

      <ListGroup id="record-list">
        {records.map((record, idx) => {
          let route = decodeURIComponent(`?view=WebFM: Map/${subject}/${record.split('.fm')[0]}`)

          return (
          <ListGroupItem
            key={idx}
            >
              <Link
                href={`/map/${route}`}>{record}</Link>
            {/* href="/map/?view=WebFM: %20Map/CC01/2022_09_01_Gestures_block1" */}
            {/* {record} */}
          </ListGroupItem>
        )})}
      </ListGroup>
    </Card>
  )
}
export default Records
