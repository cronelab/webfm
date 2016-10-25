// =
//
// fmui
// User interface manager for WebFM
//
// =


// REQUIRES

var $           = require( 'jquery' );

var Cookies     = require( 'js-cookie' );

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
    this.allChannels = [];  // TODO Can avoid?

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

        this.rewireButtons();
        this.rewireForms();

        this.icons.forEach( function( icon ) {
            manager.hideIcon( icon );
        } );

        // TODO Get this to work
        //this.raster.setup();

        //this.scope.setup();

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
            event.preventDefault();     // Prevent auto-triggering
            manager.showOptionsTab( this, event );
        } );

    },

    rewireForms: function() {

        var manager = this;     // Capture this

        // TODO Use classes rather than ids?

        // Modal dialog

        $( '#fm-options-modal' ).on( 'hidden.bs.modal', function( event ) {
            manager.optionsHidden( event );
        } );

        // Options page
        // ...

        // Scope page

        $( '#fm-option-scope-channel' ).on( 'change', function ( event ) {
            manager.updateScopeChannel( this.value );
        } );

        $( '#fm-option-scope-min' ).on( 'change', function ( event ) {
            manager.updateScopeMin( ( this.value == '' ) ? null : +this.value );
        } );
        $( '#fm-option-scope-max' ).on( 'change', function ( event ) {
            manager.updateScopeMax( ( this.value == '' ) ? null : +this.value );
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

    optionsHidden: function( event ) {
        this.scope.stop();
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

    updateScopeMin: function( newMin ) {
        if ( isNaN( newMin ) ) {
            return;
        }
        this.scope.setMinTarget( newMin );
    },

    updateScopeMax: function( newMax ) {
        if ( isNaN( newMax ) ) {
            return;
        }
        this.scope.setMaxTarget( newMax );
    },

    updateScopeChannel: function( newChannel ) {
        this.scope.start( newChannel );
    },


    /* GUI Update methods */

    updateSubjectName: function( newSubjectName ) {
        $( '.fm-subject-name' ).text( newSubjectName );
    },

    updateTaskName: function( newTaskName ) {
        $( '.fm-task-name' ).text( newTaskName );
    },

    _populateMontageList: function( newChannelNames ) {

        var manager = this;

        var exclusion = this.getExclusion();

        var montageBody = $( '.fm-montage-table tbody' );

        // Clear out old montage
        montageBody.empty();

        // Build up new montage
        // TODO Incorporate excluded channels
        newChannelNames.forEach( function( ch ) {
            var curRow = $( '<tr></tr>' );
            curRow.append( $( '<th scope="row" class="fm-montage-cell-channelname">' + ch + '</th>' ) );
            
            var isExcludedText = exclusion[ch] ? 'Yes' : 'No';
            curRow.append( $( '<td class="fm-montage-cell-isexcluded">' + isExcludedText + '</td>' ) );    // TODO Check if excluded

            if ( exclusion[ch] ) {
                curRow.addClass( 'danger' );
            }

            curRow.on( 'click', function( event ) {

                var selection = $( this );
                var shouldExclude = !selection.hasClass( 'danger' );

                if ( shouldExclude ) {
                    manager.exclude( ch );
                } else {
                    manager.unexclude( ch );
                }

                selection.toggleClass( 'danger' );
                $( '.fm-montage-cell-isexcluded', this ).text( shouldExclude ? 'Yes' : 'No' );

            } );

            montageBody.append( curRow );
        } );

    },

    getExclusion: function() {
        // Get the excluded channels
        var exclusion = Cookies.getJSON( 'exclusion' );

        if ( exclusion === undefined ) {
            // Cookie is not set, so generate default
            exclusion = {};
            // ... and set it so this doesn't happen again!
            Cookies.set( 'exclusion', exclusion, {
                expires: this.config.cookieExpirationDays
            } );
        }

        return exclusion;
    },

    setExclusion: function( exclusion ) {
        Cookies.set( 'exclusion', exclusion, {
            expires: this.config.cookieExpirationDays
        } );
    },

    exclude: function( channel ) {
        // TODO Check if channel is in allChannels?
        var exclusion = this.getExclusion();
        exclusion[channel] = true;
        this.setExclusion( exclusion );

        // Update raster display
        this.raster.setDisplayOrder( this.allChannels.filter( this.channelFilter() ) );
    },

    unexclude: function( channel ) {
        // TODO Better behavior: Check if channel is in exclusion, then delete
        var exclusion = this.getExclusion();
        exclusion[channel] = false;
        this.setExclusion( exclusion );

        // Update raster display
        this.raster.setDisplayOrder( this.allChannels.filter( this.channelFilter() ) );
    },

    channelFilter: function() {
        var exclusion = this.getExclusion();
        return function( ch ) {
            if ( exclusion[ch] === undefined ) {
                return true;
            }
            return !exclusion[ch];
        };
    },

    updateChannelNames: function( newChannelNames ) {

        // Update our state
        this.allChannels = newChannelNames;

        // Update the GUI with the complete channel list
        this._populateMontageList( this.allChannels );

        // Update the raster with the filtered channel list
        // TODO Support different ordering, or just exclusion?
        this.raster.setDisplayOrder( this.allChannels.filter( this.channelFilter() ) );

    },

    didResize: function() {

        // TODO Better way?

        var manager = this;

        cronelib.debounce( function() {
            manager.raster.update();
        }, this.config.rasterDebounceDelay )();   // TODO

        cronelib.debounce( function() {
            manager.scope.autoResize();
        }, this.config.scopeDebounceDelay )();

    }

    
    /* Animation */

    // TODO
    
};


// EXPORT MODULE

module.exports = fmui;


//