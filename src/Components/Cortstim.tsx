import React, { useState, useContext, useRef, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  InputGroup,
  Form,
  FormControl,
  Table,
  Button,
  ToggleButton,
  Tabs,
  Tab,
  Dropdown,
  ButtonGroup,
  Modal
} from "react-bootstrap";
import { Context } from "../Context";
import Brain from "./Brain";
import CortstimCards from "./CortstimCards";
import { select } from "d3-selection";

const CortstimMenu = () => {
  const sleep = m => new Promise(r => setTimeout(r, m));
  let date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let year = date.getFullYear();
  const [electrodes, setElectrodes] = useState({
    elec1: "",
    elec2: ""
  });
  const { setNewRecord, setNewSubject, subject, cortstimNotes, taskTimes, setTaskTimes,
    subjects, setAllSubjects } = useContext(Context);

  const [show, setShow] = useState(false);
  const [modalOpts, setModalOpts] = useState({
    title: ''
  })
  const [radioValue, setRadioValue] = useState('1');

  const [current, setCurrent] = useState(5);
  const [duration, setDuration] = useState(5);
  const [freq, setFreq] = useState(50);


  const [events, setEvents] = useState([
    {
      name: "Spontaneous_Speech",
      performed: false,
      result: ''
    }, {
      name: "Reading",
      performed: false,
      result: ''
    }, {
      name: "Naming",
      performed: false,
      result: ''
    }, {
      name: "Auditory_Naming",
      performed: false,
      result: ''
    }, {
      name: "Comprehension",
      performed: false,
      result: ''
    }, {
      name: "Face",
      performed: false,
      result: ''
    }, {
      name: "Upper (hand)",
      performed: false,
      result: ''
    }, {
      name: "Lower (feet)",
      performed: false,
      result: ''
    }, {
      name: "Pain",
      performed: false,
      result: ''
    }, {
      name: "Motor",
      performed: false,
      result: ''
    }, {
      name: "Sensory",
      performed: false,
      result: ''
    },{
      name: "Seizure",
      performed: false,
      result: ''
    },{
      name: "After_Discharge",
      performed: false,
      result: ''
    },
  ])



  useEffect(() => {
    (async () => {
      let listPathRes = await fetch(`/api/list`);
      let foundSubjects = await listPathRes.json();
      if (foundSubjects.length > 0) {
        setAllSubjects(foundSubjects)
      } else {
        console.log("Nobody can be found");
      }
    })();
  }, []);

  return (

    <Container
      fluid
      style={{ paddingTop: "10px", height: "100%", overflow: "auto" }}
    >
      <Row>
        <Col sm={7} style={{ borderRight: "1rem solid" }}>
          <Row>
            <Col sm={3}>
              <Dropdown>
                <Dropdown.Toggle variant="primary" id="patient-dropdown">{subject.name ? subject.name : 'Patient ID'}</Dropdown.Toggle>
                <Dropdown.Menu>
                  {subjects ? subjects.map(subj => {
                    return (
                      <Dropdown.Item onClick={() => {
                        setNewSubject({ name: subj })
                        console.log(subject)
                      }

                      }>{subj}</Dropdown.Item>
                    )
                  }) : null}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col sm={2}>
              <Dropdown>
                <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                  {electrodes.elec1 ? electrodes.elec1 : 'Electrode 1'}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {subject.geometry ? Object.keys(subject.geometry).map(channel => {
                    return (
                      <Dropdown.Item
                        onClick={() => {
                          setElectrodes({ ...electrodes, elec1: channel })
                          let elec1Circle = document.getElementById(
                            `${channel}_circle`
                          );
                          elec1Circle.setAttribute("fill", "red");
                          elec1Circle.setAttribute("r", "3");

                        }}
                      >{channel}</Dropdown.Item>
                    )
                  }) : null}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col sm={2}>
              <Dropdown>
                <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                  {electrodes.elec2 ? electrodes.elec2 : 'Electrode 2'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {subject.geometry ? Object.keys(subject.geometry).map(channel => {
                    return (
                      <Dropdown.Item
                        onClick={() => {
                          setElectrodes({ ...electrodes, elec2: channel })
                          let elec2Circle = document.getElementById(
                            `${channel}_circle`
                          );
                          elec2Circle.setAttribute("fill", "red");
                          elec2Circle.setAttribute("r", "3");
                          // setNewRecord()
                        }}
                      >{channel}</Dropdown.Item>
                    )
                  }) : null}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
          <Row style={{ paddingTop: "5px" }}>
            <Col sm={2}>
              <Form>
                <Form.Group>
                  <Form.Control
                    onBlur={e => setCurrent(e.target.value)}
                    defaultValue={current}
                    className="text-center"
                  />
                  <Form.Text className="text-muted"> Current (mA)</Form.Text>
                </Form.Group>
              </Form>
            </Col>
            <Col sm={2}>
              <Form>
                <Form.Group>
                  <Form.Control
                    onBlur={e => setDuration(e.target.value)}
                    defaultValue={duration}
                    className="text-center"
                  />
                  <Form.Text className="text-muted">Duration (s) </Form.Text>
                </Form.Group>
              </Form>
            </Col>
            <Col sm={2}>
              <Form>
                <Form.Group>
                  <Form.Control
                    onBlur={e => setFreq(e.target.value)}
                    defaultValue={freq}
                    className="text-center"
                  />
                  <Form.Text className="text-muted"> Frequency (Hz) </Form.Text>
                </Form.Group>
              </Form>
            </Col>
          </Row>
          {/* <ButtonGroup vertical>
            {events.map((opts, index) => <Button
              variant={opts.performed ? "secondary" : "primary"}
              onClick={() => {
                setEvents((eventss => {'name': eventss[1].name, 'performed': eventss[1].performed, 'result': eventss[1].result})
                // setEvents([...events, {name:opts.name, performed:true, result:opts.result}])
                setModalOpts({ title: opts.name })
                setShow(true)
              }}
            >{opts.name}</Button>)}
          </ButtonGroup> */}

          <Modal show={show} onHide={() => setShow(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{modalOpts.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col>
                  <ButtonGroup toggle>
                    {[{ name: "Positive", value: '1' }, { name: "Negative", value: '2' }].map((radio, index) => (
                      <ToggleButton
                        key={index}
                        type="radio"
                        variant="secondary"
                        name="radio"
                        value={radio.value}
                        checked={radioValue === radio.value}
                        onChange={(e) => setRadioValue(e.currentTarget.value)}
                      >
                        {radio.name}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>


                </Col>
                <Col>
                  <InputGroup key={`${modalOpts.title}_inputGroup2a`}>
                    <FormControl
                      placeholder="Notes"
                      aria-label="Notes"
                      aria-describedby="basic-addon1" />
                  </InputGroup>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShow(false)}>
                Close
            </Button>
              <Button variant="primary" onClick={() => setShow(false)}>
                Save Changes
            </Button>
            </Modal.Footer>
          </Modal>

          {/* <Row className="text-center">
            <Col>
              <Card style={{ marginTop: "10px" }}>
                <Card.Body>
                  <Tabs
                    style={{ marginTop: "10px" }}
                    defaultActiveKey="Language"
                    id="uncontrolled-tab-example"
                  >
                    <Tab
                      style={{ marginTop: "10px" }}
                      eventKey="Language"
                      title="Language"
                    >
                      <CortstimCards
                        tasks={languageTasks}
                        electrodes={electrodes}
                        refs={taskRef}
                      ></CortstimCards>
                    </Tab>
                    <Tab
                      style={{ marginTop: "10px" }}
                      eventKey="Motor"
                      title="Motor"
                    >
                      <CortstimCards
                        tasks={["Face", "Upper (hand)", "Lower (feet)"]}
                        electrodes={electrodes}
                        refs={taskRef}
                      ></CortstimCards>
                    </Tab>
                    <Tab
                      style={{ marginTop: "10px" }}
                      eventKey="Custom"
                      title="Custom"
                    >
                      <CortstimCards
                        tasks={["Custom"]}
                        electrodes={electrodes}
                        refs={taskRef}
                      ></CortstimCards>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card style={{ marginTop: "10px" }}>
                <Card.Body>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <>
                        {events.map((type, index) => {
                          let color = "gray";
                          switch (type) {
                            case "Pain":
                              color = "yellow";
                              break;
                            case "Motor":
                              color = "red";
                              break;
                            case "Sensory":
                              color = "blue";
                              break;
                            case "Seizure":
                              color = "aqua";
                              break;
                            case "After_Discharge":
                              color = "aqua";
                              break;
                            default:
                              color = "gray";
                          }
                          return (
                            <tr>
                              <td
                                key="eventButton"
                              >
                                <Button
                                  id={`${type}_eventButton`}
                                  key={type}
                                  style={{
                                    width: "100%",
                                    background: "gray",
                                    color: "white"
                                  }}
                                  ref={eventRef.current[index]}
                                  onClick={async () => {
                                    let hour = date.getHours();
                                    let minutes = date.getMinutes();
                                    let seconds = date.getSeconds();
                                    console.log(eventRef.current[index]);
                                    let curColor =
                                      eventRef.current[index].current.style
                                        .background;

                                    //@ts-ignore
                                    eventRef.current[
                                      index
                                    ].current.style.background =
                                      curColor == "gray" ? color : "gray";
                                    eventRef.current[
                                      index
                                    ].current.style.color =
                                      curColor == "gray" ? "black" : "white";
                                    await sleep(500);

                                    let circle1 = document.getElementById(
                                      `${electrodes.elec1}_circle`
                                    );
                                    let circle2 = document.getElementById(
                                      `${electrodes.elec2}_circle`
                                    );

                                    let xPos1 = parseFloat(
                                      circle1.getAttribute("cx")
                                    );
                                    let xPos2 = parseFloat(
                                      circle2.getAttribute("cx")
                                    );
                                    let yPos1 = parseFloat(
                                      circle1.getAttribute("cy")
                                    );
                                    let yPos2 = parseFloat(
                                      circle2.getAttribute("cy")
                                    );
                                    select("#imgContainer")
                                      .select("svg")
                                      .append("line")
                                      .attr("x1", xPos1)
                                      .attr("y1", yPos1)
                                      .attr("x2", xPos2)
                                      .attr("y2", yPos2)
                                      .attr("stroke-width", "5")
                                      .attr("stroke", color);
                                    let times = { ...taskTimes }
                                    times[type] = `${hour}:${minutes}:${seconds}`


                                    setTaskTimes(times)
                                    alert(
                                      `${type} @ ${hour}:${minutes}:${seconds}`
                                    );
                                    await sleep(500);

                                    //@ts-ignore
                                    eventRef.current[
                                      index
                                    ].current.style.background =
                                      curColor == "gray" ? "gray" : color;
                                    eventRef.current[
                                      index
                                    ].current.style.color =
                                      curColor == "gray" ? "white" : "black";
                                  }}
                                >
                                  {type}
                                </Button>
                              </td>
                              <td>

                              </td>
                            </tr>
                          );
                        })}
                      </>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}
          <Button
            onClick={() => {
              let dataToSend = {
                patientID: subject.name,
                date: `${month}/${day}/${year}`,
                electrodes: `${electrodes.elec1}_${electrodes.elec2}`,
                current,
                duration,
                frequency: freq,
                taskData: {
                  Spontaneous_Speech: {
                    Notes: cortstimNotes.Spontaneous_Speech,
                    color: document.getElementById("Spontaneous_Speech_button").style.background,
                    time: taskTimes.Spontaneous_Speech
                  },
                  Reading: {
                    Notes: cortstimNotes.Reading,
                    color: document.getElementById("Reading_button").style.background,
                    time: taskTimes.Reading

                  },
                  Naming: {
                    Notes: cortstimNotes.Naming || "",
                    color: document.getElementById("Naming_button").style.background,
                    time: taskTimes.Naming

                  },
                  Auditory_Naming: {
                    Notes: cortstimNotes.Auditory_Naming || "",
                    color: document.getElementById("Auditory_Naming_button").style.background,
                    time: taskTimes.Auditory_Naming

                  },
                  Comprehension: {
                    Notes: cortstimNotes.Comprehension,
                    color: document.getElementById("Comprehension_button").style.background,
                    time: taskTimes.Comprehension
                  }
                },
                eventData: {
                  Pain: {
                    Notes: cortstimNotes.Pain,
                    time: taskTimes.Pain
                  },
                  Motor: {
                    Notes: cortstimNotes.Motor,
                    time: taskTimes.Motor
                  },
                  Sensory: {
                    Notes: cortstimNotes.Sensory,
                    time: taskTimes.Sensory
                  },
                  Seizure: {
                    Notes: cortstimNotes.Seizure,
                    time: taskTimes.Seizure
                  },
                  After_Discharge: {
                    Notes: cortstimNotes.After_Discharge,
                    time: taskTimes.After_Discharge
                  }
                }
              };
              fetch(`/api/data/cortstim/${subject.name}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSend)
              })
              // .then(response => response.json())
              // .then(() => {
              //   console.log("Success");
              // })
              // .catch(error => {
              //   console.error("Error:", error);
              // });
            }}
          >
            Save
          </Button>
        </Col>

        <Col sm={5}
          style={{ "padding": "0" }}
        >
          {subject.name ? <Brain></Brain> : <div></div>}
        </Col>
      </Row>
    </Container >
  );
};

export default CortstimMenu;
