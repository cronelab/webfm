import React, { useState, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  InputGroup,
  Form,
  FormControl,
  Table,
  Button
} from "react-bootstrap";
import { Context } from "../Context";
import Brain from "./Brain";
import { select } from "d3-selection";

const CortstimMenu = () => {
  const sleep = m => new Promise(r => setTimeout(r, m));

  let date = new Date();
  let month = date.getMonth();
  let day = date.getDate();
  let year = date.getFullYear();
  const [electrodes, setElectrodes] = useState({
    elec1: "",
    elec2: ""
  });
  const { setNewRecord, setNewSubject, subject } = useContext(Context);
  const [SpontaneousSpeech_Button, setSpontaneousSpeech_Button] = useState(
    true
  );
  const [Reading_Button, setReading_Button] = useState(true);
  const [Naming_Button, setNaming_Button] = useState(true);
  const [AuditoryNaming_Button, setAuditoryNaming_Button] = useState(true);
  const [Comprehension_Button, setComprehension_Button] = useState(true);
  const [Pain_Button, setPain_Button] = useState(true);
  const [Motor_Button, setMotor_Button] = useState(true);
  const [Sensory_Button, setSensory_Button] = useState(true);
  const [Seizure_Button, setSeizure_Button] = useState(true);
  const [AfterDischarge_Button, setAfterDischarge_Button] = useState(true);
  let taskButtons = [
    SpontaneousSpeech_Button,
    Reading_Button,
    Naming_Button,
    AuditoryNaming_Button,
    Comprehension_Button,
    Pain_Button,
    Motor_Button,
    Sensory_Button,
    Seizure_Button,
    AfterDischarge_Button
  ];
  let setTaskButtons = [
    setSpontaneousSpeech_Button,
    setReading_Button,
    setNaming_Button,
    setAuditoryNaming_Button,
    setComprehension_Button,
    setPain_Button,
    setMotor_Button,
    setSensory_Button,
    setSeizure_Button,
    setAfterDischarge_Button
  ];

  const [current, setCurrent] = useState(5);
  const [duration, setDuration] = useState(5);
  const [freq, setFreq] = useState(50);

  return (
    <Container
      fluid
      style={{ paddingTop: "10px", height: "100%", overflow: "auto" }}
    >
      <Row>
        <Col sm={6} style={{ borderRight: "1rem solid" }}>
          <Row>
            <Col sm={3}>
              <Form>
                <Form.Group>
                  <Form.Control
                    onBlur={e => setNewSubject({ name: e.target.value })}
                    placeholder="PY"
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
                      setTaskButtons.forEach(taskButton => {
                        taskButton(true);
                      });
                    }}
                    className="text-center"
                  />
                  <Form.Text className="text-muted">Electrode 1</Form.Text>
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
                      setTaskButtons.forEach(taskButton => {
                        taskButton(true);
                      });
                    }}
                  />
                  <Form.Text>Electrode 2</Form.Text>
                </Form.Group>
              </Form>
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
          <Row className="text-center">
            <Col>
              <Card style={{ marginTop: "10px" }}>
                <Card.Body>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Positive</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <>
                        {[
                          "Spontaneous Speech",
                          "Reading",
                          "Naming",
                          "Auditory Naming",
                          "Comprehension"
                        ].map((type, index) => {
                          let buttonColor = taskButtons[index]
                            ? "gray"
                            : "green";
                          return (
                            <tr>
                              <td>
                                <Button
                                  id={`${type}_button`}
                                  key={type}
                                  //   variant={
                                  //     taskButtons[index] ? "secondary" : "success"
                                  //   }
                                  style={{
                                    width: "100%",
                                    background: buttonColor
                                  }}
                                  onClick={() => {
                                    setTaskButtons[index](!taskButtons[index]);
                                  }}
                                >
                                  {type}
                                </Button>
                              </td>
                              <td>
                                <InputGroup key={`${type}_inputGroup`}>
                                  <InputGroup.Prepend
                                    style={{ margin: "auto" }}
                                  >
                                    <InputGroup.Checkbox
                                      onClick={() => {
                                        let parentButton = document.getElementById(
                                          `${type}_button`
                                        );
                                        if (
                                          parentButton.style.background ==
                                          "green"
                                        ) {
                                          parentButton.style.background =
                                            "purple";

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
                                            .attr("stroke", "purple");
                                        } else if (parentButton.style.background == "purple"){
											parentButton.style.background="green";
                                        }
                                      }}
                                    />
                                  </InputGroup.Prepend>
                                </InputGroup>
                              </td>
                              <td>
                                <InputGroup key={`${type}_inputGroup2`}>
                                  <FormControl placeholder="Notes" />
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
                        {[
                          "Pain",
                          "Motor",
                          "Sensory",
                          "Seizure",
                          "After Discharge"
                        ].map((type, index) => {
                          let color;
                          switch (type) {
                            case "Pain":
                              color = "warning";
                              break;
                            case "Motor":
                              color = "danger";
                              break;
                            case "Sensory":
                              color = "primary";
                              break;
                            case "Seizure":
                              color = "info";
                              break;
                            case "After Discharge":
                              color = "info";
                              break;
                            default:
                              color = "secondary";
                          }
                          return (
                            <tr>
                              <td>
                                <Button
                                  id={`${type}_eventButton`}
                                  key={type}
                                  variant={
                                    taskButtons[index + 5] ? "secondary" : color
                                  }
                                  style={{ width: "100%" }}
                                  onClick={async () => {
                                    let hour = date.getHours();
                                    let minutes = date.getMinutes();
                                    let seconds = date.getSeconds();
                                    setTaskButtons[index + 5](
                                      !taskButtons[index + 5]
                                    );
                                    await sleep(1000);
                                    // console.log("ASD");
                                    alert(
                                      `${type} @ ${hour}:${minutes}:${seconds}`
                                    );
                                    var b1 = document.getElementById(
                                      `${type}_eventButton`
                                    );
                                    b1.classList.forEach(btnClass => {
                                      if (btnClass.substring(0, 4) == "btn-") {
                                        b1.classList.replace(
                                          btnClass,
                                          "btn-secondary"
                                        );
                                      }
                                    });
                                    // console.log(b1.classList)
                                    setTaskButtons[index + 5](
                                      !taskButtons[index + 5]
                                    );
                                  }}
                                >
                                  {type}
                                </Button>
                              </td>
                              <td>
                                <InputGroup key={`${type}_inputGroup2a`}>
                                  <FormControl placeholder="Notes" />
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
              let dataToSend = {
                patientID: subject.name,
                date: `${month}/${day}/${year}`,
                electrodes,
                current,
                duration,
                frequency: freq,
                map: "future brain image",
                taskData: {
                  SpontaneousSpeech: SpontaneousSpeech_Button,
                  Reading: Reading_Button,
                  Naming: Naming_Button,
                  AuditoryNaming: AuditoryNaming_Button,
                  Comprehension: Comprehension_Button
                },
                eventData: {
                  Pain: Pain_Button,
                  Motor: Motor_Button,
                  Sensory: Sensory_Button,
                  Seizure: Sensory_Button,
                  AfterDischarge: AfterDischarge_Button
                }
              };
              fetch(`/api/data/cortstim/${subject.name}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSend)
              })
                .then(response => response.json())
                .then(() => {
                  console.log("Success");
                })
                .catch(error => {
                  console.error("Error:", error);
                });
            }}
          >
            Save
          </Button>
        </Col>

        <Col sm={6}>
          <Brain></Brain>
        </Col>
      </Row>
    </Container>
  );
};

export default CortstimMenu;
