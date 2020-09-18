import React, { useEffect, useState, useContext } from "react";
import * as horizon from "d3-horizon-chart";
import { select, selectAll, mouse } from "d3-selection";
import { scaleLinear } from "d3-scale";
import fmdata from "../shared/fmdata";
import fmui from "../shared/fmui";
import { extent, max, min } from "d3-array";
import { Context } from "../Context";
// import "./Record/Record.scss";
import { highlightElectrodes } from "./Cortstim/ElectrodeAttributes";
export default function HighGamma(props) {
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [zeroMark, setZeroMark] = useState(0);
  const [displayData, setDisplayData] = useState({});
  const [isMounted, setMounted] = useState(false);
  const [times, setTimes] = useState();
  let locked = false;
  const { subject, setNewSubject, setWhichBrain } = useContext(Context);
  const [colors, setColors] = useState([
    "#313695",
    "#4575b4",
    "#74add1",
    "#abd9e9",
    "#ffffff",
    "#fee090",
    "#fdae61",
    "#f46d43",
    "#d73027",
  ]);

  let chartContainer;
  let dotColorScale = scaleLinear()
    //@ts-ignore
    .domain([-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9])
    //@ts-ignore
    .range(colors)
    .clamp(true);
  let subjectName = undefined;
  useEffect(() => {
    (async () => {
      var urlParams = new URLSearchParams(window.location.search);

      let recordType = urlParams.get("type");
      let recordName = urlParams.get("record");
      subjectName = urlParams.get("subject");
      setNewSubject({ name: subjectName });
      let request = await fetch(`/config`);
      let configData = await request.json();
      console.log(configData);

      let dataset = new fmdata();
      let uiManager = new fmui();

      uiManager.config.ui = configData;
      uiManager.setup();

      let fetchRoute = `/api/data/${subjectName}/${recordName}/${recordType}`;

      let response = await fetch(fetchRoute);
      let data = await response.json();
      await dataset.get(data);
      let dataTime = data.contents.times;
      setTimes(dataTime);
      setDisplayData(dataset.displayData);
      setMounted(true);

    })();
  }, []);

  useEffect(() => {
    chartContainer = document.getElementById("fm");

    // document.getElementById('dataTimer').onclick = async () => {
    // 	for (let i = 250; i < 900; i++) {
    // 		await sleep(10)
    // 		lineAndDotUpdate(i);
    // 	}
    // }

    if (isMounted) {
      let x = scaleLinear()
        .domain(extent(times))
        .range([0, chartContainer.offsetWidth]);

      setZeroMark(x(0));

      let horizonChart = horizon
        .horizonChart()
        .height(15)
        // @ts-ignore
        .step(
          chartContainer.offsetWidth /
            displayData[Object.keys(displayData)[0]].length
        )
        .colors(colors);
      selectAll(".fm-horizon")
        // @ts-ignore
        .data(Object.values(displayData))
        .each(horizonChart)
        .select(".title")
        .text((d, i) => Object.keys(displayData)[i])
        .style("font", "8px times");

      setHeight(chartContainer.offsetHeight);
      setWidth(chartContainer.offsetWidth);

      selectAll(".fm-horizon").on("click", () => {
        locked = !locked;
      });

      selectAll(".fm-horizon").on("mousemove", () => {
        if (!locked) {
          let firstHorizon = document.getElementsByClassName("fm-horizon")[0];
          //@ts-ignore
          let position = mouse(firstHorizon)[0];
          lineAndDotUpdate(position);
        }
      });
    setWhichBrain('3D')

    }
  }, [isMounted]);

  const lineAndDotUpdate = (position) => {
    cursorLineMover(position);
    dotUpdator(position);
  };

  const dotUpdator = (position) => {
    let nodes = document.getElementsByClassName("fm-horizon");
    let firstHorizon = nodes[0];
    //@ts-ignore

    let zedIndex = Math.floor(
      //@ts-ignore
      position / (firstHorizon.offsetWidth / times.length)
    );
    //@ts-ignore
    [...nodes].map((node, i) => {
      if (node.__data__[zedIndex].toString() != "NaN") {
        highlightElectrodes(
          node.id.split("_")[0],
          dotColorScale(node.__data__[zedIndex]),
          Math.abs(node.__data__[zedIndex]) * 5 + 5
        );
      }
    });
  };

  const cursorLineMover = (position) => {
    if (!locked) {
      select(".cursorLine")
        .attr("x1", position)
        .attr("y1", 0)
        .attr("x2", position)
        .attr("y2", chartContainer.offsetHeight);
    }
  };

  return (
    <div id="fm" style={{height:"100%"}}>
      <svg className="fm-cursor-svg" width={width} height={height}>
        <line
          className="zeroLine"
          style={{ stroke: "black" }}
          strokeWidth={3}
          x1={zeroMark}
          x2={zeroMark}
          y1={0}
          y2={height}
        />
        <line
          className="cursorLine"
          style={{ stroke: "red" }}
          strokeWidth={3}
          y1={0}
          y2={height}
        />
      </svg>
      {isMounted &&
        Object.keys(displayData).map((channel) => {
          return (
            <div
              className="fm-horizon"
              key={`${channel}_horizon`}
              id={`${channel}_horizon`}
              style={{
                outline: "thin solid black",
                height: `${height / Object.keys(displayData).length}px`,
              }}
            ></div>
          );
        })}
    </div>
  );
}
