import {
  Navbar,
  Container,
  Nav,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlay,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faVolumeLow,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons'

import styles from './styles.module.scss'

export default function RecordingHeader() {
  return (
    <>
      {/* <Nav className="navbar navbar-inverse navbar-fixed-top">
        <div className="container-fluid">
          <div className="collapse navbar-collapse">
            <a className="navbar-brand"><span className="fm-task-name">[task]</span></a>
            <a className="navbar-brand">
              <span className="fm-subject-name">[subject]</span> -
              <span className="fm-task-name">[task]</span>
            </a>

            <ul className="Nav navbar-Nav">
              <li>
                <a className="fm-back glyphicon-button" href="/">
                  <span className="glyphicon glyphicon-menu-left"></span>
                </a>
              </li>
            </ul>

            <ul className="Nav navbar-Nav navbar-right">
              <li className="fm-working-icon">
                <a className="glyphicon-button" href="#">
                  <span className="glyphicon glyphicon-hourglass"></span>
                </a>
              </li>
              <li className="fm-transfer-icon">
                <a className="glyphicon-button" href="#">
                  <span className="glyphicon glyphicon-transfer"></span>
                </a>
              </li>
              <li className="fm-toggle-fullscreen">
                <a className="glyphicon-button" href="#">
                  <span className="glyphicon glyphicon-fullscreen"></span>
                </a>
              </li>
              <li className="">
                <a className="glyphicon-button" href="/map?view=WebFM: Live">
                  <span className="glyphicon glyphicon-facetime-video"></span>
                </a>
              </li>
              <li className="">
                <a className="glyphicon-button" href="/map?view=WebFM: Map">
                  <span className="glyphicon glyphicon-map-marker"></span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Nav> */}
      <Navbar className={styles.recordingHeader}>
        <Container fluid>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className={styles.controls}>
              <p className={styles.timeLabel}>0.000 s</p>
              <FontAwesomeIcon icon={faPlay} id="play-button" />
              <FontAwesomeIcon
                icon={faMagnifyingGlassPlus}
                className="fm-zoom-in"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlassMinus}
                className="fm-zoom-out"
              />
              <FontAwesomeIcon icon={faVolumeHigh} className="fm-gain-up" />
              <FontAwesomeIcon icon={faVolumeLow} className="fm-gain-down" />
              {/* <ListGroup.Item className="fm-stim-select">
                  <a className="glyphicon-button" href="#">
                    <span className="glyphicon glyphicon-book"></span>
                  </a>
                </ListGroup.Item>
                <ListGroup.Item id="outputVals">
                  {/* <button onclick="saveValues()">saveValues</button> */}
              {/* </ListGroup.Item> */}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}

{
  /* <ul className="Nav navbar-Nav navbar-right">
      <li className="dropdown fm-dataset-list">
        <a href="#" id="currentStimCode" className="stim-display">
          Stimulus:
        </a>
      </li>
      <li className="dropdown fm-dataset-list">
        <a
          href="#"
          className="dropdown-toggle"
          data-toggle="dropdown"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Charts <span className="caret"></span>
        </a>
        <ul id="graphViews" className="dropdown-menu">
          <li>
            <a href="#" id="rasterView">
              Raster
            </a>
          </li>
          <li>
            <a href="#" id="chartView">
              Chart
            </a>
          </li>
        </ul>
      </li>
      <li className="dropdown fm-dataset-list">
        <a
          href="#"
          className="dropdown-toggle"
          data-toggle="dropdown"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Data type <span className="caret"></span>
        </a>
        <ul id="dataType" className="dropdown-menu">
          <li>
            <a href="#" id="bandDropdown">
              High gamma (70–110 Hz){' '}
            </a>
          </li>
          <li>
            <a href="#" id="CCEPS">
              CCEPS_LIH11_LIH12_5ma
            </a>
          </li>
        </ul>
      </li>
      <li className="dropdown fm-dataset-list">
        <a
          href="#"
          className="dropdown-toggle"
          data-toggle="dropdown"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Channel selector <span className="caret"></span>
        </a>
        <ul id="chanSel" className="dropdown-menu"></ul>
      </li>

      <li className="dropdown fm-dataset-list">
        <a
          href="#"
          id="stimDropdown"
          className="dropdown-toggle"
          data-toggle="dropdown"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Stimulus selection <span className="caret"></span>
        </a>
        <ul id="stimSel" className="dropdown-menu">
        </ul>
      </li>

      <li className="dropdown fm-dataset-list">
        <a
          href="#"
          className="dropdown-toggle"
          data-toggle="dropdown"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
        >
          Perspective <span className="caret"></span>
        </a>
        <ul id="twoVsThree" className="dropdown-menu">
          <li>
            <a href="#" id="twoDDrop">
              2D
            </a>
          </li>
          <li>
            <a href="#" id="threeDDrop">
              3D
            </a>
          </li>
        </ul>
      </li>
      <li className="fm-show-options">
        <a className="glyphicon-button" href="#">
          <span className="glyphicon glyphicon-cog"></span>
        </a>
      </li>
    </ul> */
}
