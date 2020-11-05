import React, { useContext, useEffect, useState, useRef } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";
import { Context } from "../../Context";
import Brain_2D from "../BrainContainers/Brain_2D";
import { Model } from "../BrainContainers/Brain_3D";
import InputGroup from "react-bootstrap/InputGroup";
import { SensoryHomunculus, MotorHomunculus } from "./Submodules/Homunculus";
import { clearElectrodes, createLine } from "../../helpers/mutateElectrodes";

import { Group, Vector3, SphereGeometry, Color } from "three";
import { LineGeometry } from "../../../node_modules/three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "../../../node_modules/three/examples/jsm/lines/LineMaterial";
import { Line2 } from "../../../node_modules/three/examples/jsm/lines/Line2";

export default function Cortstim() {
  const {
    brainType,
    activeSubject,
    cortstimParams,
    activeElec1,
    setActiveElec1,
    activeElec2,
    setActiveElec2,
    setCortstimParams,
    homunculusSelection,
    setHomunculusSelection,
    cortstimNotes,
    setCortstimNotes,
    threeDElectrodes,
  } = useContext(Context);
  const [typeOfTask, setTypeOfTask] = useState("Task description");
  const [typeOfStim, setTypeOfStim] = useState("Task or no task");
  const [leftOrRight, setLeftOrRight] = useState();
  const [color, setColor] = useState("");
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
    "AD",
    "Experiential",
    "Other",
  ]);
  const taskColors = [
    "yellow",
    "red",
    "blue",
    "purple",
    "green",
    "#F57F17",
    "#F9A825",
    "orange",
    "gray",
  ];

  useEffect(() => window.scrollTo(0, 0), []);

  useEffect(() => {
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      fetchDataFromDB();
    })();
  }, []);

  const fetchDataFromDB = async () => {
    let req = await fetch(`/api/data/cortstim/${activeSubject}`);
    let res = await req.json();
    //@ts-ignore
    let results = res.results;
    results.forEach((record) => {
      const { electrodes, color } = record;
      let elec1 = electrodes.split("_")[0];
      let elec2 = electrodes.split("_")[1];
      createLine(elec1, elec2, color);
    });
  };

  let date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let year = date.getFullYear();

  return (
    <>
      <Container
        fluid
        style={{ display: "table", height: "100%", overflow: "auto" }}
      >
        <Row>
          <Col sm>
            <Row>
              <Col>
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
              <Col>
                {typeOfStim == "Task" ? (
                  <Dropdown>
                    <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                      {typeOfTask}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {tasks.map((entry) => {
                        return (
                          <Dropdown.Item
                            onClick={() => {
                              setTypeOfTask(entry);
                              //@ts-ignore
                              // setHeight(sensoryHomRef.current.clientHeight);
                              //@ts-ignore
                              // setWidth(sensoryHomRef.current.clientWidth);
                            }}
                          >
                            {entry}
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <></>
                )}
              </Col>

              <Col>
                <Dropdown>
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                    {typeOfEffect}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {results.map((entry, i) => {
                      return (
                        <>
                          <InputGroup
                            className="textCenter"
                            onClick={() => {
                              setColor(taskColors[i]);
                              setTypeOfEffect(entry);
                              if (brainType == "2D") {
                                createLine(
                                  activeElec1,
                                  activeElec2,
                                  taskColors[i]
                                );
                              }
                              if (brainType == "3D") {
                                let lineGroup = new Group();
                                threeDElectrodes.updateMatrixWorld();

                                lineGroup.name = "cortstimLine";
                                let stimElec1 = threeDElectrodes.getObjectByName(
                                  activeElec1
                                );
                                let stimElec2 = threeDElectrodes.getObjectByName(
                                  activeElec2
                                );
                                var vector1 = new Vector3();
                                var vector2 = new Vector3();
                                let lineGeom = new LineGeometry();
                                let elec1Pos = vector1.setFromMatrixPosition(
                                  stimElec1.matrixWorld
                                );
                                let elec2Pos = vector2.setFromMatrixPosition(
                                  stimElec2.matrixWorld
                                );
                                lineGeom.setPositions([
                                  elec1Pos.x,
                                  elec1Pos.y,
                                  elec1Pos.z,
                                  elec2Pos.x,
                                  elec2Pos.y,
                                  elec2Pos.z,
                                ]);
                                let material = new LineMaterial({
                                  //@ts-ignore
                                  color: taskColors[i],
                                  linewidth: 0.01,
                                });

                                let line = new Line2(lineGeom, material);
                                line.computeLineDistances();
                                line.scale.set(1, 1, 1);
                                lineGroup.add(line);
                                console.log(line)
                                threeDElectrodes.add(lineGroup);
                              }
                            }}
                          >
                            <InputGroup.Prepend
                              style={{
                                margin: "0px",
                              }}
                            >
                              <InputGroup.Text
                                style={{
                                  width: "50px",
                                  backgroundColor: taskColors[i],
                                }}
                              >
                                {" "}
                              </InputGroup.Text>
                            </InputGroup.Prepend>
                            {entry}
                          </InputGroup>
                        </>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
                {typeOfEffect == "Motor" || typeOfEffect == "Sensory" ? (
                  <ButtonGroup toggle>
                    {["Left", "Right", "Bilateral"].map((radio, idx) => (
                      <ToggleButton
                        key={idx}
                        type="radio"
                        variant="secondary"
                        name="radio"
                        value={radio}
                        // checked={leftOrRight === radio}
                        //@ts-ignore
                        onChange={(e) => setLeftOrRight(e.currentTarget.value)}
                      >
                        {radio}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                ) : (
                  <></>
                )}
              </Col>
            </Row>
            <Row style={{ paddingTop: "10px" }}>
              <Col md={1}></Col>
              <Col md={4}>
                <Button
                  variant="success"
                  block
                  onClick={() => {
                    let dataToSend = {
                      patientID: activeSubject,
                      date: `${month}/${day}/${year}`,
                      results: {
                        electrodes: `${activeElec1}_${activeElec2}`,
                        task: typeOfTask,
                        time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                        current: cortstimParams.current,
                        frequency: cortstimParams.freq,
                        duration: cortstimParams.duration,
                        result: typeOfEffect,
                        cortstimNotes,
                        color,
                      },
                    };
                    if (homunculusSelection) {
                      console.log(leftOrRight);
                      if (leftOrRight === undefined) {
                        alert("Select a hemisphere");
                      }
                      dataToSend.results[
                        "resultingArea"
                      ] = `${leftOrRight}_${homunculusSelection}`;
                    }
                    if (homunculusSelection == undefined) {
                      fetch(`/api/data/cortstim/${activeSubject}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(dataToSend),
                      })
                        .then((response) => response.json())
                        .then((x) => {
                          console.log(x);
                          setCortstimParams({
                            current: 5,
                            duration: 5,
                            freq: 50,
                          });
                          setActiveElec1("Electrode 1");
                          setActiveElec2("Electrode 2");
                          clearElectrodes();
                          setTypeOfTask("Task description");
                          setTypeOfStim("Task or no task");
                          setTypeOfEffect("Effect");
                          setHomunculusSelection();
                          fetchDataFromDB();
                          setCortstimNotes("Type in some notes");
                          setLeftOrRight(undefined);
                        })
                        .catch((error) => {
                          console.error("Error:", error);
                        });
                    } else if (
                      homunculusSelection != undefined &&
                      leftOrRight != undefined
                    ) {
                      fetch(`/api/data/cortstim/${activeSubject}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(dataToSend),
                      })
                        .then((response) => response.json())
                        .then((x) => {
                          console.log(x);
                          setCortstimParams({
                            current: 5,
                            duration: 5,
                            freq: 50,
                          });
                          setActiveElec1("Electrode 1");
                          setActiveElec2("Electrode 2");
                          clearElectrodes();
                          setTypeOfTask("Task description");
                          setTypeOfStim("Task or no task");
                          setTypeOfEffect("Effect");
                          setHomunculusSelection();
                          fetchDataFromDB();
                          setCortstimNotes("Type in some notes");
                          setLeftOrRight(undefined);
                        })
                        .catch((error) => {
                          console.error("Error:", error);
                        });
                    }
                  }}
                >
                  Trial complete
                </Button>
              </Col>
              <Col md={2}></Col>
              <Col md={4}>
                <Button
                  variant="danger"
                  block
                  onClick={() => {
                    setCortstimParams({ current: 5, duration: 5, freq: 50 });
                    setActiveElec1("Electrode 1");
                    setActiveElec2("Electrode 2");
                    clearElectrodes();
                    setTypeOfTask("Task description");
                    setTypeOfStim("Task or no task");
                    setTypeOfEffect("Effect");
                    setHomunculusSelection();
                    fetchDataFromDB();
                    setCortstimNotes("Type in some notes");
                    setLeftOrRight(undefined);
                  }}
                >
                  Clear
                </Button>
              </Col>
              <Col md={1}></Col>
            </Row>
            {/* <h1>Notess</h1> */}
            <Row>
              {typeOfEffect == "Sensory" ? (
                <SensoryHomunculus></SensoryHomunculus>
              ) : (
                <></>
              )}
              {typeOfEffect == "Motor" ? (
                <MotorHomunculus></MotorHomunculus>
              ) : (
                <></>
              )}
            </Row>
          </Col>

          <Col sm>
            {brainType == "2D" ? <Brain_2D></Brain_2D> : <Model></Model>}
          </Col>
        </Row>
      </Container>
    </>
  );
}
