//@ts-nocheck
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
  Tabs,
  Tab,
} from "react-bootstrap";
import { Context } from "../Context";
import Brain from "./Brain";
import CortstimCards from "./CortstimCards";
import { select } from "d3-selection";


/**
 * Return the ratio of the inline text length of the links in an element to
 * the inline text length of the entire element.
 *
 * @name CortstimV2
 * @returns {Element} Types and descriptions are both supported.
 */
const CortstimV2 = () => {
  const sleep = m => new Promise(r => setTimeout(r, m));
  let date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let year = date.getFullYear();
  const [electrodes, setElectrodes] = useState({
    elec1: "",
    elec2: ""
  });
  const { setNewRecord, setNewSubject, subject, cortstimNotes,taskTimes, setTaskTimes } = useContext(Context);


  const [taskButton, setTaskButton] = useState(false);

  const [brainType, setBrainType] = useState("2D");
  const [scene, setScene] = useState();

  const [current, setCurrent] = useState(5);
  const [duration, setDuration] = useState(5);
  const [freq, setFreq] = useState(50);

  let events = ["Pain", "Motor", "Sensory", "Seizure", "After_Discharge"];
  let languageTasks = [
    "Spontaneous_Speech",
    "Reading",
    "Naming",
    "Auditory_Naming",
    "Comprehension"
  ]
  const eventRef = useRef([]);
  events.forEach((event, i) => {
    eventRef.current[i] = React.createRef();
  });


  const taskRef = useRef([]);
  events.forEach((event, i) => {
    taskRef.current[i] = React.createRef();
  });


  return (
    <Container
      fluid
      style={{ paddingTop: "10px", height: "100%", overflow: "auto" }}
    >
      <Row>
        <Col sm={7} style={{ borderRight: "1rem solid" }}>
          <Row>
            <Col sm={3}>
              <Form>
                <Form.Group>
                  <Form.Control
                    onBlur={e => setNewSubject({ name: e.target.value })}
                    placeholder={`${subject.name}`}
                    className="text-center"
                  />
                  <Form.Text className="text-muted"> Patient ID</Form.Text>
                </Form.Group>
              </Form>
            </Col>
            <Col sm={2}>
              <Form>
                <Form.Group>
                  <Form.Control
                    onBlur={e => {
                      setElectrodes({ ...electrodes, elec1: e.target.value });
                      let elec1Circle = document.getElementById(
                        `${e.target.value}_circle`
                      );
                      elec1Circle.setAttribute("fill", "red");
                      elec1Circle.setAttribute("r", "3");
                      //@ts-ignore
                      document.getElementById("electrode2").value = "";
                      setNewRecord({ name: e.target.value });
                      //   setTaskButtons.forEach(taskButton => {
                      //     taskButton(true);
                      //   });

                    }}
                    className="text-center"
                  />
                  <Form.Text className="text-muted">Electrode 1</Form.Text>
                  {console.log('a')}
                </Form.Group>
              </Form>

            </Col>
            <Col sm={2}>
              <Form>
                <Form.Group>
                  <Form.Control
                    id="electrode2"
                    onBlur={e => {
                      setElectrodes({ ...electrodes, elec2: e.target.value });
                      let elec2Circle = document.getElementById(
                        `${e.target.value}_circle`
                      );
                      elec2Circle.setAttribute("fill", "red");
                      elec2Circle.setAttribute("r", "3");
                      e.persist();
                      setNewRecord(val => {
                        return { name: `${val.name}_${e.target.value}` };
                        // {val, {name:e.target.value}})
                      });
                      //   setTaskButtons.forEach(taskButton => {
                      //     taskButton(true);
                      //   });
                    }}
                  />
                  <Form.Text>Electrode 2</Form.Text>
                </Form.Group>
              </Form>
            </Col>
            {/* <Col sm={1}>
              <DropdownButton as={ButtonGroup} title="Results" id="bg-nested-dropdown_Results">
                <Dropdown.Item eventKey="1">3/23/2020</Dropdown.Item>
                <Dropdown.Item eventKey="2">3/24/2020</Dropdown.Item>
              </DropdownButton>

            </Col> */}

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
          <Row className="text-center">
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
                                      let times = {...taskTimes}
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
                                <InputGroup key={`${type}_inputGroup2a`}>
                                  <FormControl
                                    placeholder="Notes"
                                    aria-label="Notes"
                                    aria-describedby="basic-addon1" />
                                </InputGroup>
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
          </Row>
          <Button
            onClick={() => {
              console.log(taskTimes)
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

        <Col sm={5}>
          {/* <ButtonGroup>
            <DropdownButton as={ButtonGroup} title="Languge" id="bg-nested-dropdown_Langauge">
              <Dropdown.Item eventKey="1">SS</Dropdown.Item>
              <Dropdown.Item eventKey="2">R</Dropdown.Item>
              <Dropdown.Item eventKey="3">N</Dropdown.Item>
              <Dropdown.Item eventKey="4">AN</Dropdown.Item>
              <Dropdown.Item eventKey="5">C</Dropdown.Item>
            </DropdownButton>

            <DropdownButton as={ButtonGroup} title="Motor" id="bg-nested-dropdown_Motor">
              <Dropdown.Item eventKey="1">Face</Dropdown.Item>
              <Dropdown.Item eventKey="2">Hand</Dropdown.Item>
              <Dropdown.Item eventKey="3">Feet</Dropdown.Item>
            </DropdownButton>

            <DropdownButton as={ButtonGroup} title="Custom" id="bg-nested-dropdown_Custom">
              <Dropdown.Item eventKey="1">Task1</Dropdown.Item>
            </DropdownButton>


          </ButtonGroup>
          <ToggleButtonGroup type="checkbox" value={[1]} onChange={() => console.log('click')}>
            <ToggleButton value={1}>2D</ToggleButton>
            <ToggleButton value={2}>3D</ToggleButton>
          </ToggleButtonGroup> */}
          <Brain></Brain>
          {/* <Button onClick={()=> setBrainType("3D")}>3D Brain</Button> */}
          {/* <BrainChoice></BrainChoice> */}
        </Col>
      </Row>
    </Container >
  );
};

export default CortstimV2;
