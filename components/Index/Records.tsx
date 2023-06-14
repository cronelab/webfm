import React from 'react'
import { Card, ListGroup, ListGroupItem } from 'react-bootstrap'
import Link from 'next/link'
import { useAppSelector } from '../../app/redux/hooks'
import { useGetRecordsQuery } from '../../app/redux/api'

export const Records = () => {
  const currentSubject = useAppSelector(state => state.subjects.currentSubject)
  const { data: records, error, isLoading } = useGetRecordsQuery(currentSubject)
  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title>Records</Card.Title>
        </Card.Header>

        <ListGroup>
          {records &&
            records.map((record, idx) => {
              let ext = record.split('.').pop()
              let cleanRecord = record.split(`.${ext}`)[0]
              console.log(currentSubject)
              let route = decodeURIComponent(
                `?view=WebFM: Map/${currentSubject}/${cleanRecord}`
              )
              return (
                <>
                  <ListGroupItem key={`${idx}_old`}>
                    <Link
                      href={`/map/${route}`}
                      style={{ textDecoration: 'none', color: 'black' }}
                    >
                      {cleanRecord} Old
                    </Link>
                  </ListGroupItem>
                  <ListGroupItem key={`${idx}_old`}>
                    <Link
                      href={`/recorded`}
                      style={{ textDecoration: 'none', color: 'black' }}
                    >
                      {cleanRecord} New
                    </Link>
                  </ListGroupItem>
                </>
              )
            })}
        </ListGroup>
      </Card>
    </>
  )
}
export default Records
