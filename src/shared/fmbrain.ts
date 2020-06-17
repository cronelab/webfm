import { scaleLinear, scaleSqrt } from "d3-scale";
import { select } from "d3-selection";
import { load3DBrain_gltf } from "./loaders";
// import PY19N024 from '../../data/PY19N024/info/reconstruction.glb'

class fmbrain {
  sensorGeometry: any;
  selectedChannel: any;
  data: any;
  dotRadiusScale: any;
  dotColorScale: any;
  dotXScale: any;
  dotYScale: any;
  aspect: any;
  size: any;
  margin: any;
  dotMinRadius: any;
  dotMaxRadius: any;
  extent: any;
  dotColors: any;
  dotColorsDomain: any;
  constructor() {
    this.sensorGeometry = null;
    this.selectedChannel = null;
    this.data = null;
    this.dotRadiusScale = null;
    this.dotColorScale = null;
    this.dotXScale = null;
    this.dotYScale = null;
    this.aspect = null;
    this.size = {
      width: 0,
      height: 0,
    };
    this.margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    };
    this.dotMinRadius = 0.003;
    this.dotMaxRadius = 0.04;

    this.extent = 10.0;
    this.dotColors = [
      "#313695",
      "#4575b4",
      "#74add1",
      "#abd9e9",
      "#000000",
      "#fee090",
      "#fdae61",
      "#f46d43",
      "#d73027",
    ];
    this.dotColorsDomain = [-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9];
  }

  _getDimensionsForData(data: any) {
    return new Promise((resolve, reject) => {
      let image = document.createElement("img");
      image.addEventListener("load", function () {
        resolve({
          width: image.width,
          height: image.height,
        });
        this.remove();
      });
      image.src = data;
    });
  }
  setup() {
    var brain = this;
    let imageData = JSON.parse(localStorage.getItem("brain")).data;
    this.sensorGeometry = JSON.parse(localStorage.getItem("geometry")).data;
    this.data = Object.keys(this.sensorGeometry).reduce((obj: any, ch) => {
      obj[ch] = 0.0;
      return obj;
    }, {});
    this.size.width =
      document.getElementById("fm-brain").offsetWidth -
      (this.margin.left + this.margin.right);
    this.dotXScale = scaleLinear().domain([0, 1]).range([0, this.size.width]);

    this.dotYScale = scaleLinear() // v -> y
      .domain([0, 1])
      .range([1, 0]);
    this.dotRadiusScale = scaleSqrt()
      .domain([0, this.extent])
      .range([this.dotMinRadius, this.dotMaxRadius])
      .clamp(true);
    this.dotColorScale = scaleLinear()
      .domain(this.dotColorsDomain)
      .range(this.dotColors)
      .clamp(true);
    this._getDimensionsForData(imageData).then((dimensions: any) => {
      brain.aspect = dimensions.width / dimensions.height;
      brain.autoResize();
      brain.update();
    });
    // load3DBrain_gltf(PY19N024)

    // this.brainSvg =

    var g = select("#fm-brain")
      .append("svg")
      .attr("class", "fm-brain-svg")
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    g.append("image")
      .attr("class", "fm-brain-image")
      .attr("xlink:href", imageData)
      .attr("x", "0")
      .attr("y", "0");
    g.append("g").attr("class", "fm-brain-dots");
  }

  _dotVisibility(d: any) {
    if (d.channel == this.selectedChannel) return "visible";
    if (d.value == 0) return "hidden";
    return "visible";
  }

  _dotOrder(a: any, b: any) {
    if (a.channel == this.selectedChannel) return +1;
    if (b.channel == this.selectedChannel) return -1;
    return (
      this.dotXScale(this.dotRadiusScale(Math.abs(b.value))) -
      this.dotXScale(this.dotRadiusScale(Math.abs(a.value)))
    );
  }

  resize(width: any, height: any) {
    this.size.width = width;
    this.size.height = height;
    this.dotXScale.range([0, this.size.width]);
    this.dotYScale.range([this.size.height, 0]);
    var baseSelection = select("#fm-brain");
    baseSelection
      .select(".fm-brain-svg")
      .attr("width", this.size.width + this.margin.left + this.margin.right)
      .attr("height", this.size.height + this.margin.top + this.margin.bottom);
    baseSelection
      .select(".fm-brain-image")
      .attr("width", this.size.width)
      .attr("height", this.size.height);
    baseSelection
      .selectAll(".fm-brain-dot")
      .attr("visibility", this._dotVisibility.bind(this))
      .attr("cx", (d: any) => this.dotXScale(this.sensorGeometry[d.channel].u))
      .attr("cy", (d: any) => this.dotYScale(this.sensorGeometry[d.channel].v))
      .attr("r", (d: any) =>
        this.dotXScale(this.dotRadiusScale(Math.abs(d.value)))
      )
      .sort(this._dotOrder.bind(this));
  }
  autoResize() {
    if (!this.aspect) return;
    var width =
      document.getElementById("fm-brain").offsetWidth -
      (this.margin.left + this.margin.right);
    var height = width / this.aspect;
    if (width <= 0 || height <= 0) return;
    this.resize(width, height);
  }

  update(newData?: any) {
    if (newData !== undefined) this.data = newData;
    var brain = this;
    var brainDots: any = select("#fm-brain")
      .select(".fm-brain-dots")
      .selectAll(".fm-brain-dot")
      .data(
        Object.keys(this.data)
          .filter((ch) => {
            if (Object.keys(brain.sensorGeometry).indexOf(ch) < 0) return false;
            if (
              brain.sensorGeometry[ch].u === undefined ||
              brain.sensorGeometry[ch].v === undefined
            )
              return false;
            return true;
          })
          .map((ch) => {
            return {
              channel: ch,
              value: this.data[ch],
            };
          }),
        (d: any) => d.channel
      );

    // let start = performance.now()

    brainDots
      .enter()
      .append("circle")
      .attr("class", "fm-brain-dot")
      .merge(brainDots)
      .classed(
        "fm-brain-dot-selected",
        (d: any) => d.channel == brain.selectedChannel
      )
      .style("fill", (d: any) => this.dotColorScale(d.value))
      .attr("visibility", this._dotVisibility.bind(this))
      .attr("cx", (d: any) => this.dotXScale(this.sensorGeometry[d.channel].u))
      .attr("cy", (d: any) => this.dotYScale(this.sensorGeometry[d.channel].v))
      .attr("r", (d: any) =>
        this.dotXScale(this.dotRadiusScale(Math.abs(d.value)))
      )
      .sort(this._dotOrder.bind(this));

    // console.log(performance.now() - start)
  }

  setSelectedChannel(newChannel: any) {
    if (newChannel == this.selectedChannel) return;
    this.selectedChannel = newChannel;
    this.update();
  }
}

export default fmbrain;
