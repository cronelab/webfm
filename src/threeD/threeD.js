import * as THREE from "three";
var OrbitControls = require("three-orbit-controls")(THREE);
import "bootstrap";
import "./FBXLoader.js";
self.Zlib = require("zlibjs/bin/zlib.min.js").Zlib;

// let remoteFileIndex = String(shape).indexOf("dist");
// let remoteFile = String(shape).substring(remoteFileIndex + 4);

var controls;
var camera, scene, renderer, light;

export default (subject) => {
  let brainContainer = document.getElementById("fm-brain-container2");
  camera = new THREE.PerspectiveCamera(45, 640 / 480, 0.1, 30000);
  camera.position.set(500, 1000, 500);

  scene = new THREE.Scene();

  light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

    new THREE.FBXLoader().load(`/3Dbrain/${subject}`, object => {
      console.log(object);
      scene.add(object);
  
  })


  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.domElement.id = "threeD";

  brainContainer.appendChild(renderer.domElement);

  renderer.setSize(brainContainer.offsetWidth, brainContainer.offsetHeight);
  camera.aspect = brainContainer.offsetWidth / brainContainer.offsetHeight;
  camera.updateProjectionMatrix();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(100, 0, 0);
  controls.update();
  window.addEventListener("resize", onWindowResize, false);
  // renderer.domElement.classList.add("d-none");

  animate();
};
function onWindowResize() {
  let brainContainer = document.getElementById("fm-brain-container2");
  renderer.setSize(brainContainer.offsetWidth, brainContainer.offsetHeight);
  camera.aspect = brainContainer.offsetWidth / brainContainer.offsetHeight;
  camera.updateProjectionMatrix();
}

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};


/* 
  If still using Unity at the end of all this:

  update: function( newData ) {
        if ( newData !== undefined ) {
          this.data = newData;
        }

        if(gameInstance != null){

          var keyNames = Object.keys(this.data);
          var size = Object.keys(this.data).length;
          for (var i = 0; i < size; i++) {
            if(keyNames[i] != undefined)
            {
              if(document.title == "WebFM: Live"){
                // for pete's sake, find a better way to threshold
                if(eval("this.data."+keyNames[i]) > 10){
                  gameInstance.SendMessage(keyNames[i], "activityChanger", eval("this.data."+keyNames[i]));
                }
                else
                {
                  gameInstance.SendMessage(keyNames[i], "activityChanger", 0.0);
                }
              }
              else{
                gameInstance.SendMessage(keyNames[i], "activityChanger", eval("this.data."+keyNames[i]));
              }
            }
          }
        }

    }

*/