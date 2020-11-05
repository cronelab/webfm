import React, { useEffect, useContext } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { Context } from "../Context";
import { useHistory } from "react-router-dom";

import Brain_2D from "./BrainContainers/Brain_2D";
import { Model } from "./BrainContainers/Brain_3D";
export default function Dashboard() {
  const {
    activeSubject,
    brainType,
    setAnnotator,
    setAnnotationDate,
    setRecords,
    records,
    setActiveRecord,
  } = useContext(Context);
  const history = useHistory();

  useEffect(() => {
    (async () => {
      if (activeSubject) {
        let _hgRecords = await fetch(`/api/records/HG/${activeSubject}`);
        let _epRecords = await fetch(`/api/records/EP/${activeSubject}`);

        let hgRecords, epRecords;
        if (_hgRecords.status == 200) {
          hgRecords = await _hgRecords.json();
        } else {
          hgRecords = [];
        }
        if (_epRecords.status == 200) {
          epRecords = await _epRecords.json();
        } else {
          epRecords = [];
        }
        setRecords({ hg: hgRecords, ep: epRecords });
      }
    })();
  }, [activeSubject]);

  return (
    <>
      <Container fluid>
        <Row>
          <Col sm={7}>
            <Row>
              <Col>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Functional Mapping</Card.Title>
                    <Card.Text> Traditional WebFM</Card.Text>
                    {records["hg"].map((hg) => {
                      return (
                        <Button
                          onClick={() => {
                            setActiveRecord(hg);
                            history.push("/hg");
                          }}
                          size="sm"
                        >
                          {hg}
                        </Button>
                      );
                    })}
                    {/* <Button onClick={() => setRecordingType("webfm")}></Button> */}
                  </Card.Body>
                </Card>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>CCEPS</Card.Title>
                    <Card.Text> Cortico-Cortico Evoked Potentials</Card.Text>
                    {records["ep"].map((ep) => {
                      return (
                        <Button
                          onClick={() => {
                            setActiveRecord(ep);
                            history.push("/ep");
                          }}
                          size="sm"
                        >
                          {ep}
                        </Button>
                      );
                    })}
                  </Card.Body>
                </Card>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Cortical Stimulation</Card.Title>
                    <Card.Text> Cortstim</Card.Text>
                    <Button
                      onClick={() => {
                        history.push("/cortstim");
                      }}
                    >
                      View Data
                    </Button>
                  </Card.Body>
                </Card>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Clinical Reconstruction</Card.Title>
                    <Button
                      onClick={() =>
                        window.open(
                          "http://zappa.neuro.jhu.edu:5000?subject=PY20N012"
                        )
                      }
                      // onClick={() => setRecordingType("cortstim")}
                    >
                      {" "}
                      View T1 and 3D Mesh
                    </Button>
                  </Card.Body>
                </Card>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Attention Clinicians</Card.Title>
                    <Card.Body>
                      Use the following to draw annotations on the
                      reconstruction
                    </Card.Body>
                    {/* <Card.Body>
                      {" "}
                      Please select the SOZ to the best of your ability Feel
                      free to annote the brain with any important areas or notes
                    </Card.Body> */}
                    <Form>
                      <Form.Row>
                        <Form.Group as={Col} controlId="formGridEmail">
                          <Form.Label>Name</Form.Label>
                          <Form.Control type="email" placeholder="Enter name" 
                          //@ts-ignore
                            onChange={(e)=>setAnnotator(e.target.value)}
                          />
                        </Form.Group>

                        <Form.Group as={Col} controlId="formGridPassword">
                          <Form.Label>Date</Form.Label>
                          <Form.Control type="date" placeholder="Date" 
                            onChange={(e)=>setAnnotationDate(e.target.value)}
                            />
                        </Form.Group>
                      </Form.Row>
                      <ButtonGroup vertical>
                        <Button
                          onClick={() => {
                            if (activeSubject) {
                              history.push("/annotation");
                            }
                            else{
                              alert("Select a patient first")
                            }
                          }}
                        >
                          Annotate
                        </Button>
                        {/* <Button>Select SOZ electrodes</Button>
                        <Button>Select Irritative zone electrodes</Button>
                        <Button>
                          Select Early propagation zone electrodes
                        </Button> */}
                      </ButtonGroup>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col sm={5}>
            {activeSubject == null ? (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "20px",
                  marginTop: "100px",
                }}
              >
                Select a Patient
              </div>
            ) : (
              <>{brainType == "2D" ? <Brain_2D></Brain_2D> : <Model></Model>}</>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
