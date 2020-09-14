import React, { useState, useContext, useRef, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  InputGroup,
  Form,
  FormControl,
  Button,
  ToggleButton,
  Dropdown,
  ButtonGroup,
  Modal,
  Card,
  Image,
  ListGroup,
  ListGroupItem,
} from "react-bootstrap";
import { Context } from "../Context";
import Brain from "./Brain";
import { select, mouse } from "d3-selection";
import homonculus from '../assets/homunculus.jpg';
import {
  highlightElectrodes,
  createLine,
  removeAllAttributes,
  createShape,
} from "./Cortstim/ElectrodeAttributes";

const CortstimMenu = () => {
  let date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let year = date.getFullYear();
  const [electrodes, setElectrodes] = useState({
    elec1: null,
    elec2: null,
  });
  const {
    setNewSubject,
    subject,
    subjects,
    setAllSubjects,
    imgLoaded,
  } = useContext(Context);

  const [dataPulled, setDataPulled] = useState(false);
  const [show, setShow] = useState(false);
  const [modalOpts, setModalOpts] = useState({
    title: "",
    type: "",
  });
  let textOver = document.createElement("div");
  textOver.innerHTML = "";

  // let line = select("#container")
  // .select("svg")
  // .append("line")
  // .attr("x1", xPos1)
  // .attr("y1", yPos1)
  // .attr("x2", xPos2)
  // .attr("y2", yPos2)
  // .attr("stroke-width", "5")
  // .attr("stroke", "#0BE9F9")
  // .on("mouseover", function (d, i) {
  //   allTasks?.forEach((task) => {
  //     if (task.performed == true) {
  //       textOver.innerText += `${task.name}: ${task.result} \n`;
  //     }
  //   });
  //   textOver.style.left = mouse(this)[0] + 10 + "px";
  //   textOver.style.top = mouse(this)[1] + 10 + "px";
  //   textOver.style.backgroundColor = "white";
  //   select(this).attr("stroke", "#E1F90B");
  // })
  // .on("mouseout", function (d, i) {
  //   textOver.innerText = "";
  //   textOver.style.left = `${0}px`;
  //   textOver.style.top = `${0}px`;
  //   select(this).attr("stroke", "#0BE9F9");
  // });
  // const [current, setCurrent] = useState(5);
  // const [duration, setDuration] = useState(5);
  // const [freq, setFreq] = useState(50);

  const [params, setParams] = useState({
    current: 5,
    duration: 5,
    frequency: 50,
  });

  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [typeOfStim, setTypeOfStim] = useState("Task or no task");
  const [typeOfTask, setTypeOfTask] = useState("Task description");
  const [typeOfEffect, setTypeOfEffect] = useState("Effect");
  const [tasks, setTasks] = useState([
    "Spontaneous Speech",
    "Sentence Reading",
    "Naming",
    "Auditory Naming",
    "Comprehension (Token)",
    "Motor task",
    "Other",
  ]);

  const [results, setResults] = useState([
    "Pain",
    "Motor",
    "Sensory",
    "Language",
    "Clear",
    "Seizure",
    "After Discharge",
    "Experiential",
    "Other",
  ]);

  const [allElectrodes, setAllElectrodes] = useState([]);

  // Fetch subjects
  useEffect(() => {
    (async () => {
      let listPathRes = await fetch(`/api/list`);
      let foundSubjects = await listPathRes.json();
      if (foundSubjects.length > 0) {
        setAllSubjects(foundSubjects);
      } else {
        console.log("Nobody can be found");
      }
    })();
  }, []);

  // Select second Electrode
  const Elec2Dropdown = () => {
    return (
      <Dropdown.Menu>
        {electrodes.elec1
          ? Object.keys(subject.geometry)
              .filter((channel) => {
                let searchString = /\d+/g;
                let elec1ChanGroup = electrodes.elec1.substring(
                  0,
                  electrodes.elec1.indexOf(
                    electrodes.elec1.match(searchString)[0]
                  )
                );
                let elec2ChanGroup = channel.substring(
                  0,
                  channel.indexOf(channel.match(searchString)[0])
                );
                if (elec1ChanGroup == elec2ChanGroup) {
                  return channel;
                }
              })
              .map((channel) => {
                return (
                  <Dropdown.Item
                    key={`${channel}_button2`}
                    onClick={() => {
                      setElectrodes({ ...electrodes, elec2: channel });
                      let elec2Circle = document.getElementById(
                        `${channel}_circle`
                      );
                      elec2Circle.setAttribute("fill", "red");
                      elec2Circle.setAttribute("r", "4");
                    }}
                  >
                    {channel}
                  </Dropdown.Item>
                );
              })
          : null}
      </Dropdown.Menu>
    );
  };

  const ElectrodeSelection = () => {
    return (
      <>
        <Col sm={2} style={{ paddingRight: "50px" }}>
          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              {electrodes.elec1 ? electrodes.elec1 : "Electrode 1"}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {subject.geometry
                ? Object.keys(subject.geometry).map((channel) => {
                    return (
                      <Dropdown.Item
                        key={`${channel}_button1`}
                        onClick={() => {
                          setElectrodes({
                            ...electrodes,
                            elec1: channel,
                          });
                          let elec1Circle = document.getElementById(
                            `${channel}_circle`
                          );
                          elec1Circle.setAttribute("fill", "red");
                          elec1Circle.setAttribute("r", "3");
                        }}
                      >
                        {channel}
                      </Dropdown.Item>
                    );
                  })
                : null}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col sm={2} style={{ paddingLeft: "50px" }}>
          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              {electrodes.elec2 ? electrodes.elec2 : "Electrode 2"}
            </Dropdown.Toggle>
            <Elec2Dropdown></Elec2Dropdown>
          </Dropdown>
        </Col>
      </>
    );
  };
  const timeout = async (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Pull cortstim results that have already been recorded
  useEffect(() => {
    (async () => {
      if (subject.name.length > 0) {
        if (subject.name != "Template") {
          let cortstimReq = await fetch(`/api/data/${subject.name}/cortstim`);
          let cortStimRes = await cortstimReq.json();
          await timeout(50);
          let results = cortStimRes.results;
          let electrodeArray = [...allElectrodes];
          results.forEach((entry) => {
            let electrodes = entry.electrodes.split("_");
            electrodes.forEach((elec) => {
              electrodeArray.push(elec);
              highlightElectrodes(elec, "red");
            });
            setAllElectrodes(electrodeArray);
            createLine(electrodes[0], electrodes[1], entry.color);
          });
        }
      }
    })();
  }, [subject.name]);

  const SelectSubjectsDropdown = () => {
    return (
      <Dropdown>
        <Dropdown.Toggle variant="primary" id="patient-dropdown">
          {subject.name ? subject.name : "Patient ID"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {subjects
            ? subjects.reverse().map((subj) => {
                return (
                  <Dropdown.Item
                    key={`${subj}_dropdown`}
                    onClick={() => {
                      setNewSubject({ name: subj });
                    }}
                  >
                    {subj}
                  </Dropdown.Item>
                );
              })
            : null}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const TaskBody = () => {
    let circle1 = document.getElementById(`${electrodes.elec1}_circle`);
    let circle2 = document.getElementById(`${electrodes.elec2}_circle`);
    let xPos1 = parseFloat(circle1.getAttribute("cx"));
    let xPos2 = parseFloat(circle2.getAttribute("cx"));
    let yPos1 = parseFloat(circle1.getAttribute("cy"));
    let yPos2 = parseFloat(circle2.getAttribute("cy"));

    return (
      <Modal.Body>
        <Row className="justify-content-md-center">
          <ButtonGroup toggle>
            {[
              { name: "Positive", value: "1" },
              { name: "Negative", value: "2" },
            ].map((radio, index) => (
              <ToggleButton
                key={index}
                type="radio"
                variant="secondary"
                name="radio"
                value={radio.value}
                onChange={(e) => {
                  textOver.style.position = "absolute";
                  textOver.style.width = "100%";
                  let brainContainer = document.getElementById("container");
                  brainContainer.appendChild(textOver);

                  let line = select("#container")
                    .select("svg")
                    .append("line")
                    .attr("x1", xPos1)
                    .attr("y1", yPos1)
                    .attr("x2", xPos2)
                    .attr("y2", yPos2)
                    .attr("stroke-width", "5")
                    .attr("stroke", "#0BE9F9")
                    .on("mouseover", function (d, i) {
                      textOver.style.left = mouse(this)[0] + 10 + "px";
                      textOver.style.top = mouse(this)[1] + 10 + "px";
                      textOver.style.backgroundColor = "white";
                      select(this).attr("stroke", "#E1F90B");
                    })
                    .on("mouseout", function (d, i) {
                      textOver.innerText = "";
                      textOver.style.left = `${0}px`;
                      textOver.style.top = `${0}px`;
                      select(this).attr("stroke", "#0BE9F9");
                    });
                }}
              >
                {radio.name}
              </ToggleButton>
            ))}
          </ButtonGroup>
        </Row>
      </Modal.Body>
    );
  };

  const SetParameters = ({ param }) => {
    const { current, duration, frequency } = params;
    let message;
    let defaultValue;
    let rowArea;
    switch (param) {
      case "current":
        message = "Current (mA)";
        defaultValue = current;
        rowArea = 1;
        break;
      case "duration":
        message = "Duration (s)";
        defaultValue = duration;
        rowArea = 1;
        break;
      case "frequency":
        message = "Frequency (Hz)";
        defaultValue = frequency;
        rowArea = 1;
        break;
      case "notes":
        message = "Notes";
        defaultValue = "Notes";
        rowArea = 3;
        break;
      default:
        message = "d";
        break;
    }
    return (
      <Form>
        <Form.Group>
          <Form.Control
            as="textarea"
            rows={rowArea}
            placeholder={defaultValue.toString()}
            onBlur={(e) => {
              switch (param) {
                case "current":
                  setParams({
                    current: e.target.value,
                    duration,
                    frequency,
                  });
                  break;
                case "duration":
                  setParams({
                    current,
                    duration: e.target.value,
                    frequency,
                  });
                  break;
                case "frequency":
                  setParams({
                    current,
                    duration,
                    frequency: e.target.value,
                  });
                  break;
                case "notes":
                  setNotes(e.target.value);
                  break;
                default:
                  message = "s";
                  break;
              }
            }}
            className="text-center"
          />
          <Form.Text className="text-muted">{message}</Form.Text>
        </Form.Group>
      </Form>
    );
  };
  const TaskDropdown = () => {
    if (typeOfStim == "Task") {
      return (
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-basic">
            {typeOfTask}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {tasks.map((entry) => {
              return (
                <Dropdown.Item onClick={() => setTypeOfTask(entry)}>
                  {entry}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
      );
    } else {
      return <div></div>;
    }
  };
  return (
    <>
      <Container
        fluid
        style={{ display: "table", height: "100%", overflow: "auto" }}
      >
        <Row
          style={{
            height: "100%",
            display: "table-cell",
            borderRight: ".5rem solid",
            padding: "0",
          }}
        >
          <Col style={{ paddingTop: "10px" }}>
            <Row className="justify-content-md-center">
              <Col sm={3}>
                <SelectSubjectsDropdown></SelectSubjectsDropdown>
              </Col>
              <ElectrodeSelection></ElectrodeSelection>
            </Row>
            <Row
              style={{ padding: "5px", marginTop: "50px" }}
              className="justify-content-md-center"
            >
              <Col sm={2}>
                <SetParameters param="current"></SetParameters>
              </Col>
              <Col sm={2}>
                <SetParameters param="duration"></SetParameters>
              </Col>
              <Col sm={2}>
                <SetParameters param="frequency"></SetParameters>
              </Col>
            </Row>
            <Row
              className="text-center"
              style={{ marginTop: "50px", marginBottom: "50px" }}
            >
              <Col sm={3}>
                <Dropdown>
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                    {typeOfStim}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {["Task", "No task"].map((entry) => {
                      return (
                        <Dropdown.Item onClick={() => setTypeOfStim(entry)}>
                          {entry}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>

              <Col sm={3}>
                <Dropdown>
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                    {typeOfEffect}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {results.map((entry) => {
                      return (
                        <Dropdown.Item
                          onClick={() => {
                            setTypeOfEffect(entry);
                            let _color;
                            if (entry == "Clear") {
                              _color = "green";
                            } else if (entry == "Pain") {
                              _color = "yellow";
                            } else if (entry == "Motor") {
                              _color = "red";
                            } else if (entry == "Sensory") {
                              _color = "blue";
                            } else if (entry == "Language") {
                              _color = "purple";
                            } else if( entry == "Seizure"){
                              _color = "#F57F17"
                            } else if( entry == "After Discharge"){
                              _color = "#F9A825"
                            } 
                            else {
                              _color = "gray";
                            }
                            createLine(
                              electrodes.elec1,
                              electrodes.elec2,
                              _color
                            );
                            setColor(_color);
                          }}
                        >
                          {entry}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
              <Col sm={3}>
                <TaskDropdown></TaskDropdown>
              </Col>
              <Col sm={3}>
                <SetParameters param="notes"></SetParameters>
              </Col>
            </Row>
            <Button
              onClick={() => console.log(typeOfTask)}
              // onClick={() => createShape(electrodes.elec1, electrodes.elec2)}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                let dataToSend = {
                  patientID: subject.name,
                  date: `${month}/${day}/${year}`,
                  results: {
                    electrodes: `${electrodes.elec1}_${electrodes.elec2}`,
                    task: typeOfTask,
                    current: params.current,
                    frequency: params.frequency,
                    duration: params.duration,
                    result: typeOfEffect,
                    notes,
                    color,
                    time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                  },
                };
                fetch(`/api/data/cortstim/${subject.name}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(dataToSend),
                })
                  .then((response) => response.json())
                  .then((x) => {
                    console.log(x);
                  })
                  .catch((error) => {
                    console.error("Error:", error);
                  });
              }}
            >
              Save
            </Button>
            <Row className="text-center" style={{ marginTop: "20px" }}>
              <Col md={6}>
                {typeOfEffect=="Motor" ? <Image src={homonculus}></Image> : <div></div>}
              </Col>
              <Col md={6}>
                <ListGroup>
                  Legend
                  <ListGroupItem style={{ backgroundColor: "purple" }}>
                    Language
                  </ListGroupItem>
                  <ListGroupItem style={{ backgroundColor: "yellow" }}>
                    Pain
                  </ListGroupItem>
                  <ListGroupItem style={{ backgroundColor: "red" }}>
                    Motor
                  </ListGroupItem>
                  <ListGroupItem style={{ backgroundColor: "blue" }}>
                    Sensory
                  </ListGroupItem>
                  <ListGroupItem style={{ backgroundColor: "white" }}>
                    Seizure
                  </ListGroupItem>
                  <ListGroupItem style={{ backgroundColor: "white" }}>
                    After Discharge
                  </ListGroupItem>
                  <ListGroupItem style={{ backgroundColor: "orange" }}>
                    Other
                  </ListGroupItem>
                </ListGroup>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default CortstimMenu;
