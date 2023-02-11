import React, { useEffect } from 'react'
import {
  Card,
  ListGroup,
  ListGroupItem,
  InputGroup,
  Button,
} from 'react-bootstrap'
import BCI2KWatcher from '../lib/bciwatch'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  solid,
  regular,
  brands,
  icon,
} from '@fortawesome/fontawesome-svg-core/import.macro'
import {
  faGear,
  faCheck,
  faLocationDot,
  faPlay,
} from '@fortawesome/free-solid-svg-icons'
import Cookies from 'js-cookie';


export const getSourceAddress = async () => {
  let sourceAddress = Cookies.get('sourceAddress')
  if (sourceAddress === undefined) {
    try {
      let config = await fetch(`/api/config/online`);
      let data = await config.json();
      console.log(data);
      Cookies.set('sourceAddress', data.sourceAddress)
    }
    catch(err) {
      console.log(err)
    }
  }
}

export const setupWatcher = async (bciWatcher) => {
// Set up state change callback
// bciWatcher._bciConnection.onStateChange = bciStateChange
// bciOperator.onStateChange = currentState => {
//     let stateClasses = {
//       "Not Connected": "text-muted",
//       Idle: "text-info",
//       Suspended: "text-warning",
//       Running: "text-success"
//     };
try {
  // await bciWatcher.loadConfig(`/index/config/online`)
  let localSourceAddress = await getSourceAddress()
  // await bciWatcher.connect(localSourceAddress)
  // bciWatcher.start()
} catch (reason) {
  console.log('Could not set up BCI Watcher: ' + reason) // TODO Respond intelligently
}
}

// const clearTaskDetails = () => $('#subject-label').html('')

// $('#source-address-ok').on('click', function () {
//     // Get new value from form
//     var newSourceAddress = $('#source-address').val();
//     updateSourceAddress(newSourceAddress);
//     //
//     hideOnlineOptions();
// });

// $('.toggle-online-options').on('click', function () {
//     toggleOnlineOptions();
// });


// var updateSourceAddress = function (newSourceAddress) {
//   // Update cookie with new value
//   setSourceAddress(newSourceAddress)
//   // Reset our connection
//   bciWatcher.stop()
//   setupWatcher()
// }
// export const setupOnlineOptions = function () {
//   // Setup form values
//   getSourceAddress()
//     .then(function (sourceAddress) {
//       $('#source-address').val(sourceAddress)
//     })
//     .catch(function (reason) {
//       console.log('Could not get source address for display: ' + reason)
//     })
// }


// var getSubjectName = function () {
//   // bciWatcher.getParameter('SubjectName')
//   bciWatcher._bciConnection
//     .getSubjectName()
//     .then(function (subjectName) {
//       if (subjectName.length == 0) {
//         // Parameter not set

//         $('#subject-label').html('<small>(No SubjectName set.)</small>')

//         // TODO The fact that there's this awkward magic number
//         // use suggests that this is a bad way to do this ...
//         setTimeout(function () {
//           getSubjectName()
//         }, parameterRecheckDuration)

//         return
//       }

//       $('#subject-label').html(subjectName)
//     })
//     .catch(function (reason) {
//       console.log(reason) // TODO Handle
//     })
// }

// var getTaskName = function () {
//   // bciWatcher.getParameter('DataFile')
//   bciWatcher._bciConnection
//     .getTaskName()
//     .then(function (data) {
//       if (data.length == 0) {
//         // Parameter not set

//         $('#task-label').html('<small>(No DataFile set.)</small>')

//         // TODO The fact that there's this awkward magic number
//         // use suggests that this is a bad way to do this ...
//         setTimeout(function () {
//           getTaskName()
//         }, parameterRecheckDuration)

//         return
//       }

//       // TODO Is this format universal?
//       var dataPathParts = data.split(`/`)
//       var taskName = dataPathParts[1] // i.e., subject/task/...

