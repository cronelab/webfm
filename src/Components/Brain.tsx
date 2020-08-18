// Brain.tsx
/**
 * This is the doc comment for file1.ts
 * @packageDocumentation
 */
import React, {
  useContext,
  useEffect,
  useState,
  ReactSVGElement,
  useLayoutEffect,
} from "react";
import { Context } from "../Context";
import {
  Image,
  Modal,
  Table,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

const Brain = (props) => {
  let { subject, setNewSubject }: any = useContext(Context);
  let [img, setImg] = useState<string>();
  const [size, setSize] = useState([]);
  const [modify, setModify] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useLayoutEffect(() => {
    const updateSize = () => {
      setSize([
        document.getElementById("container").offsetWidth,
        document.getElementById("container").offsetHeight,
      ]);
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  useEffect(() => {
    (async () => {
      subject.name = subject.name || "Template";
      let response11 = await fetch(`/api/geometry/${subject.name}`);
      let geometry = await response11.json();
      let response = await fetch(`/api/brain/${subject.name}`);
      let brainRes = await response.arrayBuffer();
      setNewSubject({
        name: subject.name,
        geometry,
      });
      let binary = "";
      let bytes = [].slice.call(new Uint8Array(brainRes));
      bytes.forEach((b: any) => (binary += String.fromCharCode(b)));
      setImg(binary);
    })();
  }, []);

  const ElecModal = () => {
    return (
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Dialog>
          <Modal.Header closeButton>
            <Modal.Title>Hi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* @ts-ignore */}
            {subject.geometry ? (
              <Table>
                <thead>
                  <tr>
                    <th>Electode</th>
                    <th>x</th>
                    <th>y</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(subject.geometry).map((elec) => {
                    return (
                      <tr
                        id={`${elec}_table`}
                        key={`${elec}_table`}
                        onClick={() => {
                          let table = document.getElementById(`${elec}_table`);
                          let circle = document.getElementById(
                            `${elec}_circle`
                          );
                          table.className = "table-primary";
                          circle.setAttribute("fill", "red");
                          moveElectrode(elec, circle);
                        }}
                      >
                        <td>{elec}</td>
                        <td>{subject.geometry[elec].u.toFixed(2)}</td>
                        <td>{subject.geometry[elec].v.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            ) : (
              <></>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={async () => {
                let post = await fetch(`/api/geometry/${subject.name}`, {
                  method: "PUT",
                  body: JSON.stringify(subject.geometry),
                  headers: {
                    "Content-Type": "application/json",
                  },
                });
                let text = await post.text();
                alert(text);
              }}
            >
              Save
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal>
    );
  };

  const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const moveElectrode = async (electrode, circle) => {
    await timeout(500);
    document.getElementById("container").addEventListener(
      "click",
      (e) => {
        let newX = e.offsetX;
        let newY = 1 + e.offsetY;
        let containerH = document.getElementById("container").offsetHeight;
        let containerW = document.getElementById("container").offsetWidth;
        subject.geometry[electrode].u = newX / containerW;
        subject.geometry[electrode].v = 1 - newY / containerH;
        circle.setAttribute("cx", newX);
        circle.setAttribute("cy", newY);
        circle.setAttribute("fill", "green");
      },
      { once: true }
    );
  };

  useEffect(() => {
    if (modify) {
      setShowModal(true);
      Object.keys(subject.geometry).forEach((electrode) => {
        let circle = document.getElementById(`${electrode}_circle`);
        circle.setAttribute("fill", "green");
        circle.onclick = (e) => {
          // if (selectedElectrode == electrode) {
          //   circle.setAttribute('fill', 'blue')
          // }
          // else {
          circle.setAttribute("fill", "red");
          moveElectrode(electrode, circle);
          // }
        };
      });
      setModify(false);
    }
  }, [modify]);

  return (
    <>
      <div
        style={{ position: "relative", display: "inline-block" }}
        id="container"
        onDoubleClick={(e) => {
          e.preventDefault();
          setModify(true);
        }}
      >
        <Image
          src={img ? `data:image/jpeg;base64,${window.btoa(img)}` : ""}
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            userSelect: "none",
          }}
        ></Image>
        <svg
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
          }}
        >
          {subject.geometry ? (
            //@ts-ignore
            Object.keys(subject.geometry).map((x) => {
              return (
                <OverlayTrigger
                  placement="right"
                  delay={{ show: 100, hide: 300 }}
                  overlay={
                    <Tooltip id="button-tooltip" {...props}>
                      {x}
                    </Tooltip>
                  }
                >
                  <circle
                    //@ts-ignore
                    id={`${x}_circle`}
                    key={`${x}_circle`}
                    //@ts-ignore
                    cx={
                      subject.geometry[x].u *
                      (size[0]
                        ? size[0]
                        : document.getElementById("container").offsetWidth)
                    }
                    //@ts-ignore
                    cy={
                      (1 - subject.geometry[x].v) *
                      (size[1]
                        ? size[1]
                        : document.getElementById("container").offsetHeight)
                    }
                    fill="white"
                    r="3"
                  ></circle>
                </OverlayTrigger>
              );
            })
          ) : (
            <circle></circle>
          )}
        </svg>
      </div>
      <ElecModal></ElecModal>
    </>
  );
};

export default Brain;
