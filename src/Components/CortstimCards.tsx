import React, {useRef, useEffect} from "react";
import { Table, Tab, InputGroup, FormControl, Button } from "react-bootstrap";
import { select } from "d3-selection";
const CortstimCards = ({tasks, electrodes, refs}) => {
	let buttonClicked = false
	let buttonRefs = useRef([])
	tasks.forEach((task, i) => {
		buttonRefs.current[i] = React.createRef();
	})

	useEffect(() => {
		tasks.forEach((event, i) => {
			buttonRefs.current[i].current.style.background =  'gray'
		});

	},[electrodes])

	return (
    <>
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
            {tasks.map((type, index) => {
              let buttonColor = "gray";
              //  taskButtons[index]
              //   ? "gray"
              //   : "green";
              return (
                <tr>
                  <td>
                    <Button
                      id={`${type}_button`}
                      key={type}
                      style={{
                        width: "100%",
                        background: buttonColor
					  }}
					  ref={buttonRefs.current[index]}

                      onClick={() => {
						  let curColor = buttonRefs.current[index].current.style.background
						  //@ts-ignore
						  buttonRefs.current[index].current.style.background = curColor=='gray' ? 'green' : 'gray'

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
							.attr("stroke", "green");


                      }}
                    >
                      {type}
                    </Button>
                  </td>
                  <td>
                    <InputGroup key={`${type}_inputGroup`}>
                      <InputGroup.Prepend style={{ margin: "auto" }}>
                        <InputGroup.Checkbox
                          onClick={() => {
                            let parentButton = document.getElementById(
                              `${type}_button`
                            );
                            if (parentButton.style.background == "green") {
                              parentButton.style.background = "purple";

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
                            } else if (
                              parentButton.style.background == "purple"
                            ) {
                              parentButton.style.background = "green";
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
    </>
  );
};

export default CortstimCards;
