import React, { useEffect, useState } from 'react'
import "bootstrap";
import "./index.scss";
import * as dat from 'dat.gui';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Col, Row, Container } from '../../node_modules/react-bootstrap'
import {
	//@ts-ignore
	VolumeLoader, stackHelperFactory,
	//@ts-ignore
	trackballOrthoControlFactory, orthographicCameraFactory, trackballControlFactory, UtilsCore
} from 'ami.js';
const StackHelper = stackHelperFactory(THREE);
const CamerasOrthographic = orthographicCameraFactory(THREE);
const ControlsOrthographic = trackballOrthoControlFactory(THREE);
const ControlsTrackball = trackballControlFactory(THREE);
let lut;
let ready = false;
let elecs;
let brainScene, wm, gyri, substructures;



const Reconstruction = () => {

	const [nifti, setNifti] = useState();
	const [glb, setGlb] = useState();

	useEffect(() => {
		(async () => {
			let res = await fetch(`/api/PY20N002/nifti`)
			let brain = await res.blob()
			setNifti(URL.createObjectURL(brain))
		})()
	})

	const r0 = {
		domId: 'r0',
		domElement: null,
		renderer: null,
		color: 0x212121,
		targetID: 0,
		camera: null,
		controls: null,
		scene: null,
		light: null,
	};

	// 2d axial renderer
	const r1 = {
		domId: 'r1',
		domElement: null,
		renderer: null,
		color: 0x121212,
		sliceOrientation: 'axial',
		sliceColor: 0xff1744,
		targetID: 1,
		camera: null,
		controls: null,
		scene: null,
		light: null,
		stackHelper: null,
	};

	let data = []

	let sceneClip = new THREE.Scene();
	let clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);



	const initHelpersStack = (rendererObj, stack) => {
		rendererObj.stackHelper = new StackHelper(stack);

		console.log(rendererObj.domElement)
		rendererObj.stackHelper.bbox.visible = false;
		rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
		rendererObj.stackHelper._slice.borderColor = 0x000000;
		// rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
		// rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;

		// set camera
		let worldbb = stack.worldBoundingBox();
		let lpsDims = new THREE.Vector3(
			(worldbb[1] - worldbb[0]) / 2,
			(worldbb[3] - worldbb[2]) / 2,
			(worldbb[5] - worldbb[4]) / 2
		);

		// box: {halfDimensions, center}
		let box = {
			center: stack.worldCenter().clone(),
			halfDimensions: new THREE.Vector3(lpsDims.x + 50, lpsDims.y + 50, lpsDims.z + 50),
		};

		// init and zoom
		let canvas = {
			width: rendererObj.domElement.clientWidth,
			height: rendererObj.domElement.clientHeight,
		};

		rendererObj.camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
		rendererObj.camera.box = box;
		rendererObj.camera.canvas = canvas;
		rendererObj.camera.orientation = rendererObj.sliceOrientation;
		rendererObj.camera.update();
		rendererObj.camera.fitBox(2, 1);

		rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
		rendererObj.stackHelper.index = Math.floor(rendererObj.stackHelper.orientationMaxIndex / 2);
		rendererObj.scene.add(rendererObj.stackHelper);

	}

	const animate = () => {

		r0.controls.update();
		r1.controls.update();

		r0.light.position.copy(r0.camera.position);
		r0.renderer.render(r0.scene, r0.camera);

		r1.renderer.clear();
		r1.renderer.render(r1.scene, r1.camera);
		r1.renderer.clearDepth();
		data.forEach(object => {
			object.materialFront.clippingPlanes = [clipPlane1];
			object.materialBack.clippingPlanes = [clipPlane1];
		});
		r1.renderer.render(sceneClip, r1.camera);
		r1.renderer.clearDepth();
		requestAnimationFrame(() => animate());
	}
	const initRenderer3D = (renderObj) => {
		// renderer
		renderObj.domElement = document.getElementById(renderObj.domId);
		renderObj.renderer = new THREE.WebGLRenderer({
			antialias: true,
		});

		renderObj.renderer.setSize(renderObj.domElement.clientWidth, renderObj.domElement.clientHeight);
		renderObj.renderer.setClearColor(renderObj.color, 1);
		renderObj.renderer.domElement.id = renderObj.targetID;
		renderObj.domElement.appendChild(renderObj.renderer.domElement);

		// camera
		renderObj.camera = new THREE.PerspectiveCamera(
			45,
			renderObj.domElement.clientWidth / renderObj.domElement.clientHeight,
			0.1,
			100000
		);
		renderObj.camera.position.x = 250;
		renderObj.camera.position.y = 250;
		renderObj.camera.position.z = 250;

		// controls
		renderObj.controls = new ControlsTrackball(renderObj.camera, renderObj.domElement);
		renderObj.controls.rotateSpeed = 5.5;
		renderObj.controls.zoomSpeed = 1.2;
		renderObj.controls.panSpeed = 0.8;
		renderObj.controls.staticMoving = true;
		renderObj.controls.dynamicDampingFactor = 0.3;

		renderObj.scene = new THREE.Scene();

		renderObj.light = new THREE.DirectionalLight(0xffffff, 1);
		renderObj.light.position.copy(renderObj.camera.position);
		renderObj.scene.add(renderObj.light);
	}

	const initRenderer2D = (rendererObj) => {
		// renderer
		rendererObj.domElement = document.getElementById(rendererObj.domId);
		rendererObj.renderer = new THREE.WebGLRenderer({
			antialias: true,
		});
		rendererObj.renderer.autoClear = false;
		rendererObj.renderer.localClippingEnabled = true;
		rendererObj.renderer.setSize(
			rendererObj.domElement.clientWidth,
			rendererObj.domElement.clientHeight
		);
		rendererObj.renderer.setClearColor(0x121212, 1);
		rendererObj.renderer.domElement.id = rendererObj.targetID;
		rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

		// camera
		rendererObj.camera = new CamerasOrthographic(
			rendererObj.domElement.clientWidth / -2,
			rendererObj.domElement.clientWidth / 2,
			rendererObj.domElement.clientHeight / 2,
			rendererObj.domElement.clientHeight / -2,
			1,
			1000
		);

		// controls
		rendererObj.controls = new ControlsOrthographic(rendererObj.camera, rendererObj.domElement);
		rendererObj.controls.staticMoving = true;
		rendererObj.controls.noRotate = true;
		rendererObj.camera.controls = rendererObj.controls;

		// scene
		rendererObj.scene = new THREE.Scene();
	}
	//GUI
	useEffect(() => {
		let gui = new dat.GUI({
			autoPlace: false,
		});

		let customContainer = document.getElementById('my-gui-container');
		customContainer.appendChild(gui.domElement);

		//@ts-ignore
		let stackFolder = gui.addFolder('Slicer');
		//@ts-ignore
		let electrodeMenu = gui.addFolder('Electrodes');


		initRenderer3D(r0);
		console.log(r0)
		initRenderer2D(r1);

		animate()



		const onRedChanged = () => console.log("A")
		// const onRedChanged = () => updateClipPlane(r1, clipPlane1)

		const onScroll = (event) => {
			const id = event.target.domElement.id;
			let stackHelper = null;
			switch (id) {
				case 'r1':
					stackHelper = r1.stackHelper;
					break;
			}
			if (event.delta > 0) {
				if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) return false;
				stackHelper.index += 1;
			} else {
				if (stackHelper.index <= 0) return false;
				stackHelper.index -= 1;
			}
			onRedChanged();
		}
		r1.controls.addEventListener('OnScroll', onScroll);

		const clickedObj = (event) => {

			const raycaster = new THREE.Raycaster();
			//@ts-ignore
			const canvas = event.target.parentElement;
			const mouse = {
				x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
				y: -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
			};
			let myMouse = new THREE.Vector2();
			myMouse.x = ( event.clientX /  canvas.clientWidth) * 2 - 1;
			myMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
			//@ts-ignore
			raycaster.setFromCamera(myMouse, r0.camera);
			//@ts-ignore
			const gyriIntersects = raycaster.intersectObjects(r0.scene.getObjectByName("Gyri").children, true);
			if(gyriIntersects.length > 0){
			//@ts-ignore
				// intersects[0].object.material.color = new THREE.Color('rgb(1,1,1)')
				gyriIntersects[0].object.visible = false
			}
			//@ts-ignore
			const subIntersects = raycaster.intersectObjects(r0.scene.getObjectByName("Brain").children, true);
			if(subIntersects.length > 0){
			//@ts-ignore
				// intersects[0].object.material.color = new THREE.Color('rgb(1,1,1)')
				subIntersects[0].object.visible = false
			}

			// console.log(r0.scene.children[1])
	}
		r0.domElement.addEventListener('click', clickedObj);








		let load3DBrain_gltf = () => {
			return new Promise((resolve, reject) => {
				let loader = new GLTFLoader()
				//@ts-ignore
				loader.load(`/api/PY20N002/brain3D_g`, object3d => {
					object3d.scene.rotation.set(0, 0, Math.PI)
					r0.scene.add(object3d.scene);
					brainScene = object3d.scene
					wm = brainScene.children[3]
					gyri = brainScene.children[2]
					substructures = brainScene.children[1]
					elecs = object3d.scene.children[0]
					elecs.rotation.set(0, 0, Math.PI)
					elecs.position.set(128, 128, 128)
	wm.visible = false;		

					resolve(brainScene);
				})

			})
		}
		load3DBrain_gltf()

	}, [])

	useEffect(() => {
		if (nifti) {
			let loader = new VolumeLoader();
			loader.load(nifti)
				.then(() => {
					let series = loader.data[0].mergeSeries(loader.data)[0];
					loader.free();
					loader = null;
					let stack = series.stack[0];
					stack._frame.forEach(frame => frame._imagePosition = [-128, 128, 128])

					stack.prepare();
					// center 3d camera/control on the stack
					let centerLPS = stack.worldCenter();
					// r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
					// r0.camera.updateProjectionMatrix();
					// r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

					// initHelpersStack(r1, stack);
					// r0.scene.add(r1.scene);
				})

		}

	}, [nifti])

	return (
		<Container fluid style={{ "height": "100%" }}>
			<div id="my-gui-container"></div>
			<Row id="main">
				<Col md={7} id="r0" ></Col>
				<Col md={5} id="slices">
					<Row className="renderer" id="r1" ></Row>
					<Row className="renderer" id="r2" ></Row>
					<Row className="renderer" id="r3" ></Row>
				</Col>
			</Row>
		</Container>
	)
}

export default Reconstruction;