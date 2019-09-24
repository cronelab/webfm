import "./replay.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import * as d3 from "d3";
import {
  loadBrain, loadGeometry, loadStats, loadValues,
  loadDots
} from "../loaders.js";
import * as horizon from "d3-horizon-chart";
import threeD from "../../migration/new/threeD/threeD";
import UI from "../map/UI";

window.onload = () => {
  let userInterface = new UI();



  //Get subject and task name from local storage and set them in the header
  let subject = localStorage.getItem("subject");
  let task = localStorage.getItem("task");
  document.getElementsByClassName("fm-subject-name")[0].innerText = subject;
  document.getElementsByClassName("fm-task-name")[0].innerText = task;

  //Load the data from the .fm record
  let stats = loadStats(subject, task);
  let values = loadValues(subject, task);
  let selectedChannel = null;
  let lineScale = 1000;
  //Load the brain image
  loadBrain(subject);

  let selectedChannel = null;
  let lineScale = 1000;

  //Load the montage file
  loadGeometry(subject).then(x => {
    let chList = document.createElement("ul");
    chList.classList.add("list-group-item");
    chList.innerHTML = "All channels";
    chList.onclick = e => {
      e.preventDefault();
      //View all channels
      stats.then(y => lineChart(y, Object.keys(x), 1000));
    };
    document.getElementById("fm-montage-list").appendChild(chList);
    Object.keys(x).map((ch, i) => {
      let chList = document.createElement("ul");
      chList.classList.add("list-group-item");
      chList.innerHTML = ch;
      chList.onclick = e => {
        e.preventDefault();
        selectedChannel = [ch];
        //View a single channel
        stats.then(y => lineChart(y, [ch], lineScale));
      };
      document.getElementById("fm-montage-list").appendChild(chList);
    });
    stats.then(y => horizonChartz(y, Object.keys(x)));
  });

  //Currently these redraw the entire plot, all we really want to do is rescale it
  document.getElementsByClassName("fm-zoom-in").onclick = e => {
    lineScale = lineScale + 50;
    stats.then(x => lineChart(x, selectedChannel, lineScale));
  };
  document.getElementsByClassName("fm-zoom-out").onclick = e => {
    lineScale = lineScale - 50;
    stats.then(x => lineChart(x, selectedChannel, lineScale));
  };

  document.getElementById("toggle3D").parentElement.onclick = () => {
    console.log(subject);
    // threeD(subject);
  };
  threeD();

};

let lineChart = (values, ch, scale) => {
  d3.select("#fm-chart-container")
    .selectAll("svg > *")
    .remove();
  const svg = d3.select("#fm-chart");
  let height = 480;
  let width = 640;
  let margin = { top: 100, right: 30, bottom: 30, left: 50 };
  let data = ch.map(indCh => {
    return values[indCh].stats.mean.map((x, i) => {
      return { time: values.times[i], value: x };
    });
  });
  let y = d3
    .scaleLinear()
    .domain([0, scale])
    .nice()
    .range([height - margin.bottom, margin.top]);

  let x = d3
    .scaleLinear()
    .domain(d3.extent(values.times))
    .range([margin.left, width - margin.right]);

  let xAxis = g =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  let yAxis = g =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(data.y)
      );

  let line = d3
    .line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.time))
    .y(d => y(d.value));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("path")
    .datum(data[0])
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);

  svg.attr("width", width);
  svg.attr("height", height);

  svg
    .append("line")
    .style("stroke", "red")
    .attr("x1", x(-0.2))
    .attr("y1", margin.top)
    .attr("x2", x(-0.2))
    .attr("y2", height - margin.top);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "underline")
    .text(`Showing channel: ${ch}`);

  return svg.node();
};


