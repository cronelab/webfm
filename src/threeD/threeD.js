import * as THREE from "three";
var OrbitControls = require("three-orbit-controls")(THREE);
import shape from "./pial_elecs.fbx";
import "bootstrap";
import "./FBXLoader.js";
self.Zlib = require("zlibjs/bin/zlib.min.js").Zlib;

// let remoteFileIndex = String(shape).indexOf("dist");
// let remoteFile = String(shape).substring(remoteFileIndex + 4);

var controls;
var camera, scene, renderer, light;

export default () => {
  let brainContainer = document.getElementById("fm-brain-container");
  camera = new THREE.PerspectiveCamera(45, 640 / 480, 0.1, 30000);
  camera.position.set(500, 1000, 500);

  scene = new THREE.Scene();

  light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

    new THREE.FBXLoader().load('/3Dbrain', object => {
      console.log(object);
      scene.add(object);
  
  })


  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.domElement.id = "fm-brain-3D";

  brainContainer.appendChild(renderer.domElement);

  renderer.setSize(brainContainer.offsetWidth, brainContainer.offsetHeight);
  camera.aspect = brainContainer.offsetWidth / brainContainer.offsetHeight;
  camera.updateProjectionMatrix();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(100, 0, 0);
  controls.update();
  window.addEventListener("resize", onWindowResize, false);
  renderer.domElement.classList.add("d-none");

  animate();
};
function onWindowResize() {
  let brainContainer = document.getElementById("fm-brain-container");
  renderer.setSize(brainContainer.offsetWidth, brainContainer.offsetHeight);
  camera.aspect = brainContainer.offsetWidth / brainContainer.offsetHeight;
  camera.updateProjectionMatrix();
}

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};
