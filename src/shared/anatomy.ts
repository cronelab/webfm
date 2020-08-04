// anatomy.ts
/**
 * This is the doc comment for shared/anatomy
 *
 * @packageDocumentation
 */

import {
  PerspectiveCamera,
  Scene,
  Color,
  WebGLRenderer,
  HemisphereLight,
  Clock,
} from "three";
import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader";
import { TrackballControls } from "../../node_modules/three/examples/jsm/controls/TrackballControls.js";
import * as d3 from "d3";
import React from "react";
/**
 * @param subject  Subject ID.
 * @returns      A promise that resolves to a base64 string representing a 2D reconstruction
 * @category Anatomy
 */

/**
 * @param subject  Subject ID.
 * @param brainContainer  HTMLElement to append the 3D scene to.
 * @returns      A promise that resolves to a 3D scene with electrodes and brain
 * @category Anatomy
 */
let fetch3DBrain = async (
  subject: string,
  brainContainer: HTMLElement
): Promise<Scene> => {
  let clock = new Clock();
  let scene = new Scene();
  scene.background = new Color(0xffffff);
  let camera = new PerspectiveCamera(
    45,
    brainContainer.offsetWidth / 600,
    1,
    1000
  );
  camera.position.z = 500;
  let renderer = new WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(brainContainer.offsetWidth, 600);
  document.body.appendChild(renderer.domElement);

  let light = new HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 0, 10);
  scene.add(light);

  let loader = new GLTFLoader();

  let fileLoader = () => {
    return new Promise((resolve, reject) => {
      loader.load(`/api/electrodes/${subject}`, (elec) => {
        loader.load(`/api/brain2/${subject}`, (brain) => {
          resolve([elec, brain]);
        });
      });
    });
  };
  let sceneObjects = await fileLoader();
  scene.add(sceneObjects[0].scene);
  scene.add(sceneObjects[1].scene);
  let controls = new TrackballControls(camera, renderer.domElement);

  controls.target.set(10, 20, 0);

  const animate = () => {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();
    //@ts-ignore
    controls.update(delta);
    renderer.render(scene, camera);
  };
  animate();
  // controls.update();
  brainContainer.appendChild(renderer.domElement);

  return scene;
};

export { fetch3DBrain };
