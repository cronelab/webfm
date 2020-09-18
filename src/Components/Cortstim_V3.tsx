import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  ToggleButton,
  Dropdown,
  ButtonGroup,
  Modal,
  Image,
} from "react-bootstrap";
import { Context } from "../Context";
import Brain from "./Brain";
import { select, mouse } from "d3-selection";
import motor_homonculus from "../assets/motor_homunculus.jpg";
import sensory_homonculus from "../assets/sensory_homunculus.jpg";
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

  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [LR, setLR] = useState("Select left/right");
  const [homunLoaded, setHomunLoaded] = useState(false);

  const motorHomRef = useRef();
  // useCallback((node) => {
  //   if (node !== null) {
  //     setWidth(node.width);
  //     setHeight(node.height);
  //     console.log(node.width);
  //     console.log(node.height);
  //     console.log(node);
  //   }
  // }, []);

  useEffect(() => {
    function handleResize() {
      if (typeOfEffect == "Sensory") {
        //@ts-ignore
        setHeight(sensoryHomRef.current.clientHeight);
        //@ts-ignore
        setWidth(sensoryHomRef.current.clientWidth);
      } else if (typeOfEffect == "Motor") {
        //@ts-ignore
        setHeight(motorHomRef.current.clientHeight);
        //@ts-ignore
        setWidth(motorHomRef.current.clientWidth);
      }
    }

    window.addEventListener("resize", handleResize);
  });

  let sensoryHomRef = useRef();

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

  const HomunculusSquare = (props) => {
    let { xPos, yPos, description, rotation } = props;
    return (
      <circle
        onClick={() => console.log(description)}
        transform={`translate(${xPos} ${yPos})`}
        // width="20"
        // height="20"
        r="18"
        fill="green"
        fillOpacity=".2"
        stroke="green"
      />
    );
  };

  const HomunculusImage = () => {
    return (
      <>
        <Image
          ref={motorHomRef}
          style={{ width: "100%", height: "100%" }}
          src={motor_homonculus}
          // onClick={(e) => {
          //   //@ts-ignore
          //   let yPos = (e.pageY - 543) / motorHomRef.current.height;
          //   //@ts-ignore
          //   let xPos = (e.pageX - 30) / motorHomRef.current.width;
          //   console.log(xPos);
          //   console.log();
          // }}
        ></Image>
        <svg
          style={{
            zIndex: 1,
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
          }}
          onClick={(e) => {
            //@ts-ignore
            let xPos = (e.pageX - 30) / width;
            console.log(xPos);
            //@ts-ignore
            let yPos = (e.pageY - 543) / height;
            console.log(yPos);
          }}
        >
          {homunLoaded == true ? (
            <>
              <HomunculusSquare
                xPos={(0.137 * width).toString()}
                yPos={(0.474 * height).toString()}
                description="Toes"
                rotation="0"
              ></HomunculusSquare>
              <HomunculusSquare
                //@ts-ignore
                xPos={(0.06 * width).toString()}
                yPos={(0.17 * height).toString()}
                description="Knee"
                rotation="55"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.15 * width).toString()}
                yPos={(0.15 * height).toString()}
                description="Trunk"
                rotation="75"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.28 * width).toString()}
                yPos={(0.12 * height).toString()}
                description="Shoulder"
                rotation="90"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.353 * width).toString()}
                yPos={(0.11 * height).toString()}
                description="Arm"
                rotation="105"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.438 * width).toString()}
                yPos={(0.125 * height).toString()}
                description="Elbow"
                rotation="105"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.506 * width).toString()}
                yPos={(0.125 * height).toString()}
                description="Wrist"
                rotation="105"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.6 * width).toString()}
                yPos={(0.18 * height).toString()}
                description="Fingers"
                rotation="105"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.67 * width).toString()}
                yPos={(0.19 * height).toString()}
                description="Thumb"
                rotation="105"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.75 * width).toString()}
                yPos={(0.29 * height).toString()}
                description="Neck"
                rotation="105"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.8 * width).toString()}
                yPos={(0.37 * height).toString()}
                description="Brow"
                rotation="110"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.84 * width).toString()}
                yPos={(0.41 * height).toString()}
                description="Eye"
                rotation="115"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.87 * width).toString()}
                yPos={(0.5 * height).toString()}
                description="Face"
                rotation="125"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.875 * width).toString()}
                yPos={(0.58 * height).toString()}
                description="Lips"
                rotation="145"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.91 * width).toString()}
                yPos={(0.66 * height).toString()}
                description="Jaw"
                rotation="165"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.91 * width).toString()}
                yPos={(0.74 * height).toString()}
                description="Tongue"
                rotation="180"
              ></HomunculusSquare>
              <HomunculusSquare
                xPos={(0.92 * width).toString()}
                yPos={(0.81 * height).toString()}
                description="Pharynx"
                rotation="190"
              ></HomunculusSquare>
            </>
          ) : (
            <></>
          )}
        </svg>
      </>
    );
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
                            } else if (entry == "Seizure") {
                              _color = "#F57F17";
                            } else if (entry == "After Discharge") {
                              _color = "#F9A825";
                            } else {
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
                {typeOfEffect == "Sensory" || typeOfEffect == "Motor" ? (
                  <Dropdown style={{ marginTop: "5px" }}>
                    <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                      {LR}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        onClick={() => {
                          setLR("Left");
                          if (typeOfEffect == "Sensory") {
                            //@ts-ignore
                            setHeight(sensoryHomRef.current.clientHeight);
                            //@ts-ignore
                            setWidth(sensoryHomRef.current.clientWidth);
                          } else if (typeOfEffect == "Motor") {
                            //@ts-ignore
                            setHeight(motorHomRef.current.clientHeight);
                            //@ts-ignore
                            setWidth(motorHomRef.current.clientWidth);
                          }
                                              setHomunLoaded(true);
                        }}
                      >
                        Left
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => {
                          setLR("Right");
                          if (typeOfEffect == "Sensory") {
                            //@ts-ignore
                            setHeight(sensoryHomRef.current.clientHeight);
                            //@ts-ignore
                            setWidth(sensoryHomRef.current.clientWidth);
                          } else if (typeOfEffect == "Motor") {
                            //@ts-ignore
                            setHeight(motorHomRef.current.clientHeight);
                            //@ts-ignore
                            setWidth(motorHomRef.current.clientWidth);
                          }
                                              setHomunLoaded(true);
                        }}
                      >
                        Right
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <div></div>
                )}
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
              <Col md={6} style={{ padding: 0 }}>
                {typeOfEffect == "Motor" ? (
                  <HomunculusImage></HomunculusImage>
                ) : (
                  <div></div>
                )}
                {typeOfEffect == "Sensory" ? (
                  <>
                    <Image
                      src={sensory_homonculus}
                      ref={sensoryHomRef}
                      style={{ width: "100%" }}
                    ></Image>
                    <svg
                      style={{
                        zIndex: 1,
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <HomunculusSquare
                        xPos={(0.11 * width).toString()}
                        yPos={(0.55 * height).toString()}
                        description="Lips"
                        rotation="10"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.22 * width).toString()}
                        yPos={(0.31 * height).toString()}
                        description="Eye"
                        rotation="65"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.27 * width).toString()}
                        yPos={(0.25 * height).toString()}
                        description="Thumb"
                        rotation="45"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.35 * width).toString()}
                        yPos={(0.2 * height).toString()}
                        description="Fingers"
                        rotation="45"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.42 * width).toString()}
                        yPos={(0.17 * height).toString()}
                        description="Hand"
                        rotation="45"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.47 * width).toString()}
                        yPos={(0.12 * height).toString()}
                        description="Forearm"
                        rotation="75"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.6 * width).toString()}
                        yPos={(0.10 * height).toString()}
                        description="Arm"
                        rotation="85"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.55 * width).toString()}
                        yPos={(0.11 * height).toString()}
                        description="Elbow"
                        rotation="85"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.7 * width).toString()}
                        yPos={(0.09 * height).toString()}
                        description="Head"
                        rotation="90"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.77 * width).toString()}
                        yPos={(0.1 * height).toString()}
                        description="Neck"
                        rotation="105"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.85 * width).toString()}
                        yPos={(0.115 * height).toString()}
                        description="Hip"
                        rotation="105"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.95 * width).toString()}
                        yPos={(0.12 * height).toString()}
                        description="Knee"
                        rotation="105"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.155 * width).toString()}
                        yPos={(0.37 * height).toString()}
                        description="Nose"
                        rotation="200"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.14 * width).toString()}
                        yPos={(0.45 * height).toString()}
                        description="Face"
                        rotation="190"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.08 * width).toString()}
                        yPos={(0.62 * height).toString()}
                        description="Teeth"
                        rotation="195"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.075 * width).toString()}
                        yPos={(0.75 * height).toString()}
                        description="Gums"
                        rotation="185"
                      ></HomunculusSquare>
                      <HomunculusSquare
                        xPos={(0.09 * width).toString()}
                        yPos={(0.81 * height).toString()}
                        description="Tongue"
                        rotation="170"
                      ></HomunculusSquare>
                    </svg>
                  </>
                ) : (
                  <div></div>
                )}
              </Col>
              {/* <Col md={6}>
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
              </Col> */}
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default CortstimMenu;
