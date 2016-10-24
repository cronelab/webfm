// =
//
// fmui
// User interface manager for WebFM
//
// =


// REQUIRES

var $           = require( 'jquery' );

// Hacky as Hell way to get browserify to work
window.$ = window.jQuery = $;   // Bootstrap needs $ in global namespace
require( 'bootstrap' );
$.noConflict( true );           // Clean up global namespace afterwards

require( 'setimmediate' );                          // Needed to fix promise
                                                    // polyfill on non-IE
var Promise     = require( 'promise-polyfill' );    // Needed for IE Promise
                                                    // support

var cronelib    = require( '../lib/cronelib' );
var fullscreen  = require( '../lib/fullscreen' );

var fmbrain     = require( './fmbrain' );
var fmraster    = require( './fmraster' );
var fmscope     = require( './fmscope' );


// GLOBALS

var ENTER_KEY   = 13;   // TODO Should probably go in config


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

    this.scope = new fmscope.ChannelScope( '#scope' );

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
        this.rewireForms();

        this.icons.forEach( function( icon ) {
            manager.hideIcon( icon );
        } );

        // TODO Get this to work
        //this.raster.setup();

        //this.scope.setup();

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

        $( '.fm-zoom-in' ).on( 'click', function( event ) {
            manager.zoomIn( event );
        } );
        $( '.fm-zoom-out' ).on( 'click', function( event ) {
            manager.zoomOut( event );
        } );
        $( '.fm-gain-up' ).on( 'click', function( event ) {
            manager.gainUp( event );
        } );
        $( '.fm-gain-down' ).on( 'click', function( event ) {
            manager.gainDown( event );
        } );

        $( '.fm-toggle-fullscreen' ).on( 'click', function( event ) {
            manager.toggleFullscreen( event );
        } );

        $( '.fm-show-options' ).on( 'click', function( event ) {
            manager.showOptions( event );
        } );
        $( '.fm-options-tab-list a' ).on( 'click', function( event ) {
            // Prevent auto-triggering
            event.preventDefault();

            manager.showOptionsTab( this, event );
        } );

    },

    rewireForms: function() {

        var manager = this;     // Capture this

        // TODO Use classes?

        // TODO Elegant way to gate by enter key?
        $( '#fm-option-scope-channel' ).on( 'keypress', function ( event ) {
            var key = event.which;
            if ( key == ENTER_KEY ) {
                // Trigger scoping
                manager.scope.start( $( '#fm-option-scope-channel' ).val() );
            }
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

    showOptions: function( event ) {
        $( '#fm-options-modal' ).modal( 'show' );
    },

    showOptionsTab: function( caller, event ) {

        // Show the caller's tab
        $( caller ).tab( 'show' );

        // Deactivate the tab list
        $( '.fm-options-tab-list .list-group-item' ).removeClass( 'active' );

        // TODO Get Bootstrap events for tab show / hide to work
        // Selected tab is last word of hash
        var selectedTab = caller.hash.split( '-' ).pop();
        var scopeChannel = $( '#fm-option-scope-channel' ).val();

        if ( selectedTab == 'scope' ) {
            this.scope.setup();     // TODO Necessary?
            this.scope.start( scopeChannel ? scopeChannel : undefined );
        } else {
            this.scope.stop();
        }

        // Activate the caller
        // TODO Deactivation is with class behavior, but this is specific instance
        // Could cause de-synch behavior if multiple instances of class
        $( caller ).addClass( 'active' );

    },

    setModalSize: function( size, event ) {

        console.log( 'Changing size to ' + size );

        if ( size == 'lg' ) {
            $( '#fm-options-modal-dialog' ).removeClass( 'modal-sm' )
                                            .addClass( 'modal-lg' );
            return;
        }

        if ( size == 'sm' ) {
            $( '#fm-options-modal-dialog' ).removeClass( 'modal-lg' )
                                            .addClass( 'modal-sm' );
            return;
        }

        $( '#fm-options-modal-dialog' ).removeClass( 'modal-lg modal-sm' );
        return;
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
        }, 100 )();   // TODO

    }

    
    /* Animation */

    // TODO
    
};


// EXPORT MODULE

module.exports = fmui;


//