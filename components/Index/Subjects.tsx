  import { useAppDispatch, useAppSelector } from '../../app/redux/hooks';
  import { setCurrentSubject } from '../../app/redux/subjects';


// var showNewSubject = function () {
//   $('#new-subject-options').removeClass('hidden')
// }
// var hideNewSubject = function () {
//   $('#new-subject-options').addClass('hidden')
// }
// var toggleNewSubject = function () {
//   if ($('#new-subject-options').hasClass('hidden')) {
//     showNewSubject()
//   } else {
//     hideNewSubject()
//   }
// }


// var addSubject = function (subjectId) {
//   // Make call
//   $.ajax({
//     url: `/api/data/${subjectId}`,
//     method: 'PUT',
//   })
//     .done(function (data, status, xhr) {
//       console.log(status)
//       console.log(data)
//     })
//     .fail(function (xhr, status, err) {
//       console.log(status)
//       console.log(xhr.responseText)
//     })
// }


const loadRecords = async (subject) => {
  let req = await fetch(`/api/records/${subject}`)
  let records = await req.json()
  return records;
}


export const Subject = ({ subjects, setSubjectRecords, setBrainImage, setSubject }) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>
          Subjects
          {/* <span className="pull-right">
              <a className="toggle-new-subject">
                <span className="glyphicon glyphicon-plus"></span>
              </a>
            </span> */}
        </Card.Title>
      </Card.Header>
      {/* <Card.Header id="new-subject-options" className="hidden">
          <InputGroup>
            <span className="input-group-addon" id="basic-addon1">
              ID
            </span>
            <input
              id="new-subject-id"
              type="text"
              className="form-control"
              placeholder="PYXXNXXX"
            />
            <span className="input-group-btn">
              <Button id="new-subject-ok">
                <span className="glyphicon glyphicon-ok"></span>
              </Button>
            </span>
          </InputGroup>
        </Card.Header> */}
      <ListGroup id="subject-list">
        {subjects.map((subject: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal, idx: React.Key) => (
          <ListGroup.Item
            onClick={async () => {
                let req = await fetch(`/api/brains/${subject}`);
                setBrainImage (await req.json());
                setSubject(subject);
                setSubjectRecords( await loadRecords(subject))}
            }
            key={idx}
          >
        {/* //    action href={`/subject/${subject}`}> */}
            {subject}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  )
}

export default Subject;