// import {
//   Scene,
//   PerspectiveCamera,
//   WebGLRenderer,
//   HemisphereLight
// } from "three";
const THREE = require('three')
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import FBXLoader from 'three-fbx-loader'
import OrbitControls from 'three-orbitcontrols'
let manager = new THREE.LoadingManager();

// import GLTFLoader from 'three-gltf-loader';

const fetchAndStoreBrain = async subject => {
  let storedBrain = localStorage.getItem(`brain`);
  if (JSON.parse(storedBrain) != null && storedBrain.subject == subject) {
    return storedBrain.brain;
  } else {
    localStorage.removeItem("brain");
    let response = await fetch(`/api/brain/${subject}`);
    let resType = response.headers.get("content-type");
    let brain;
    if (resType.includes("image/jpeg")) {
      let brain = await response.arrayBuffer();
      let base64Flag = "data:image/jpeg;base64,";
      let binary = "";
      let bytes = [].slice.call(new Uint8Array(brain));
      bytes.forEach(b => (binary += String.fromCharCode(b)));
      brain = base64Flag + window.btoa(binary);
      localStorage.setItem(`brain`, JSON.stringify({
        subject: subject,
        data: brain
      }));
      return brain;
    } else {
      brain = await response.text();
      localStorage.setItem(`brain`, JSON.stringify({
        subject: subject,
        data: brain
      }));
      return brain;

    }

  }
};

const fetchAndStoreGeometry = async subject => {
  let storedGeometry = localStorage.getItem(`geometry`);
  if (JSON.parse(storedGeometry) != null && storedGeometry.subject == subject) {
    return storedGeometry.geometry;
  } else {
    localStorage.removeItem("geometry");
    let response = await fetch(`/api/geometry/${subject}`);
    let geometry = await response.json();
    localStorage.setItem(`geometry`, JSON.stringify({
      subject: subject,
      data: geometry
    }));
    return geometry;
  }
};

let load3DBrain_gltf = subject => {
  let brainContainer = document.getElementById('fm-brain-3D');
  let scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  let camera = new THREE.PerspectiveCamera(45, 640 / 480, 0.1, 50000);
  let renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  let controls = new OrbitControls(camera, renderer.domElement);
  let light = new THREE.HemisphereLight(0xffffff, 0x444444);
  camera.position.set(0, 0, 0);
  renderer.setSize(640, 480);
  light.position.set(0, 0, 10);
  controls.target.set(100, 0, 0);
  controls.update();
  scene.add(light);
  let loader = new GLTFLoader()
  loader.load(`/api/${subject}/brain3D_g`, object3d => {
    scene.add(object3d.scene)
  });
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
  brainContainer.appendChild(renderer.domElement);
}

let load3DBrain = subject => {
  let brainContainer = document.getElementById('fm-brain-3D');
  let loader = new FBXLoader();
  let scene = new Scene();
  let camera = new PerspectiveCamera(45, 640 / 480, 0.1, 50000);
  let renderer = new WebGLRenderer({
    antialias: true
  });
  let controls = new OrbitControls(camera, renderer.domElement);
  let light = new HemisphereLight(0xffffff, 0x444444);
  camera.position.set(500, 1000, 500);
  renderer.setSize(640, 480);
  light.position.set(0, 0, 10);
  controls.target.set(100, 0, 0);
  controls.update();
  scene.add(light);
  loader.load(`/api/${subject}/brain3D`, object3d => {
    console.log(object3d)
    scene.add(object3d)
    object3d.traverse((child) => {
      if (child.material) {
        for (let material of child.material) {
          material.wireframe = true;
        }
      }
    });

  });
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
  brainContainer.appendChild(renderer.domElement);
}


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

export {
  fetchAndStoreBrain,
  fetchAndStoreGeometry,
  load3DBrain,
  loadValues,
  loadStats,
  load3DBrain_gltf
};