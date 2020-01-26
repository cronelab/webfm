import React, { useEffect, useRef, useContext, useState } from 'react'
import * as THREE from "../../node_modules/three/src/Three";
import { OrbitControls } from "../../node_modules/three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader';
import { Button } from '../../node_modules/react-bootstrap'
import { Object3D } from '../../node_modules/three/src/Three';

const Brain_3 = (props) => {
	const [brainScene, setBrainScene] = useState();
	const [threeDCoords, setThreeDCoords] = useState();;
	useEffect(() => {
		(async () => {
			let brainContainer = document.getElementById('brain3D');

			let scene = new THREE.Scene();
			scene.background = new THREE.Color(0xffffff);
			let camera = new THREE.PerspectiveCamera(45, 640 / 480, .1, 5000);
			let renderer = new THREE.WebGLRenderer({
				antialias: true
			})
			let controls = new OrbitControls(camera, renderer.domElement);
			let light = new THREE.HemisphereLight(0xffffff, 0x444444);
			camera.position.set(-100, 0, -100);
			renderer.setSize(640, 480);
			light.position.set(0, 0, 10)
			controls.target.set(10, 20, 0);
			controls.update()
			scene.add(light);
			let loader = new GLTFLoader();
			//@ts-ignore
			loader.load(`/api/${props.subject}/brain3D_g`, (object3d: any) => {
				scene.add(object3d.scene);
				let elecs = scene.getObjectByName("Electrodes");
				setThreeDCoords(elecs.children);
				object3d.scene.rotation.set(-Math.PI / 2, 0, 0);
				elecs.rotation.set(0, 0, Math.PI)
				elecs.position.set(128, 128, 128)
				setBrainScene(scene);
				//@ts-ignore
			})
			const animate = () => {
				requestAnimationFrame(animate);
				renderer.render(scene, camera);
			};
			animate();
			brainContainer.appendChild(renderer.domElement);
			// props.setScene(scene)

		})()
	}, [])

	const setTransparency = struct => {
		props.setScene(brainScene)

		let object = brainScene.getObjectByName(struct);
		let visibility = object.visible;
		object.visible = !visibility;
		console.log(brainScene.getObjectByName("LAM5"))
		//@ts-ignore
		// console.log(Object3D.getObjectByName("LAM6"))
		// console.log(props.activity)
	}

	return (
		<div>
			<div id="brain3D" />
			<Button
				onClick={() => setTransparency("Gyri")}>
				Gyri
			</Button>
			<Button
				onClick={() => setTransparency("WhiteMatter")}>
				White Matter
			</Button>
			<Button
				onClick={() => setTransparency("Brain")}>
				Subcortical
			</Button>
			<Button
				onClick={() => setTransparency("Electrodes")}>
				Electrodes
			</Button>

		</div>
	)
}
export const Brain_3D = React.memo(Brain_3);
