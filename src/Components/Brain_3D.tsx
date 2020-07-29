//@ts-nocheck
import React, { useEffect, useState } from "react";
import {
  Group,
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  Vector3,
  Line,
  LineBasicMaterial,
  SphereGeometry,
  MeshBasicMaterial,
  Geometry,
} from "../../node_modules/three/src/Three";
import { OrbitControls } from "../../node_modules/three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader";
import { LineGeometry } from "../../node_modules/three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "../../node_modules/three/examples/jsm/lines/LineMaterial";
import { Line2 } from "../../node_modules/three/examples/jsm/lines/Line2";
import { TrackballControls } from "../../node_modules/three/examples/jsm/controls/TrackballControls.js";

import { selectAll, mouse, select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import Slider from "react-input-slider";
import { Container, Row, Col } from "../../node_modules/react-bootstrap";
import fmdata from "../shared/fmdata";
import { extent } from "d3-array";

const Brain_3 = (props) => {
  const [isPaused, setIsPaused] = useState(false);
  const [brainScene, setBrainScene] = useState();
  const [threeDCoords, setThreeDCoords] = useState();
  const [stimulatingElectrodes, setStimulatingElectrodes] = useState();
  const [gyriState, setGyriState] = useState(100);
  const [wmState, setWmState] = useState(100);
  const [subStructState, setSubStructState] = useState(100);
  const [zScores, setZScores] = useState([]);
  const [times, setTimes] = useState();
  const [taskData, setTaskData] = useState();
  let fmChildren;

  const sleep = (m) => new Promise((r) => setTimeout(r, m));
  const [colors, setColors] = useState([
    "#313695",
    "#4575b4",
    "#74add1",
    "#abd9e9",
    "#000000",
    "#fee090",
    "#fdae61",
    "#f46d43",
    "#d73027",
  ]);
  let lineGroup = new Group();
  lineGroup.name = "cortstimLine";
  let dotColorScale = scaleLinear()
    //@ts-ignore
    .domain([-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9])
    //@ts-ignore
    .range(colors)
    .clamp(true);

  useEffect(() => {
    var urlParams = new URLSearchParams(window.location.search);

    let recordType = urlParams.get("type");
    let recordName = urlParams.get("record");
    let subjectName = urlParams.get("subject");
    (async () => {
      if (recordType == "EP") {
        let fetchRoute = `/api/data/${subjectName}/${recordName}/${recordType}`;
        let response = await fetch(fetchRoute);
        let respData = await response.json();
        let zs = Object.keys(respData).map((chan) => {
          return {
            name: chan,
            zScore: respData[chan].zscores[1],
          };
        });
        setZScores(zs);
      }
      if (recordType == "HG") {
        let fetchRoute = `/api/data/${subjectName}/${recordName}/${recordType}`;
        let dataset = new fmdata();
        let response = await fetch(fetchRoute);
        let data = await response.json();
        await dataset.get(data);
        let dataTime = data.contents.times;
        setTimes(dataTime);
        // 	let cortstimReq = await fetch(`/api/data/${subjectName}/cortstim`)
        // 	let cortStimRes = await cortstimReq.json()
        // 	let actualData = Object.keys(cortStimRes).map(entry => {
        // 		if (cortStimRes[entry].Result != null) {
        // 			return {
        // 				channel: entry,
        // 				color: cortStimRes[entry].Color,
        // 				result: [...cortStimRes[entry].Result, "All"]
        // 			}
        // 		}
        // 		else {
        // 			return {
        // 				channel: entry,
        // 				color: cortStimRes[entry].Color,
        // 				result: ["All"]
        // 			}
        // 		}
        // 	})
        // 	setTaskData(actualData)
      }
      let brainContainer = document.getElementById("brain3D");

      let scene = new Scene();
      scene.background = new Color(0xffffff);
      let camera = new PerspectiveCamera(30, 960 / 720, 0.1, 5000);
			camera.position.z = 500;
      let renderer = new WebGLRenderer({
        antialias: true,
      });
			renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(960, 720);
			document.body.appendChild(renderer.domElement);

      let controls = new TrackballControls(camera, renderer.domElement);
      let light = new HemisphereLight(0xffffff, 0x444444);

      light.position.set(0, 0, 10);
      // controls.target.set(10, 20, 0);
      // controls.autoRotate = false;
			controls.target.set(10, 20, 0);

      scene.add(light);
      let loader = new GLTFLoader();
      //@ts-ignore
      await sleep(1000);
      let elecs;
      loader.load(`/api/electrodes/${subjectName}`, object3d => {
				elecs = object3d.scene;
				scene.add(object3d.scene);

			})
			loader.load(`/api/brain2/${subjectName}`, (object3d) => {
				scene.add(object3d.scene);
				// scene.rotateY(90)
				// scene.rotateX(45)
				setBrainScene(scene);
				console.log(scene)
				setThreeDCoords(elecs.children);

			});
      // loader.load(`/api/${props.subject}/brain3D_g`, (object3d: any) => {
      //   scene.add(object3d.scene);
      //   object3d.scene.rotation.set(-Math.PI / 2, 0, 0);
      //   object3d.scene.position.set(0, 10, 0);
      //   object3d.scene.scale.set(0.5, 0.5, 0.5);
      //   let elecs = scene.getObjectByName("Electrodes");
      //   let gyri = scene.getObjectByName("Brain");
      //   elecs.rotation.set(0, 0, Math.PI);
      //   elecs.position.set(128, 128, 128);
      //   setBrainScene(scene);
      //   setThreeDCoords(elecs.children);

      //   //@ts-ignore
      //   let gyriMaterial = scene.getObjectByName("Left-Amygdala").material;
      //   elecs.traverse((child) => {
      //     if (child.type == "Mesh") {
      //       //@ts-ignore
      //       child.material = gyriMaterial;
      //       //@ts-ignore
      //       child.material.color = new Color("rgb(192,192,192)");
      //     }
      //   });
      // });

      const animate = () => {
        renderer.render(scene, camera);
        controls.update();

        requestAnimationFrame(animate);
      };
      animate();
      brainContainer.appendChild(renderer.domElement);
    })();
  }, []);

  useEffect(() => {
    if (brainScene) {
      let object = brainScene.getObjectByName("Gyri");
      object.visible = true;
      if (gyriState == 0) {
        object.visible = false;
      } else {
        object.visible = true;
      }
      object.traverse((child) => {
        if (child.type == "Mesh") {
          child.material.opacity = gyriState / 100;
          child.material.transparent = true;
        }
      });
    }
  }, [gyriState]);

  const selectTask = (task) => {
    let oldLines = brainScene.getObjectByName("cortstimLine");
    if (oldLines != undefined) {
      let childrenNum = oldLines.children.length;
      for (let i = 0; i < childrenNum; i++) {
        oldLines.remove(oldLines.children[0]);
      }
    }
    taskData.forEach((entry) => {
      let result = entry.result.filter((t) => t == task);
      if (result.length > 0) {
        let lineGeom = new LineGeometry();
        let chan1 = entry.channel.split("_")[0];
        let chan2 = entry.channel.split("_")[1];
        let stimElec1 = brainScene.getObjectByName(chan1);
        let stimElec2 = brainScene.getObjectByName(chan2);
        brainScene.updateMatrixWorld();
        var vector1 = new Vector3();
        var vector2 = new Vector3();
        let elec1Pos = vector1.setFromMatrixPosition(stimElec1.matrixWorld);
        let elec2Pos = vector2.setFromMatrixPosition(stimElec2.matrixWorld);
        lineGeom.setPositions([
          elec1Pos.x,
          elec1Pos.y,
          elec1Pos.z,
          elec2Pos.x,
          elec2Pos.y,
          elec2Pos.z,
        ]);
        let material = new LineMaterial({
          color: entry.color,
          linewidth: 0.01,
        });

        let line = new Line2(lineGeom, material);
        // line.computeLineDistances();
        line.scale.set(1, 1, 1);
        lineGroup.add(line);
        // console.log(lineGroup)
      }
    });
    brainScene.add(lineGroup);
  };

  useEffect(() => {
    if (brainScene) {
      let object = brainScene.getObjectByName("WhiteMatter");
      let gyri = brainScene.getObjectByName("Gyri");
      gyri.visible = false;
      if (wmState == 0) {
        object.visible = false;
      } else {
        object.visible = true;
      }
      object.traverse((child) => {
        if (child.type == "Mesh") {
          child.material.opacity = wmState / 100;
          child.material.transparent = true;
        }
      });
    }
  }, [wmState]);

  useEffect(() => {
    if (brainScene) {
      let object = brainScene.getObjectByName("Brain");
      if (subStructState == 0) {
        object.visible = false;
      } else {
        object.visible = true;
      }
      object.traverse((child) => {
        if (child.type == "Mesh") {
          child.material.opacity = subStructState / 100;
          child.material.transparent = true;
        }
      });
      let electrodes = brainScene.getObjectByName("Electrodes");
      electrodes.traverse((child) => {
        if (child.type == "Mesh") {
          child.material.opacity = 100;
        }
      });
    }
  }, [subStructState]);

  useEffect(() => {
    var urlParams = new URLSearchParams(window.location.search);
    let recordType = urlParams.get("type");

    if (recordType == "HG" && threeDCoords) {
      let locked = false;

      let fm = document.getElementById("fm");
      let x = scaleLinear().domain(extent(times)).range([0, fm.offsetWidth]);

      selectAll(".fm-horizon").on("click", (d, i, node) => {
        locked = !locked;
      });

      const cursorLineMover = (position) => {
        if (!locked) {
          select(".cursorLine")
            .attr("x1", position)
            .attr("y1", 0)
            .attr("x2", position)
            .attr("y2", fm.offsetHeight);
        }
      };
      const lineAndDotUpdate = (position) => {
        cursorLineMover(position);
        dotUpdator(position);
      };
      document.getElementById("dataTimer").onclick = async () => {
        let nodes = document.getElementsByClassName("fm-horizon");
        let firstHorizon = nodes[0];
        //@ts-ignore
        for (let i = 350; i < firstHorizon.offsetWidth; i++) {
          await sleep(1);
          lineAndDotUpdate(i);
          //@ts-ignore
          document.getElementById("dataTimer").innerHTML = `${times[
            Math.floor((i / firstHorizon.offsetWidth) * times.length)
          ].toFixed(3)}s`;
        }
      };

      selectAll(".fm-horizon").on("mousemove", (d, i, nodes) => {
        if (!locked) {
          let firstHorizon = document.getElementsByClassName("fm-horizon")[0];
          //@ts-ignore
          let position = mouse(firstHorizon)[0];
          lineAndDotUpdate(position);
        }
      });
    }
    if (recordType == "EP" && threeDCoords) {
      let recordName = document
        .getElementById("navbar_subject")
        .innerText.split(":")[1]
        .split("_");
      setStimulatingElectrodes([recordName[0], recordName[1]]);

      let stimElec1 = brainScene.getObjectByName(recordName[0].trim());
      let stimElec2 = brainScene.getObjectByName(recordName[1].trim());
      let material = new MeshBasicMaterial({ color: 0xff0000 });
      stimElec1.scale.set(2, 2, 2);
      stimElec2.scale.set(2, 2, 2);
      stimElec1.material = material;
      stimElec2.material = material;

      let zScoreVals = zScores.map((zS) => {
        return zS.zScore;
      });
      zScores.forEach((elec, i) => {
        let electrodes = brainScene.getObjectByName("Electrodes");
        electrodes.traverse((electrode) => {
          if (electrode.name == elec.name) {
            electrode.material = new MeshBasicMaterial({ color: 0x00ff00 });
            electrode.material.color.setHSL(
              zScoreVals[i] / Math.max(...zScoreVals),
              1,
              0.5
            );

            let geometry = new Geometry();
            geometry.vertices.push(new Vector3(0, 0, 0));

            let x =
              electrode.getWorldPosition().x - stimElec1.getWorldPosition().x;
            let y =
              electrode.getWorldPosition().y - stimElec1.getWorldPosition().y;
            let z =
              electrode.getWorldPosition().z - stimElec1.getWorldPosition().z;
            geometry.vertices.push(new Vector3(x, y, z));
            let material = new LineBasicMaterial({ color: 0x0000ff });
            // material.color.setHSL(1, 1, .5)
            material.color.setHSL(
              zScoreVals[i] / Math.max(...zScoreVals),
              1,
              0.5
            );
            let line = new Line(geometry, material);
            brainScene.add(line);
            stimElec1.getWorldPosition(line.position);
          }
        });
      });

      let fm = document.getElementById("fm");

      fmChildren = fm.children;
      if (fmChildren.length > 0) {
        Array.from(fmChildren).forEach((svg) => {
          //@ts-ignore
          svg.addEventListener("mouseenter", (ev) => {
            let electrodeHoveredOver = ev.target["id"].split("_")[0];
            threeDCoords.forEach((elec) => {
              if (elec.name == electrodeHoveredOver) {
                elec.scale.x = 5;
                elec.scale.y = 5;
                elec.scale.z = 5;
                var color = new Color(0x0000ff);
                elec.material.color = color;
              }
            });
          });
          //@ts-ignore
          svg.addEventListener("mouseout", (ev) => {
            let electrodeHoveredOver = ev.target["id"].split("_")[0];
            threeDCoords.forEach((elec) => {
              if (elec.name == electrodeHoveredOver) {
                elec.scale.x = 1;
                elec.scale.y = 1;
                elec.scale.z = 1;
                var color = new Color(0x00ff00);
                elec.material.color = color;
              }
            });
          });
        });
      }
    }
    if (threeDCoords) {
      let object = brainScene.getObjectByName("Electrodes");
      //@ts-ignore
      object.traverse((child) => {
        if (child.type == "Mesh") {
          child.geometry = new SphereGeometry(
            1,
            32,
            32,
            0,
            Math.PI * 2,
            0,
            Math.PI
          );
        }
      });
      let object2 = brainScene.getObjectByName("Gyri") || null;
      //@ts-ignore
      object2.traverse((child) => {
        if (child.type == "Mesh") {
          var color = new Color(0xdcdcdc);
          child.material.color = color;
        }
      });
      if (recordType == "HG") {
      }
    }
  }, [threeDCoords]);
  //@ts-ignore

  // document.getElementById('dataTimer').onclick = () => {
  // 	selectTask("All")
  // }
  //@ts-ignore

  const dotUpdator = (position) => {
    let nodes = document.getElementsByClassName("fm-horizon");
    let firstHorizon = nodes[0];

    // @ts-ignore
    [...nodes].map((node, _i) => {
      // @ts-ignore
      let electrode = brainScene.getObjectByName(node.id.split("_")[0]);
      // @ts-ignore
      let zedIndex = Math.floor(
        position / (firstHorizon.offsetWidth / times.length)
      );
      // @ts-ignore
      document.getElementById("dataTimer").innerHTML = times[zedIndex].toFixed(
        3
      );

      if (electrode) {
        // @ts-ignore
        let rasterValue = node.__data__[zedIndex] * 1.5;
        let newMaterial = electrode.material.clone();
        if (rasterValue != 0) {
          electrode.scale.set(
            Math.abs(rasterValue) + 1,
            Math.abs(rasterValue) + 1,
            Math.abs(rasterValue) + 1
          );
          newMaterial.color = new Color(dotColorScale(rasterValue * 2));
        } else {
          electrode.scale.set(1, 1, 1);

          newMaterial.color = new Color("rgb(192,192,192)");
        }
        electrode.material = newMaterial;
      }
    });
  };

  return (
    <div>
      <Container fluid>
        <Row>
          <Col sm={10}>
            <div id="brain3D" />
            <Row>
              <Col>
                <Slider
                  axis="x"
                  x={gyriState}
                  onChange={({ x }) => setGyriState((state) => x)}
                />{" "}
                Gyri
              </Col>
            </Row>
            <Row>
              <Col>
                <Slider
                  axis="x"
                  x={wmState}
                  onChange={({ x }) => setWmState((state) => x)}
                />{" "}
                White Matter
              </Col>
            </Row>
            <Row>
              <Col>
                <Slider
                  axis="x"
                  x={subStructState}
                  onChange={({ x }) => setSubStructState((state) => x)}
                />{" "}
                Subcortical structures
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
export const Brain_3D = React.memo(Brain_3);
