//TODO:
//Parameterize:
//Margins
//Height/width
//resizing
//Dot:
//radii
//colors
//Highlight selected channel from Raster
//Threshold:
//Live
//Map

import {scaleLinear} from "d3";
import {Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight} from "three";
import FBXLoader from 'three-fbx-loader'
import OrbitControls from 'three-orbitcontrols'

let loadBrain = async subject => {
  let brainPath = `/api/${subject}/brain`;
  let response = await fetch(brainPath);
  let resType = response.headers.get("content-type");
  let fmBrain = document.getElementsByClassName("fm-brain-2D");

  if (resType.includes("image/jpeg")) {
    let brain = await response.arrayBuffer();
    let base64Flag = "data:image/jpeg;base64,";
    let binary = "";
    let bytes = [].slice.call(new Uint8Array(brain));
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    Array.from(fmBrain).forEach(fmbrain => {
      fmbrain.setAttribute("src", base64Flag + window.btoa(binary));
    })
  } else {
    let brain = await response.text();
    Array.from(fmBrain).forEach(fmbrain => {
      fmbrain.setAttribute("src", brain);
    })
  }
};

let load3DBrain = subject => {
  let brainContainer = document.getElementById('fm-brain-3D');
  let loader = new FBXLoader();
  let scene = new Scene();
  let camera = new PerspectiveCamera(45, 640 / 480, 0.1, 50000);
  let renderer = new WebGLRenderer({antialias: true});
  let controls = new OrbitControls( camera, renderer.domElement );
  let light = new HemisphereLight( 0xffffff, 0x444444 );
  camera.position.set(500, 1000, 500);
  renderer.setSize(640, 480);
  light.position.set( 0, 0, 10 );
  controls.target.set( 100, 0, 0 );
  controls.update();
  scene.add( light );
  loader.load(`/api/${subject}/brain3D`, object3d => scene.add(object3d));
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
  brainContainer.appendChild(renderer.domElement);
}


let loadGeometry = async subject => {
  let geometryPath = `api/${subject}/geometry`;
  const response = await fetch(geometryPath);
  const geometry = await response.json();
  return geometry;
};

//This only works if the data is in the metadata folder under sensorGeometry.
// we actually only want to do this when we're creating the geometry
let loadDots = dataList => {
  let dotColors = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#000000", "#fee090", "#fdae61", "#f46d43", "#d73027"];
  let dotColorsDomain = [-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9];
  let dotColorScale = scaleLinear()
    .domain(dotColorsDomain)
    .range(dotColors)
    .clamp(true);
  // console.log(dotColorScale)
  let brain = document.getElementsByClassName("fm-brain-2D")[0];
  let dots = document.getElementById("electrode-dots");
  dots.style.position = "absolute";
  dots.width = brain.width;
  dots.height = brain.height;
  let ctx = dots.getContext("2d");
  Object.values(dataList.geo).map((electrodes, i) => {
    ctx.beginPath();
    ctx.arc(
      brain.width * electrodes.u,
      brain.height * (1 - electrodes.v),
      Math.abs(dataList.dotObject[i]) * 10,
      0,
      Math.PI * 2,
      true
    );
    ctx.stroke();
    ctx.fillStyle = dotColorScale(dataList.dotObject[i]);
    ctx.fill();
  });
};

let loadValues = async (subject, record) => {
  let valuePath = `api/${subject}/${record}/values`;
  let timePath = `api/${subject}/${record}/times`;
  const valueResponse = await fetch(valuePath);
  const values = await valueResponse.json();
  const timeResponse = await fetch(timePath);
  const times = await timeResponse.json();
  let channels = Object.keys(values);
  return {
    ...values,
    times
  };
}

let loadStats = async (subject, record) => {
  let statPath = `api/${subject}/${record}/stats`;
  let timePath = `api/${subject}/${record}/times`;

  const statResponse = await fetch(statPath);
  const stats = await statResponse.json();
  const timeResponse = await fetch(timePath);
  const times = await timeResponse.json();
  let channels = Object.keys(stats.estimators.mean);
  let distributions = stats.distributions;
  let values = channels.map(ch => {
    let mean = stats.estimators.mean[ch];
    let variance = stats.estimators.variance[ch];
    let count = stats.estimators.count;

    let _m2 = mean.map((d, i) => {
      return count[i] > 1 && variance[i] !== undefined ?
        variance[i] * (count[i] - 1) :
        undefined;
    });
    let baselineMean = stats.baseline.mean[ch];
    let baselineVariance = stats.baseline.variance[ch];
    let baselineCount = stats.baseline.count;
    let baseline_m2 =
      baselineCount > 1 && baselineVariance !== undefined ?
      baselineVariance * (baselineCount - 1) :
      undefined;
    return {
      stats: {
        mean,
        variance,
        count,
        _m2
      },
      baseline: {
        mean: baselineMean,
        variance: baselineVariance,
        count: baselineCount,
        _m2: baseline_m2
      }
    };
  });
  Object.keys(values).forEach(key => {
    let newKey = channels[key];
    values[newKey] = values[key];
    delete values[key];
  });
  values = {
    ...values,
    times
  };
  // console.log(values)
  return values;
};

// Load the records from the server API
let loadHG = async subject => {
  let listPath = `/api/${subject}/records/HG`;
  let response = await fetch(listPath);
  let list = await response.json();
  return list;
};
let loadEP = async subject => {
  let listPath = `/api/${subject}/records/EP`;
  let response = await fetch(listPath);
  let list = await response.json();
  return list;
};

let loadSubjects = async () => {
  let listPath = `/api/subjects`;
  let response = await fetch(listPath);
  let subjects = await response.json();
  return subjects
};

export {
  loadGeometry,
  loadBrain,
  loadDots,
  loadStats,
  loadValues,
  loadEP,
  loadHG,
  loadSubjects,
  load3DBrain
};