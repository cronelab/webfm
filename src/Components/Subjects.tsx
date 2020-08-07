import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Card,
  InputGroup,
  FormControl,
  Row,
  Col,
  Container,
  Tab,
  Nav,
  Button,
  Modal,
  ListGroup,
  Form,
  ListGroupItem
} from "react-bootstrap";
// import { fetchAndStoreBrain } from '../shared/loaders'
import { Context } from "../Context";

export default function Subjects() {
  let {
    records,
    subjects,
    subject,
    setNewSubject,
    setNewBrain,
    setAllSubjects,
    setAllRecords
  }: any = useContext(Context);
  const [show, setShow] = useState(false);
  let tempArray = {};
  const fileUpload = useRef();
  const [fileName, setFileName] = useState("");

  //Request all EP and HG records from server
  const getRecords = async (subj: string) => {
    let epPath = `/api/${subj}/records/EP`;
    let hgPath = `/api/${subj}/records/HG`;
    let epReq = await fetch(epPath);
    let hgReq = await fetch(hgPath);
    let epResp = null;
    let hgResp = null;
    if (hgReq.status != 204) {
      hgResp = await hgReq.json();
    } else {
      hgResp = [];
    }
    if (epReq.status != 204) {
      epResp = await epReq.json();
    } else {
      epResp = [];
    }
    tempArray[subj] = { EP: epResp, HG: hgResp };
    setAllRecords(tempArray);
  };

  //Request all subjects from server
  useEffect(() => {
    (async () => {
      let listPathRes = await fetch(`/api/list`);
      let foundSubjects = await listPathRes.json();
      if (foundSubjects.length > 0) {
        foundSubjects.sort();
        foundSubjects.forEach((subject: string) => getRecords(subject));
        setAllSubjects(foundSubjects);
      } else {
        console.log("Nobody can be found");
      }
    })();
  }, []);

  const uploadGeometry = async () => {
    let req = await fetch(`/api/geometry/${subject.name}`)
    let res = await req.json()
    setNewSubject({
      name: subject.name,
      geometry: res
    })
      console.log(res)

   };
  const uploadBrain = () => {
    setNewBrain("");
  };
  const openUploadDialog = () => {
    //@ts-ignore
    fileUpload.current.click();
  };

  // const createNewSubject = () => {
  //   setAllSubjects([...subjects, subject]);
  // };
  const setFile = e => {

    let file = e.target.files[0];
    let formData = new FormData();
    formData.append("brainImage", file, file.name);
    var reader = new FileReader();
    reader.readAsDataURL(file);
    fetch(`/api/brain/${subject.name}`, {
      method: "PUT",
      body: formData
    }).then(() => {
      // fetchAndStoreBrain(subject.name).then(x => {
      //   setNewBrain(x)
      // })
    });
  };

  const SubjectModal = () => {
    return (
      <Modal
        show={show}
        onHide={() => setShow(false)}
        animation={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Subject list</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SubjectList />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const SubjectList = () => {
    return (
      <Tab.Container defaultActiveKey="first">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              {subjects.map((subject, index) => {
                return (
                  <Nav.Item key={`${subject}_${index}`}>
                    <Nav.Link eventKey={subject}>{subject}</Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              {subjects.map((subject, index) => {
                return (
                  <Tab.Pane
                    id={subject}
                    eventKey={`${subject}`}
                    key={`${subject}_${index}_pane`}
                  // onEntered={() => {
                  //   fetchAndStoreBrain(subject).then(x => {
                  //     setNewBrain(x)
                  //   })
                  // }}
                  >
                    <h1>{subject}</h1>
                    <Container>
                      <Row>
                        <Col>
                          <ListGroup>
                            <ListGroupItem
                              key="EP_Records"
                              style={{ backgroundColor: "#00f" }}
                            >
                              Evoked Potentials
                            </ListGroupItem>
                            {records[subject].EP.map(ep => {
                              return (
                                <ListGroupItem
                                  key={`${subject}_${ep}`}
                                  action
                                  href={`/records?subject=${subject}&type=EP&record=${ep}`}
                                >
                                  {ep}
                                </ListGroupItem>
                              );
                            })}
                          </ListGroup>
                        </Col>
                        <Col>
                          <ListGroup>
                            <ListGroupItem
                              key="HG_Records"
                              style={{ backgroundColor: "#00f" }}
                            >
                              High Gamma
                            </ListGroupItem>
                            {records[subject].HG.map(hg => {
                              return (
                                <ListGroupItem
                                  key={`${subject}_${hg}`}
                                  action
                                  href={`/records?subject=${subject}&type=HG&record=${hg}`}
                                >
                                  {hg}
                                </ListGroupItem>
                              );
                            })}
                          </ListGroup>
                        </Col>
                      </Row>
                    </Container>
                  </Tab.Pane>
                );
              })}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    );
  };
  return (
    <>
      <Card className="text-center">
        <Card.Header>
          <Card.Title as="h3">Subjects</Card.Title>
        </Card.Header>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">ID</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            id="new-subject-id"
            type="text"
            placeholder="PYXXN000"
            onChange={e => setNewSubject({ name: e.target.value, geometry: null })}
          />
          {/* <Button
            onClick={createNewSubject}
            type="submit"
            id="new-subject-ok"
            variant="outline-secondary"
          >
            Button
          </Button> */}
        </InputGroup>
        <Form.Group>
          <input
            type="file"
            ref={fileUpload}
            name="photo"
            style={{ display: "none" }}
            onChange={setFile}
          />
          <div className="file-box">
            <Button type="button"
              onClick={openUploadDialog}>
              Upload Photo
                  </Button>
            <span style={{ paddingLeft: "10px", marginTop: "5px" }}>
              {fileName}
            </span>
          </div>        </Form.Group>
        <Button onClick={uploadBrain}>Upload brain</Button>
        <Button onClick={uploadGeometry}>Upload geometry</Button>

        <Button
          title="Subjects"
          id="subject-list"
          style={{ width: "100%" }}
          onClick={() => setShow(true)}
        >
          Subjects
        </Button>
      </Card>
      <SubjectModal />
    </>
  );
}


// document.getElementById("new-subject-ok").onclick = () => {
// 	let newSubjectId = (<HTMLInputElement>document.getElementById("new-subject-id")).value;
// 	fetch(`/api/data/${newSubjectId}`, {
// 		method: "PUT"
// 	}).then(response => {
// 		addSubjectCell([newSubjectId]);
// 		selectSubject(newSubjectId);
// 	});
// };

// (<HTMLButtonElement>document.getElementsByClassName("upload-sensor-geometry")[0]).onclick = () =>
// 	document.getElementById("upload-sensor-geometry-input").click();
// document.getElementById("upload-sensor-geometry-input").onchange = async (e: any) => {
// 	let subject = localStorage.getItem("subject");

// 	let file = e.target.files[0];
// 	var reader = new FileReader();
// 	let jsonRecord: any = {};
// 	reader.addEventListener(
// 		"load",
// 		() => {
// 			let channelInfo = (<string>reader.result).split("\n");
// 			channelInfo.forEach((ch: string) => {
// 				let channelData = ch.split(",");
// 				if (channelData.length > 1) {
// 					jsonRecord[channelData[0]] = {
// 						u: parseFloat(channelData[1]),
// 						v: parseFloat(channelData[2])
// 					};
// 				}
// 			});
// 			fetch(`/api/geometry/${subject}`, {
// 				method: "PUT",
// 				body: JSON.stringify(jsonRecord),
// 				headers: {
// 					"Content-Type": "application/json"
// 				}
// 			});
// 			localStorage.setItem(`geometry`, JSON.stringify(jsonRecord));
// 		},
// 		false
// 	);
// 	reader.readAsText(file);
// 	// let storedGeometry = {
// 	//   subject: subject,
// 	//   geometry: file
// 	// };
// };

// (<HTMLButtonElement>document.getElementsByClassName("upload-brain-image")[0]).onclick = () =>
// 	document.getElementById("upload-brain-image-input").click();
// document.getElementById("upload-brain-image-input").onchange = (e: any) => {
// 	let file = e.target.files[0];
// 	let subject = localStorage.getItem("subject");
// 	let formData = new FormData();
// 	formData.append("brainImage", file, file.name);
// 	var reader = new FileReader();
// 	reader.addEventListener(
// 		"load",
// 		() => {
// 			(<HTMLImageElement>document.getElementsByClassName("main-brain")[0]).src = (<string>reader.result);
// 			(<HTMLImageElement>document.getElementsByClassName("main-brain")[1]).src = (<string>reader.result);
// 		},
// 		false
// 	);
// 	reader.readAsDataURL(file);

// 	fetch(`/api/brain/${subject}`, {
// 		method: "PUT",
// 		body: formData
// 	});

// };
// let brainDots: any
// let sensorGeometry: any
// let positionInfoelement: any
// document.getElementById('modal-geometry-generator-tab').onclick = e => {

// 	sensorGeometry = JSON.parse(localStorage.getItem('geometry')).data;
// 	brainDots = select('#fm-brain').append('svg').attr('class', 'fm-brain-svg').append('g')
// 		.attr('class', 'fm-brain-dots').selectAll('.fm-brain-dot').data(Object.keys(sensorGeometry).map(ch => {
// 			return {
// 				channel: ch,
// 				value: 1
// 			};
// 		}), (d: any) => d.channel);

// 	let electrodeList = document.getElementById('electrodeList')
// 	let electrodeListTable = document.createElement('table');
// 	let electrodeListTableHead = document.createElement('thead');
// 	let electrodeListTableBody = document.createElement('tbody');
// 	electrodeListTableBody.id = 'electrodeTable'
// 	let electrodeListTableHeadRow = document.createElement('tr');
// 	let electrodeListTableHeadRowCol1 = document.createElement('th');
// 	electrodeListTableHeadRowCol1.setAttribute('scope', 'col')
// 	electrodeListTableHeadRowCol1.innerHTML = "Channel"
// 	let electrodeListTableHeadRowCol2 = document.createElement('th');
// 	electrodeListTableHeadRowCol2.setAttribute('scope', 'col')
// 	electrodeListTableHeadRowCol2.innerHTML = "X"
// 	let electrodeListTableHeadRowCol3 = document.createElement('th');
// 	electrodeListTableHeadRowCol3.setAttribute('scope', 'col')
// 	electrodeListTableHeadRowCol3.innerHTML = "Y"
// 	let table = electrodeList.appendChild(electrodeListTable)
// 	let tableHeadRow = table.appendChild(electrodeListTableHead).appendChild(electrodeListTableHeadRow)
// 	tableHeadRow.appendChild(electrodeListTableHeadRowCol1)
// 	tableHeadRow.appendChild(electrodeListTableHeadRowCol2)
// 	tableHeadRow.appendChild(electrodeListTableHeadRowCol3)
// 	electrodeListTable.appendChild(electrodeListTableBody)
// 	electrodeListTable.classList.add('table-striped')

// 	setTimeout(() => {
// 		positionInfoelement = document.getElementById('fm-brain').getBoundingClientRect();
// 		brainDots.enter().append('circle')
// 			.attr('class', 'fm-brain-dot')
// 			.merge(brainDots)
// 			.style('fill', (d: any) => 'green')
// 			.attr('visibility', "visible")
// 			.attr('cx', (d: any) => sensorGeometry[d.channel].u * positionInfoelement.width)
// 			.attr('cy', (d: any) => (1 - sensorGeometry[d.channel].v) * positionInfoelement.height)
// 			.attr('r', (d: any) => 2)
// 			.attr('id', (d: any) => `dot_${d.channel}`)

// 		Object.keys(sensorGeometry).forEach(ch => {
// 			let valueToPlot = {
// 				name: `${ch}`,
// 				x: sensorGeometry[ch].u * positionInfoelement.width,
// 				y: (1 - sensorGeometry[ch].v) * positionInfoelement.height
// 			}
// 			let channelEntry = document.createElement('tr')
// 			channelEntry.id = `table_${ch}`
// 			channelEntry.onclick = () => changeDots(valueToPlot, "highlight")
// 			channelEntry.ondblclick = () => changeDots(valueToPlot, "clear")

// 			let channelName = document.createElement('td')
// 			channelName.innerHTML = ch
// 			let xPos = document.createElement('td')
// 			xPos.innerHTML = (valueToPlot.x).toFixed(0)
// 			let yPos = document.createElement('td')
// 			yPos.innerHTML = (valueToPlot.y).toFixed(0)
// 			electrodeListTableBody.appendChild(channelEntry)
// 			channelEntry.appendChild(channelName)
// 			channelEntry.appendChild(xPos)
// 			channelEntry.appendChild(yPos)
// 		})
// 	}, 300)

// }
// const changeDots = (e: any, type: any) => {
// 	if (type == "highlight") {
// 		document.getElementById(`dot_${e.name}`).style.fill = "red"
// 		document.getElementById(`dot_${e.name}`).setAttribute('r', '5')
// 		setTimeout(() => {
// 			document.getElementById(`dot_${e.name}`).style.fill = "green"
// 			document.getElementById(`dot_${e.name}`).setAttribute('r', '2')
// 		}, 1000)
// 	} else {
// 		document.getElementById(`dot_${e.name}`).style.fill = "red"
// 		document.getElementById(`dot_${e.name}`).setAttribute('r', '5')
// 		setTimeout(() => {
// 			select(`#dot_${e.name}`).remove()
// 			document.getElementById('fm-brain').addEventListener('click', logger)

// 			function logger(zed: any) {
// 				select('.fm-brain-dots').append('circle')
// 					.attr('class', 'fm-brain-dot')
// 					.style('fill', 'green')
// 					.attr('visibility', "visible")
// 					.attr('cx', zed.offsetX)
// 					.attr('cy', zed.offsetY)
// 					.attr('r', 2)
// 					.attr('id', `dot_${e.name}`);
// 				(<HTMLInputElement>document.getElementById(`table_${e.name}`).childNodes[1]).innerText = zed.offsetX
// 					(<HTMLInputElement>document.getElementById(`table_${e.name}`).childNodes[2]).innerText = zed.offsetY
// 				document.getElementById('fm-brain').removeEventListener('click', logger)
// 			}
// 		}, 1000)
// 	}
// }

// document.getElementById("geometryButton").onclick = () => {
// 	let newChannel = (<HTMLInputElement>document.getElementById('geometryCreator')).value;
// 	console.log(newChannel)
// 	let elecTable = document.getElementById('electrodeTable')
// 	let channelEntry = document.createElement('tr')
// 	channelEntry.id = `table_${newChannel}`
// 	let channelName = document.createElement('td')
// 	channelName.innerHTML = newChannel
// 	channelEntry.appendChild(channelName)

// 	elecTable.appendChild(channelEntry)
// 	document.getElementById('fm-brain').addEventListener('click', logger)

// 	function logger(zed: any) {
// 		let xPos = document.createElement('td')
// 		xPos.innerHTML = zed.offsetX
// 		let yPos = document.createElement('td')
// 		yPos.innerHTML = zed.offsetY
// 		let valueToPlot = {
// 			name: `${newChannel}`,
// 			x: xPos,
// 			y: yPos
// 		}
// 		channelEntry.onclick = () => changeDots(valueToPlot, "highlight")
// 		channelEntry.ondblclick = () => changeDots(valueToPlot, "clear")
// 		channelEntry.appendChild(xPos)
// 		channelEntry.appendChild(yPos)
// 		select('.fm-brain-dots').append('circle')
// 			.attr('class', 'fm-brain-dot')
// 			.style('fill', 'green')
// 			.attr('visibility', "visible")
// 			.attr('cx', zed.offsetX)
// 			.attr('cy', zed.offsetY)
// 			.attr('r', 2)
// 			.attr('id', `dot_${newChannel}`)
// 		document.getElementById('fm-brain').removeEventListener('click', logger)
// 	}
// }


