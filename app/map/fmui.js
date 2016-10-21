// =
//
// fmui
// User interface manager for WebFM
//
// =


// REQUIRES

var $           = require( 'jquery' );

require( 'setimmediate' );                          // Needed to fix promise
                                                    // polyfill on non-IE
var Promise     = require( 'promise-polyfill' );    // Needed for IE Promise
                                                    // support

var cronelib    = require( '../lib/cronelib' );
var fullscreen  = require( '../lib/fullscreen' );

var fmbrain     = require( './fmbrain' );
var fmraster    = require( './fmraster' );


// MODULE OBJECT

var fmui = {};


// MAIN CLASS

fmui.InterfaceManager = function() {

    this.config = {};

    this.icons = [
        'transfer',
        'working'
    ];

    this.raster = new fmraster.ChannelRaster( '#fm' );

};

fmui.InterfaceManager.prototype = {

    constructor: fmui.InterfaceManager,

    loadConfig: function( configURI ) {
        
        var manager = this;     // Cache this for nested functions

        // Wrap $.getJSON in a standard Promise
        return new Promise( function( resolve, reject ) {
            $.getJSON( configURI )
                .done( resolve )
                .fail( function( req, reason, err ) {
                    // TODO Get error message from jquery object
                    reject( 'Could not load UI config from ' + configURI + ' : ' + reason );
                } );
        } ).then( function( data ) {
            manager.config = data;
            manager.setup();
        } );

    },

    _mergeDefaultConfig: function( config ) {
    
        // Copy over any extras that might not be merged here
        var mergedConfig = config;

        // For required config items, specify a default if nothing is provided
        mergedConfig.rowHeight          = config.rowHeight          || 5;
        mergedConfig.maxRowHeight       = config.maxRowHeight       || 10;
        mergedConfig.pxPerRowHeight     = config.pxPerRowHeight     || 5;

        mergedConfig.plotExtent         = config.plotExtent         || 5;
        mergedConfig.maxPlotExtent      = config.maxPlotExtent      || 10;
        mergedConfig.unitsPerPlotExtent = config.unitsPerPlotExtent || 1;

        mergedConfig.iconShowDuration   = config.iconShowDuration   || 100;
        mergedConfig.iconHideDelay      = config.iconHideDelay      || 1000;
        mergedConfig.iconHideDuration   = config.iconHideDuration   || 100;

        mergedConfig.fmMargin = config.fmMargin || { 'left': 0, 'right': 0, 'top': 0, 'bottom': 0 };

        mergedConfig.chartDebounceDelay = config.chartDebounceDelay || 100;

        return mergedConfig;
        
    },

    setup: function() {

        var manager = this; // Capture this

        // Incorporate the defaults with whatever we've loaded
        this.config = this._mergeDefaultConfig( this.config );

        this.resizeFM();
        this.rewireButtons();

        this.icons.forEach( function( icon ) {
            manager.hideIcon( icon );
        } );

    },

    // TODO Accomplish this with CSS?
    resizeFM: function() {
        $( '#fm' ).height( $( window ).height() - ( this.config.fmMargin.top + this.config.fmMargin.bottom ) );
    },

    updateRecordDetails: function( subject, record ) {

        // Use straight href for back button
        $( '.fm-back' ).attr( 'href', '/#' + subject );

        // TODO ...

    },

    rewireButtons: function() {

        var manager = this;

        $( '.fm-zoom-in' ).on( 'click', function() {
            manager.zoomIn();
        } );
        $( '.fm-zoom-out' ).on( 'click', function() {
            manager.zoomOut();
        } );
        $( '.fm-gain-up' ).on( 'click', function() {
            manager.gainUp();
        } );
        $( '.fm-gain-down' ).on( 'click', function() {
            manager.gainDown();
        } );

        $( '.fm-toggle-fullscreen' ).on( 'click', function() {
            manager.toggleFullscreen()
        } );

    },

    showIcon: function( iconName ) {
        // If properties aren't set, use 0
        // TODO Necessary? We guarantee merged defaults when loading ...
        var showDuration = this.config.iconShowDuration || 0;
        $( '.fm-' + iconName + '-icon' ).show( showDuration );
    },

    hideIcon: function( iconName ) {
        // If properties aren't set, use 0
        // TODO As above.
        var hideDelay = this.config.iconHideDelay || 0;
        var hideDuration = this.config.iconHideDuration || 0;

        setTimeout( function() {
            $( '.fm-' + iconName + '-icon' ).hide( hideDuration );
        }, hideDelay );
    },

    windowDidResize: function() {

        this.resizeFM();

        cronelib.debounce( this.updateCharts, this.config.chartDebounceDelay )();

    },
    
    

    updateCharts: function() {
        
        // ...

    },


    /* Button handlers */

    zoomIn: function( event ) {
        this.rowHeight = this.rowHeight + 1;
        if ( this.rowHeight > this.config.maxRowHeight ) {
            this.rowHeight = this.config.maxRowHeight;
            return;                         // Only update if we actually change
        }
        this.updateCharts();
    },
    
    zoomOut: function( event ) {
        this.rowHeight = this.rowHeight - 1;
        if ( this.rowHeight < 1 ) {
            this.rowHeight = 1;
            return;
        }
        this.updateCharts();
    },

    gainDown: function( event ) {
        this.plotExtent = this.plotExtent + 1;
        if ( this.plotExtent > this.config.maxPlotExtent ) {
            this.plotExtent = this.config.maxPlotExtent;
            return;
        }
        this.updateCharts();
    },

    gainUp: function( event ) {
        this.plotExtent = this.plotExtent - 1;
        if ( this.plotExtent < 1 ) {
            this.plotExtent = 1;
            return;
        }
        this.updateCharts();
    },

    toggleFullscreen: function( event ) {
        console.log( 'Toggling fullscreen.' );
        fullscreen.toggle()
                    .then( function( result ) {
                        if ( fullscreen.is() ) {
                            // TODO Change fullscreen button icon
                        } else {
                            // TODO
                        }
                    } )
                    .catch( function( reason ) {
                        console.log( 'Could not toggle fullscreen: ' + reason );
                    } );
    },


    /* GUI Update methods */

    updateSubjectName: function( newSubjectName ) {
        $( '.fm-subject-name' ).text( newSubjectName );
    },

    updateTaskName: function( newTaskName ) {
        $( '.fm-task-name' ).text( newTaskName );
    },

    updateChannelNames: function( newChannelNames ) {
        this.raster.setDisplayOrder( newChannelNames );
    },

    didResize: function() {

        // TODO Better way?

        var manager = this;

        cronelib.debounce( function() {
            manager.raster.update();
        }, 500 )();   // TODO

    }

    
    /* Animation */

    // TODO
    
};


// EXPORT MODULE

module.exports = fmui;


//