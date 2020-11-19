{/* <Col>
<Dropdown>
  <Dropdown.Toggle variant="success" id="dropdown-basic">
    CCSR
  </Dropdown.Toggle>

  <Dropdown.Menu>
    {records ? (
      records.CCSR.map((ccsr) => {
        return (
          <Dropdown.Item 
          onClick={async () => {
             
              let res = await fetch(
                `/api/data/PY20N012/ccepPics/CCSR/${ccsr}`
              );
              let matrIm = await res.arrayBuffer();
              let binary = "";
              let bytes = [].slice.call(new Uint8Array(matrIm));
              bytes.forEach(
                (b: any) => (binary += String.fromCharCode(b))
              );
              setImage(binary);
            }}
          >{ccsr}</Dropdown.Item>
        );
      })
    ) : (
      <div></div>
    )}
  </Dropdown.Menu>
</Dropdown>
</Col> */}