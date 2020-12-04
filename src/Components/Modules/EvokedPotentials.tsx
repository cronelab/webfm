import React, { useContext, useEffect, useState, useRef } from "react";
import { Context } from "../../Context";
import { Container, Row, Col, OverlayTrigger, Tooltip } from "react-bootstrap";
import Brain_2D from "../BrainContainers/Brain_2D";
import { Model } from "../BrainContainers/Brain_3D";
import { pullRecordEP } from "../../helpers/pullElectrophyisiologicalData";
import { selectAll, select } from "d3-selection";
import { scaleLinear, scaleTime } from "d3-scale";
import { extent } from "d3-array";
import { line } from "d3-shape";
import {highlightBipolarElectrodes,createLine} from '../Cortstim/ElectrodeAttributes'

export default function EvokedPotentials() {
  const { brainType, activeRecord, activeSubject } = useContext(Context);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [timeWindow, setTimeWindow] = useState({
    start: 0,
    end: 0,
  });
  const [stimulatingElectrodes, setStimulatingElectrodes] = useState({
    elec1: "",
    elec2: "",
  });
  const [data, setData] = useState();

  useEffect(() => {
    (async () => {
      let record = await pullRecordEP(activeSubject, activeRecord);

      setTimeWindow({
        start: record.window[0],
        end: record.window[1],
      });
      delete record.window;
      setData(record);
      setStimulatingElectrodes({
        elec1: `${activeRecord.split("_")[0]}`,
        elec2: `${activeRecord.split("_")[1]}`,
      });
    })();
  }, []);

  useEffect(() => {
    let stimElec1 = document.getElementById(
      `${stimulatingElectrodes.elec1}_circle`
    );
    let stimElec2 = document.getElementById(
      `${stimulatingElectrodes.elec2}_circle`
    );
    if (stimElec1) {
      let xPos1 = parseFloat(stimElec1.getAttribute("cx"));
      let xPos2 = parseFloat(stimElec2.getAttribute("cx"));
      let yPos1 = parseFloat(stimElec1.getAttribute("cy"));
      let yPos2 = parseFloat(stimElec2.getAttribute("cy"));
      let xPos = (xPos1 + xPos2) / 2;
      let yPos = (yPos1 + yPos2) / 2;
      stimElec1.setAttribute("fill", "red");
      stimElec1.setAttribute("cx", xPos.toString());
      stimElec1.setAttribute("cy", yPos.toString());
      stimElec1.setAttribute("r", "5");
    }
  }, [stimulatingElectrodes.elec1]);

  useEffect(() => {
    const sleep = (m) => new Promise((r) => setTimeout(r, m));

    if (data != undefined) {
      (async () => {
        let chartContainer = document.getElementById("container");
        setWidth(chartContainer.offsetWidth);

        var x = scaleLinear()
          //@ts-ignore
          .domain([0, data[Object.keys(data)[0]].times.length])
          .range([0, chartContainer.offsetWidth]);

        Object.keys(data).map((electrode) => {
          highlightBipolarElectrodes(electrode,'green',5);
          console.log(`${activeRecord.split("_")[0]}`)
          createLine(`${activeRecord.split("_")[0]}`,electrode,'blue',"brainContainer2D")
          let y = scaleLinear()
            //@ts-ignore
            .domain(extent(data[electrode].times))
            .range([0, 40]);

          // Sets stimulation onset marker
          select(`#${electrode}_container`)
            .append("line")
            .attr("x1", x(500))
            .attr("y1", 0)
            .attr("x2", x(500))
            .attr("y2", 40)
            .attr("stroke", "red")
            .attr("stroke-width", "1");
          //Creates the time series plot
          select(`#${electrode}_path`)
            //@ts-ignore
            .datum(data[electrode].times)
            .attr(
              "d",
              line()
                .x((d, i) => x(i))
                .y((d, i) => y(d))
            );
        });
      })();
    }
  }, [data]);
  const containerRef = useRef();
  return (
    <Container fluid>
      <Row>
        <Col>
          <div
            id="container"
            ref={containerRef}
            style={{
              height: `${window.innerHeight * 0.8}px`,
              overflow: "auto",
            }}
          >
            {data &&
              Object.keys(data).map((electrode, i) => {
                if (electrode == "window") return;
                return (
                  <OverlayTrigger
                    key={`${electrode}_overlay`}
                    placement="auto"
                    overlay={
                      <Tooltip id={`tooltip-${electrode}`}>
                        <div>
                          {electrode}
                          <br />
                          z-score:{" "}
                          <strong>
                            {/* {zScores[i]} @ {zTimePoint[i]} */}
                          </strong>
                          .
                          <br />
                          {/* Location: <strong>{anatomicalLocation[i]}</strong>. */}
                        </div>
                      </Tooltip>
                    }
                  >
                    <svg
                      //@ts-ignore
                      title={electrode}
                      width={width}
                      height={"40px"}
                      // onMouseEnter={(e) => mouseEntered(e)}
                      // onMouseLeave={(e) => mouseLeft(e)}
                      id={`${electrode}_container`}
                    >
                      <text x="0" y="20" fontWeight="bold" fontSize="16">
                        {electrode}
                      </text>
                      <path
                        id={`${electrode}_path`}
                        width={width}
                        // height={"40px"}
                        fill={"none"}
                        stroke={"steelblue"}
                        strokeWidth={1.5}
                      ></path>
                    </svg>
                  </OverlayTrigger>
                );
              })}
          </div>
        </Col>
        <Col>{brainType == "2D" ? <Brain_2D></Brain_2D> : <Model></Model>}</Col>
      </Row>
    </Container>
  );
}