//       $('#task-label').html(taskName)
//     })
//     .catch(function (reason) {
//       console.log(reason) // TODO Handle
//     })
// }

// var bciStateChange = function (newState) {
//   // Update state label text
//   $('#state-label').html('<strong>' + newState + '<strong>')

//   // Set correct state class
//   $.map(stateClasses, function (v, k) {
//     if (newState == k) {
//       $('#state-label').addClass(v)
//       return
//     }
//     $('#state-label').removeClass(v)
//   })

//   // Encourage mapping when appropriate
//   if (mapItStates.indexOf(newState) >= 0) {
//     $('#map-button').removeClass('disabled')
//   } else {
//     $('#map-button').addClass('disabled')
//   }

//   if (goLiveStates.indexOf(newState) >= 0) {
//     $('#live-button').removeClass('disabled')
//   } else {
//     $('#live-button').addClass('disabled')
//   }

//   // Attempt to get subject and task info if available
//   if (infoStates.indexOf(newState) >= 0) {
//     $('#info-label').removeClass('hidden')

//     getSubjectName()

//     getTaskName()
//   } else {
//     $('#info-label').addClass('hidden')

//     clearTaskDetails()
//   }
// }

// var showOnlineOptions = function () {
//   $('#online-options').removeClass('hidden')
// }
// var hideOnlineOptions = function () {
//   $('#online-options').addClass('hidden')
// }
// var toggleOnlineOptions = function () {
//   if ($('#online-options').hasClass('hidden')) {
//     showOnlineOptions()
//   } else {
//     hideOnlineOptions()
//   }
// }


var bciWatcher = new BCI2KWatcher()
export const Online = () => {
  useEffect(() => {
    setupWatcher(bciWatcher)

  },[])
  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title>
            Online
            {/* <FontAwesomeIcon icon={solid('user-secret')} /> */}
            <FontAwesomeIcon
              className="icon-exclamation-sign"
              icon={faGear}
              onClick={() => toggleOnlineOptions()}
            />
            ;
            {/* <span className="pull-right">
              <a className="toggle-online-options">
                <span className="glyphicon glyphicon-cog"></span>
              </a>
            </span> */}
          </Card.Title>
        </Card.Header>
        <Card.Header id="online-options" className="hidden">
          <InputGroup>
            <span className="input-group-addon" id="basic-addon1">
              Source
            </span>
            <input
              id="source-address"
              type="text"
              className="form-control"
              placeholder="Address"
            />
            <FontAwesomeIcon
              className="icon-exclamation-sign"
              icon={faCheck}
              onClick={() => setSourceAddress()}
            />
            ;
            {/* <span className="input-group-btn">
              <Button>
                <span className="glyphicon glyphicon-ok"></span>
              </Button>
            </span> */}
          </InputGroup>
        </Card.Header>
        <ListGroup>
          <ListGroupItem id="state-label" className="text-center text-muted">
            <strong>Not Connected</strong>
          </ListGroupItem>
          <ListGroupItem id="info-label" className="hidden">
            <span id="subject-label"></span>
            <br />
            <span id="task-label"></span>
          </ListGroupItem>
          <ListGroupItem
            id="map-button"
            className="list-group-item-info disabled"
            action
            href="/map/?view=WebFM: Map"
          >
            <FontAwesomeIcon icon={faLocationDot} onClick={() => goWeb()} />;
            {/* <span className="glyphicon glyphicon-map-marker"></span>{' '} */}
            <strong>Map it</strong>
          </ListGroupItem>
          <ListGroupItem
            id="live-button"
            className="list-group-item-success disabled"
            action
            href="/map?view=WebFM: Live"
          >
            <FontAwesomeIcon icon={faPlay} onClick={() => goLive()} />;
            {/* <span className="glyphicon glyphicon-facetime-video"></span>{' '} */}
            <strong>Go live</strong>
          </ListGroupItem>
        </ListGroup>
      </Card>
    </>
  )
}
export default Online
