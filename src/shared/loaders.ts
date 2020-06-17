import * as THREE from "../../node_modules/three/src/Three";
import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "../../node_modules/three/examples/jsm/controls/OrbitControls";

const fetchAndStoreBrain = async (subject: any) => {
  let response = await fetch(`/api/brain/${subject}`);
  let brainRes = await response.arrayBuffer();
  let base64Flag = "data:image/jpeg;base64,";
  let binary = "";
  let bytes = [].slice.call(new Uint8Array(brainRes));
  bytes.forEach((b: any) => (binary += String.fromCharCode(b)));
  return base64Flag + window.btoa(binary);
};

const fetchAndStoreGeometry = async (subject: any) => {
  let response = await fetch(`/api/geometry/${subject}`);
  let geometry = await response.json();
  return geometry;
};

let load3DBrain_gltf = (subject: any, brainContainer: any) => {
  return new Promise((resolve, reject) => {
    let brainContainer = document.getElementById("fm-brain-3D");
    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    let camera = new THREE.PerspectiveCamera(45, 640 / 480, 0.1, 5000);
    let renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    let controls = new OrbitControls(camera, renderer.domElement);
    let light = new THREE.HemisphereLight(0xffffff, 0x444444);
    camera.position.set(-100, 0, -100);
    renderer.setSize(640, 480);
    light.position.set(0, 0, 10);
    controls.target.set(10, 20, 0);
    controls.update();
    scene.add(light);
    let loader = new GLTFLoader();
    loader.load(subject, (object3d: any) => {
      // loader.load(`/api/${subject}/brain3D_g`, object3d => {
      scene.add(object3d.scene);
      let mainScene = scene.getObjectByName("Scene");
      //@ts-ignore
      mainScene.rotation.set(-Math.PI / 2, 0, 0);
      resolve(scene);
    });
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    //@ts-ignore

    brainContainer.appendChild(renderer.domElement);
  });
};

let loadValues = async (subject: any, record: any) => {
  let valuePath = `api/${subject}/${record}/values`;
  let timePath = `api/${subject}/${record}/times`;
  const valueResponse = await fetch(valuePath);
  const values = await valueResponse.json();
  const timeResponse = await fetch(timePath);
  const times = await timeResponse.json();
  let channels = Object.keys(values);
  return {
    ...values,
    times,
  };
};

let loadStats = async (subject: any, record: any) => {
  let statPath = `api/${subject}/${record}/stats`;
  let timePath = `api/${subject}/${record}/times`;

  const statResponse = await fetch(statPath);
  const stats = await statResponse.json();
  const timeResponse = await fetch(timePath);
  const times: any = await timeResponse.json();
  let channels = Object.keys(stats.estimators.mean);
  let distributions = stats.distributions;
  let values = channels.map((ch) => {
    let mean = stats.estimators.mean[ch];
    let variance = stats.estimators.variance[ch];
    let count = stats.estimators.count;

    let _m2 = mean.map((d: any, i: any) => {
      return count[i] > 1 && variance[i] !== undefined
        ? variance[i] * (count[i] - 1)
        : undefined;
    });
    let baselineMean = stats.baseline.mean[ch];
    let baselineVariance = stats.baseline.variance[ch];
    let baselineCount = stats.baseline.count;
    let baseline_m2 =
      baselineCount > 1 && baselineVariance !== undefined
        ? baselineVariance * (baselineCount - 1)
        : undefined;
    return {
      stats: {
        mean,
        variance,
        count,
        _m2,
      },
      baseline: {
        mean: baselineMean,
        variance: baselineVariance,
        count: baselineCount,
        _m2: baseline_m2,
      },
    };
  });
  Object.keys(values).forEach((key: any) => {
    let newKey: any = channels[key];
    values[newKey] = values[key];
    delete values[key];
  });
  values = {
    ...values,
    // times
  };
  // console.log(values)
  return values;
};

export {
  fetchAndStoreBrain,
  fetchAndStoreGeometry,
  loadValues,
  loadStats,
  load3DBrain_gltf,
};