let horizonChartVals = vals => {
  let locked = false;
  let data = Object.keys(vals).map(indCh => {
    return vals[indCh];
  });
  console.log(vals);
  let chartContainer = document.getElementById("fm-chart-container");
  let step = (chartContainer.offsetWidth - 30 * 2) / data[0].length;
  let horizonChart = horizon
    .horizonChart()
    .height(20)
    .step(step)
    .colors([
      "#313695",
      "#4575b4",
      "#74add1",
      "#abd9e9",
      "#fee090",
      "#fdae61",
      "#f46d43",
      "#d73027"
    ]);

  let x = d3
    .scaleLinear()
    .domain(d3.extent(vals.times))
    .range([0, chartContainer.offsetWidth]);

  d3.select(chartContainer)
    .append("svg")
    .attr("class", "rasterLines");
  var horizons = d3
    .select(chartContainer)
    .selectAll(".horizon")
    .data(data)
    .enter()
    .append("div")
    .attr("class", "horizon")
    .attr("style", "outline: thin solid black; height: 20px;")
    .each(horizonChart);

  d3.select(".rasterLines")
    .attr("width", chartContainer.offsetWidth)
    .attr("height", chartContainer.offsetHeight)
    .append("line")
    .attr("class", "zeroLine")
    .style("stroke", "black")
    .attr("stroke-width", 3)
    .attr("x1", x(0))
    .attr("y1", 0)
    .attr("x2", x(0))
    .attr("y2", chartContainer.offsetHeight);

  d3.select(".rasterLines")
    .append("line")
    .attr("class", "cursorLine")
    .style("stroke", "red")
    .attr("stroke-width", 3)
    .attr("x1", x(1))
    .attr("y1", 0)
    .attr("x2", x(1))
    .attr("y2", chartContainer.offsetHeight);

  d3.selectAll(".horizon").on("click", (d, i) => {
    locked = !locked;
    console.log(Object.keys(vals)[i]);
  });

  d3.selectAll(".horizon").on("mousemove", (d, i, nodes) => {
    let goal = x.invert(d3.mouse(nodes[i])[0]);
    let answer = vals.times.reduce((prev, curr) =>
      Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );
    Object.values(vals.times).map((x, i) => {
      if (x == answer) {
        cursorLineMover(d3.mouse(nodes[i])[0], i);
      }
    });
  });

  d3.selectAll(".horizon")
    .append("text")
    .text((d, i) => Object.keys(vals)[i]);

  const cursorLineMover = (position, dataIndex) => {
    if (!locked) {
      document.getElementsByClassName(
        "fm-time-selected"
      )[0].innerHTML = `${parseFloat(x.invert(position)).toFixed(2)} s`;
      d3.select(".cursorLine")
        .attr("x1", position)
        .attr("y1", 0)
        .attr("x2", position)
        .attr("y2", chartContainer.offsetHeight);
      let dotObject = Object.values(vals).map(x => x[dataIndex]);
      let geo = JSON.parse(localStorage.getItem("geometry"));
      let dotObj = {
        geo,
        dotObject
      };
      loadDots(dotObj);
    }
  };
};
let horizonChartz = (values, chs) => {
  // document.getElementById("fm-chart").remove();
  let firstRaster = document.getElementById("fm-chart-container");
  let secondRaster = document.getElementById("fm-chart-container2");
  // let secondRaster = document.createElement("div")
  // secondRaster.classList.add("col")

  // firstRaster.parentNode.insertBefore(secondRaster,firstRaster)

  let data = chs.map(indCh => {
    return values[indCh].stats.mean;
  });

  let firstHalf = data.slice(0, data.length / 2);
  let secondHalf = data.slice(data.length / 2, data.length);

  let horizonChart = horizon
    .horizonChart()
    .height(15)
    .step(8)
    .colors([
      "#313695",
      "#4575b4",
      "#74add1",
      "#abd9e9",
      "#fee090",
      "#fdae61",
      "#f46d43",
      "#d73027"
    ]);

  var horizons = d3
    .select(firstRaster)
    .selectAll(".horizon")
    .data(firstHalf)
    .enter()
    .append("div")
    .attr("class", "horizon")
    .attr("style", "outline: thin solid black;")
    .append("text")
    .text((d, i) => chs[i])
    .each(horizonChart);

  var horizons2 = d3
    .select(secondRaster)
    .selectAll(".horizon")
    .data(secondHalf)
    .enter()
    .append("div")
    .attr("class", "horizon")
    .attr("style", "outline: thin solid black;")
    .append("text")
    .text((d, i) => chs[i + data.length / 2])
    .each(horizonChart);
};
