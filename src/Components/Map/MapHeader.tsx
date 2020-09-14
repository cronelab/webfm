import { Navbar, Nav, NavItem, NavDropdown } from '../../node_modules/react-bootstrap';
import MapModals from './MapModals.jsx';

import React, { useState } from 'react';

const MapHeader = () => {
	const [clicked, click] = useState(false)


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

	return (
		<div>
			<Navbar >
				<div>
					{/* <Navbar.Header>
						<Navbar.Toggle>
							<span className="sr-only">Toggle navigation</span>
							<span className="icon-bar"></span>
							<span className="icon-bar"></span>
							<span className="icon-bar"></span>
						</Navbar.Toggle>
					</Navbar.Header> */}

					<Navbar.Collapse>
						<Nav>
							<NavItem>
								<Navbar.Text className="fm-time-label">
									<span className="fm-time-selected">0.000 s</span>
								</Navbar.Text>
							</NavItem>

							<NavItem className="fm-zoom-in">
								{/* <Glyphicon glyph="zoom-in"
									onClick={() => console.log("A")} /> */}
							</NavItem>

							<NavItem className="fm-zoom-out">
								{/* <Glyphicon glyph="zoom-out"
									onClick={() => console.log("B")} /> */}
							</NavItem>

							<NavItem className="fm-gain-up">
								{/* <Glyphicon glyph="volume-up"
									onClick={() => console.log("C")} /> */}
							</NavItem>

							<NavItem className="fm-gain-down">
								{/* <Glyphicon glyph="volume-down"
									onClick={() => console.log("D")} /> */}
							</NavItem>
						</Nav>

						<Nav>
							<NavDropdown className="fm-dataset-list" id="graphViews" title="Charts">
								{/* <MenuItem href="#" id="rasterView">Raster</MenuItem>
								<MenuItem href="#" id="chartView">Chart</MenuItem> */}
							</NavDropdown>
							<NavDropdown className="fm-dataset-list" id="dataType" title="Data type ">
								{/* <MenuItem href="#" id="bandDropdown">High gamma (70–110 Hz)</MenuItem> */}
							</NavDropdown>
							<NavDropdown className="fm-dataset-list" id="chanSel" title="Channel selector ">
							</NavDropdown>
							<NavDropdown className="fm-dataset-list" id="stimSel" title="Stimulus selection">
								{/* <MenuItem href="#">Stimulus: All vs none</MenuItem> */}
							</NavDropdown>

							<NavDropdown className="fm-dataset-list" id="twoVsThree" title="Perspective">
								{/* <MenuItem href="#" id="twoDDrop">2D</MenuItem> */}
								{/* <MenuItem href="#" id="threeDDrop">3D</MenuItem> */}
							</NavDropdown>
							<NavItem >
								{/* <Glyphicon
									glyph="cog"
									className="fm-show-options"
									onClick={() => click(true)}
								/> */}
							</NavItem>
							<MapModals clicked={clicked} />

						</Nav>
					</Navbar.Collapse>
				</div>
			</Navbar>
		</div >
	);
}

export default MapHeader;