import React, { useState, useContext } from "react";
import { Context } from "../Context";
import {
    Navbar,
    Nav,
    Button,
    ToggleButton,
    ButtonToolbar,
    ToggleButtonGroup,
    Container,
    Popover,
    OverlayTrigger
} from "react-bootstrap";

const DataHeader = props => {
    const { setMapData } = useContext(Context);
    const [defaultChoice, setDefaultChoice] = useState(1);

    const dataChanger = e => {
        if (e == 1) {
            setMapData("CCEP");
            setDefaultChoice(1);
        }
        if (e == 2) {
            setMapData("lgData");
            setDefaultChoice(2);
        }
        if (e == 3) {
            setMapData("hgData");
            setDefaultChoice(3);
        }
    };
    const EPSelector = () => {
        let urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get("type") == "EP" || urlParams.get("type") == "CCSR") {
            return (
                <ButtonToolbar style={{ float: "left" }}>
                    <ToggleButtonGroup
                        name="options"
                        type="radio"
                        defaultValue={defaultChoice}
                        onChange={e => dataChanger(e)}
                    >
                        <ToggleButton value={1}>CCSR (low gamma) </ToggleButton>
                        <ToggleButton value={2}>CCSR (high gamma)</ToggleButton>
                    </ToggleButtonGroup>
                </ButtonToolbar>
            );
        } else {
            return <div></div>;
        }
    };
    return (
        <Container fluid style={{ padding: "0" }}>
            <Navbar
                id="dataHeader"
                fixed="top"
                expand="lg"
                variant="dark"
                bg="dark"
                style={{ marginTop: "60px" }}
            >
                <EPSelector></EPSelector>
                <OverlayTrigger
                    overlay={
                        <Popover id="modal-popover" title="popover">
                            Click to sweep
            </Popover>
                    }
                >
                    <Button id="dataTimer" variant="info">
                        0.0s
          </Button>
                </OverlayTrigger>
                <Navbar.Collapse>
                    <Nav className="mr-auto">
                        <Nav.Link className="fm-zoom-in" onClick={() => console.log("A")}>
                            (Z+)
            </Nav.Link>
                        <Nav.Link className="fm-zoom-out" onClick={() => console.log("B")}>
                            (Z-)
            </Nav.Link>
                        <Nav.Link className="fm-gain-up" onClick={() => console.log("C")}>
                            (G+)
            </Nav.Link>
                        <Nav.Link className="fm-gain-down" onClick={() => console.log("D")}>
                            (G-)
            </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
                <ButtonToolbar style={{ position: "absolute", right: "0px" }}>
                    <ToggleButtonGroup
                        name="options"
                        type="radio"
                        defaultValue={1}
                        onChange={e => props.setBrainType(e)}
                    >
                        <ToggleButton value={"2D"}>2D</ToggleButton>
                        <ToggleButton value={"3D"}>3D</ToggleButton>
                        <ToggleButton value={"3Dcs"}>3D_cs</ToggleButton>
                    </ToggleButtonGroup>
                </ButtonToolbar>
            </Navbar>
        </Container>
    );
};

//   _updateZoomClasses = () => {
//     if ( this.config.rowHeight >= this.config.maxRowHeight ) {
//         $( '.fm-zoom-in' ).addClass( 'disabled' );
//     } else {
//         $( '.fm-zoom-in' ).removeClass( 'disabled' );
//     }
//     if ( this.config.rowHeight <= 1 ) {
//         $( '.fm-zoom-out' ).addClass( 'disabled' );
//     } else {
//         $( '.fm-zoom-out' ).removeClass( 'disabled' );
//     }
// };

// _updateGainClasses = ()  => {
//     if ( this.config.rasterExtent >= this.config.maxRasterExtent ) {
//         $( '.fm-gain-down' ).addClass( 'disabled' );
//     } else {
//         $( '.fm-gain-down' ).removeClass( 'disabled' );
//     }
//     if ( this.config.rasterExtent <= 1 ) {
//         $( '.fm-gain-up' ).addClass( 'disabled' );
//     } else {
//         $( '.fm-gain-up' ).removeClass( 'disabled' );
//     }
// };

// zoomIn = ( event ) => {
//     this.config.rowHeight = this.config.rowHeight + 1;
//     if ( this.config.rowHeight > this.config.maxRowHeight ) {
//         this.config.rowHeight = this.config.maxRowHeight;
//         return;
//     }
//     this._updateZoomClasses();
//     var prevScrollFraction = this._getScrollFraction();
//     this.raster.setRowHeight( this.getRowHeight() );
//     this.updateRaster( true );
//     $( document ).scrollTop( this._topForScrollFraction( prevScrollFraction ) );
// };

// zoomOut = ( event ) => {
//     this.config.rowHeight = this.config.rowHeight - 1;
//     if ( this.config.rowHeight < 1 ) {
//         this.config.rowHeight = 1;
//         return;
//     }
//     this._updateZoomClasses();
//     var prevScrollFraction = this._getScrollFraction();
//     this.raster.setRowHeight( this.getRowHeight() );
//     this.updateRaster( true );
//     $( document ).scrollTop( this._topForScrollFraction( prevScrollFraction ) );
// };

// gainDown = ( event ) => {
//     this.config.rasterExtent = this.config.rasterExtent + 1;
//     if ( this.config.rasterExtent > this.config.maxPlotExtent ) {
//         this.config.rasterExtent = this.config.maxPlotExtent;
//         return;
//     }
//     this._updateGainClasses();
//     this.raster.setExtent( this.getRasterExtent() );
//     this.updateRaster( true );

// };

// gainUp = ( event ) => {
//     this.config.rasterExtent = this.config.rasterExtent - 1;
//     if ( this.config.rasterExtent < 1 ) {
//         this.config.rasterExtent = 1;
//         return;
//     }
//     this._updateGainClasses();
//     this.raster.setExtent( this.getRasterExtent() );
//     this.updateRaster( true );

// };

export { DataHeader };
