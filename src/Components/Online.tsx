import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  InputGroup,
  Button,
  FormControl
} from "../../node_modules/react-bootstrap";
import { Link } from 'react-router-dom'
import { Context } from "../Context";
import BCI2K from "bci2k";

const Online = () => {
  let { bciState, setBciState, setNewRecord, setNewSubject } = useContext(Context);
  const [showOnline, setShowOnline] = useState(false);
  const [bciAddress, setBciAddress] = useState("wss://127.0.0.1");
  let bciOperator = new BCI2K.bciOperator();
  let bciSourceConnection = new BCI2K.bciData();

  useEffect(() => {
    (async () => {
      await bciOperator.connect(bciAddress)
      setBciState("Connected");
      bciOperator.stateListen();
      bciOperator.onStateChange = e => setBciState(e);
      let subject = await bciOperator.execute(`Get Parameter SubjectName`);
      let dataFile = await bciOperator.execute(`Get Parameter DataFile`);
      setNewRecord({ name: dataFile.split("/")[1] });
      setNewSubject({ name: subject });
      bciSourceConnection.connect("ws://127.0.0.1:20100").then(() => { });
      bciSourceConnection.onReceiveBlock = () => {
      };
    })()
  }, [bciAddress]);

  return (
    <Card className="text-center">
      <Card.Header>
        <Card.Title as="h3"
          onClick={() => setShowOnline(!showOnline)}
        >
          Online
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <InputGroup className={showOnline ? "" : 'd-none'} id="online-options">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">Source</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            id="source-address"
            type="text"
            defaultValue={bciAddress}
          />
          <InputGroup.Append>
            <Button
              id="source-address-ok"
              variant="outline-secondary"
              onClick={() =>
                //@ts-ignore
                setBciAddress(document.getElementById("source-address").value)
              }
            >
              Set address
            </Button>
          </InputGroup.Append>
        </InputGroup>

        <Card.Text>{bciState}</Card.Text>
      </Card.Body>
      <Link to="/map">
        <Button
          id="map-button"
          className={bciState == "Not Connected" ? "text-center disabled" : "text-center"}>
          Map
        </Button>
      </Link>
    </Card>
  );
};
export default Online;
