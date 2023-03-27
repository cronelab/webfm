import React from 'react'
import {
  Card,
  ListGroup,
  ListGroupItem,
  Form,
  InputGroup,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowUp, faPencil } from '@fortawesome/free-solid-svg-icons'
import { useAppDispatch, useAppSelector } from '../../app/redux/hooks'

import './fileUpload.scss'
// $('#new-subject-ok').on('click', function () {
//     var newSubjectId = $('#new-subject-id').val();
//     addSubject(newSubjectId);
// });

// $('.toggle-new-subject').on('click', function () {
//     toggleNewSubject();
// });

// $('#upload-sensor-geometry-input').on('change', function () {

//     console.log('PUTTING GEOMETRY');

//     var files = $(this).get(0).files;

//     // TODO This will fail in certain obvious cases; should be caching a
//     // current subject state variable
//     var subject = window.location.hash.slice(1);

//     if (files.length > 0) {

//         var file = files[0];

//         // FormData carries the payload for our PUT request
//         var formData = new FormData();

//         // We only care about the first file
//         // TODO Get name from jquery element somehow?
//         formData.append('sensorGeometry', file, file.name);

//         // Make an AJAX request

//         $.ajax({
//             url: path.join(apiPath, 'geometry', subject),
//             method: 'PUT',
//             data: formData,
//             processData: false,
//             contentType: false
//         }).done(function (data, status, xhr) {

//             // Reload the newly uploaded brain
//             selectSubject(subject);

//         }).fail(function (xhr, status, err) {

//             // TODO GUI for error
//             console.log('Upload failed :( ' + JSON.stringify(err));
//         });
//     }
// });

// $('.upload-brain-image').on('click', function () {

//     // Trigger the file uploader element
//     $('#upload-brain-image-input').click();

//     // TODO GUI Changes

// });

// $('#upload-brain-image-input').on('change', function () {

//     var files = $(this).get(0).files;

//     // TODO This will fail in certain obvious cases; should be caching a
//     // current subject state variable
//     var subject = window.location.hash.slice(1);

//     if (files.length > 0) {

//         var file = files[0];

//         // FormData carries the payload for our PUT request
//         var formData = new FormData();

//         // We only care about the first file
//         // TODO Get name from jquery element somehow?
//         formData.append('brainImage', file, file.name);

//         // Make an AJAX request

//         $.ajax({
//             url: path.join(apiPath, 'brain', subject),
//             method: 'PUT',
//             data: formData,
//             processData: false,
//             contentType: false
//         }).done(function (data, status, xhr) {

//             // Reload the newly uploaded brain
//             selectSubject(subject);

//         }).fail(function (xhr, status, err) {

//             // TODO GUI for error
//             console.log('Upload failed :( ' + JSON.stringify(err));
//         });
//     }
// });

export const Metadata = ({}) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Metadata</Card.Title>
      </Card.Header>

      <ListGroup>
      <ListGroupItem>
        Sensor Geometry
          <span className="btn-file">
            <FontAwesomeIcon icon={faCloudArrowUp} />
            <input type="file" />
          </span>
          <span className="btn-file">
            <FontAwesomeIcon icon={faPencil} />
            <input type="file" />
          </span>
        </ListGroupItem>
        <ListGroupItem>
          Brain Image
          <span className="btn-file">
            <FontAwesomeIcon icon={faCloudArrowUp} />
            <input type="file" />
          </span>
        </ListGroupItem>
      </ListGroup>
    </Card>
  )
}
export default Metadata
// $('.upload-sensor-geometry').on('click', function () {
//     $('#upload-sensor-geometry-input').click();
// });
