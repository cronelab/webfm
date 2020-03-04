import React, { useEffect, useContext, useRef, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import Brain from "../Components/Brain";
import "../Record/Record.scss";
import fmdata from "../shared/fmdata";
import fmui from "../shared/fmui";
// import OnlineDataSource from '../shared/fmonline'
import BCI2K from "bci2k";
import { DataHeader } from "../Components/DataHeader";
import MapModals from "./MapModals";

// import { Context } from "../Context";
// import { select, selectAll, mouse } from "d3-selection";
// import { scaleLinear } from "d3-scale";
// import { extent } from "d3-array";
// import * as horizon from "d3-horizon-chart";

export const Map = () => {
  //   const { subject, setNewSubject, setNewRecord, bci, setBCI } = useContext(
  //     Context
  //   );
  const [clicked, click] = useState(false);

  let bciSourceConnection = new BCI2K.bciData();
  const inputEl = useRef(null);

  useEffect(() => {
    (async () => {
      let request = await fetch(`/config`);
      let data = await request.json();
      let dataset = new fmdata();
      let uiManager = new fmui();
      // let dataSource = new OnlineDataSource();
      uiManager.config.ui = data;
      uiManager.setup();
      bciSourceConnection.connect("ws://127.0.0.1:20100").then(() => {
        bciSourceConnection.onSignalProperties = data => {
          console.log(data);
          dataset.setupChannels(data.channels);
          uiManager.updateChannelNames(data.channels);
        };
        bciSourceConnection.onReceiveBlock = (data) => {
          console.log(data);
        };
      });
      // 		let step = chartContainer.offsetWidth / dataset.displayData.LA1.length;
      // 		console.log(Object.keys(dataset.displayData))
      // 		let horizonChart = horizon
      // 			.horizonChart()
      // 			.height(30)
      // 			// @ts-ignore
      // 			.step(step)
      // 			.colors([
      // 				"#313695",
      // 				"#4575b4",
      // 				"#74add1",
      // 				"#abd9e9",
      // 				// "#ffffff",
      // 				"#fee090",
      // 				"#fdae61",
      // 				"#f46d43",
      // 				"#d73027"
      // 			]);

      // 		select(chartContainer)
      // 			.append("svg")
      // 			.attr("class", "fm-cursor-svg")

      // 		let x = scaleLinear()
      // 			.domain(extent(times))
      // 			.range([0, chartContainer.offsetWidth]);

      // 		select(chartContainer)
      // 			.selectAll(".fm-horizon")
      // 			// @ts-ignore
      // 			.data(Object.values(dataset.displayData))
      // 			.enter()
      // 			.append("div")
      // 			.attr("class", "fm-horizon")
      // 			.attr("style", "outline: thin solid black; height: 20px;")
      // 			.each(horizonChart)
      // 			.select(".title")
      // 			.text((d, i) => Object.keys(dataset.displayData)[i]);

      // 		select(".fm-cursor-svg")
      // 			.attr("width", chartContainer.offsetWidth)
      // 			.attr("height", chartContainer.offsetHeight)
      // 			.append("line")
      // 			.attr("class", "zeroLine")
      // 			.style("stroke", "black")
      // 			.attr("stroke-width", 3)
      // 			.attr("x1", x(0))
      // 			.attr("y1", 0)
      // 			.attr("x2", x(0))
      // 			.attr("y2", chartContainer.offsetHeight);

      // 		select(".fm-cursor-svg")
      // 			.append("line")
      // 			.attr("class", "cursorLine")
      // 			.style("stroke", "red")
      // 			.attr("stroke-width", 3)
      // 			.attr("x1", x(1))
      // 			.attr("y1", 0)
      // 			.attr("x2", x(1))
      // 			.attr("y2", chartContainer.offsetHeight);

      // 		selectAll(".fm-horizon").on("click", (d, i) => {
      // 			locked = !locked;
      // 		});
      // 		selectAll(".fm-horizon")
      // 			.on("mousemove", (d, i, nodes) => {
      // 				// @ts-ignore

      // 				let goal = x.invert(mouse(nodes[i])[0]);
      // 				let answer = times.reduce((prev, curr) =>
      // 					Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
      // 				);
      // 				// @ts-ignore

      // 				Object.values(times).map((x, i) => {
      // 					if (x == answer) {
      // 						// @ts-ignore

      // 						cursorLineMover(mouse(nodes[i])[0], i);
      // 					}
      // 				});
      // 			})
      // 		const cursorLineMover = (position, dataIndex) => {
      // 			if (!locked) {
      // 				select(".cursorLine")
      // 					.attr("x1", position)
      // 					.attr("y1", 0)
      // 					.attr("x2", position)
      // 					.attr("y2", chartContainer.offsetHeight);
      // 			}
      // 		};

      // 	})
      // })
    })();
  }, []);

  return (
    <div className="Record">
      <DataHeader></DataHeader>
      <Button className="fm-show-options" onClick={() => click(true)}>
        Button
      </Button>
      <MapModals clicked={clicked} />

      <Container fluid={true}>
        <Row>
          <Col xs={6}>
            <div id="fm" ref={inputEl} />
          </Col>
          <Col xs={6}>
            <Brain />
          </Col>
        </Row>
      </Container>
    </div>
  );
};
export default Map;
