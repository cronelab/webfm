import React, { useState } from 'react'
import { Card, ListGroup, Form } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import { useAppDispatch, useAppSelector } from '../../app/redux/hooks'
import { setCurrentSubject } from '../../app/redux/subjects'
import { useGetAllSubjectsQuery } from '../../app/redux/api'

export const Subject = () => {
  const [addSubject, setAddSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')

  const dispatch = useAppDispatch()

  const subject = useAppSelector(state => state.subjects.currentSubject)
  const { data: subjects, error, isLoading } = useGetAllSubjectsQuery()

  return (
    <Card>
      <Card.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Card.Title>Subjects</Card.Title>
        <FontAwesomeIcon
          icon={addSubject ? faMinus : faPlus}
          onClick={() => {
            setAddSubject(s => !s)
          }}
        />
      </Card.Header>
      {addSubject && (
        <Card.Header style={{ display: 'flex', alignItems: 'baseline' }}>
          <Card.Text>ID: </Card.Text>
          <Form.Control
            value={newSubjectName}
            placeholder="PYXXNXXX"
            onChange={e => setNewSubjectName(e.target.value)}
          ></Form.Control>
          <FontAwesomeIcon
            icon={faCheck}
            onClick={async () => {
              try {
                await fetch(`/api/data/${newSubjectName}`, {
                  method: 'PUT',
                })
                window.location.reload()
              } catch (err) {
                alert('Failed to add new subject.')
              }
            }}
          />
        </Card.Header>
      )}

      <ListGroup>
        {subjects &&
          subjects.map((subject, idx) => (
            <ListGroup.Item
              onClick={async () => {
                try {
                  // useGetSubjectBrainQuery(subject)
                  // let req = await fetch(`/api/brains/${subject}`)
                  // setSubject(subject)
                  dispatch(setCurrentSubject(subject))
                  // if (req.status === 200) {
                  //   setBrainImage(await req.json())
                  //   setSubjectRecords(await loadRecords(subject))
                  // } else {
                  //   alert('No brain image available for this subject.')
                  //   setBrainImage('')
                  //   setSubjectRecords([])
                  // }
                } catch (err) {
                  console.log(err)
                }
              }}
              key={idx}
            >
              {subject}
            </ListGroup.Item>
          ))}
      </ListGroup>
    </Card>
  )
}

export default Subject
