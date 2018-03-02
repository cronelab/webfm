// =
//
// fmui
// User interface manager for WebFM
//
// =


// REQUIRES

var $           = require( 'jquery' );
var d3          = require( 'd3' );

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

    var manager = this;

    this.config = {};

    this.icons = [
        'transfer',
        'working'
    ];

    this.allChannels = [];  // TODO Can avoid?

    // Allocate members

    this.rasters = new fmraster.ChannelRaster( '#fm' );
    this.rasters1 = new fmraster.ChannelRaster( '#fm1' );
    this.rasters2 = new fmraster.ChannelRaster( '#fm2' );
    this.rasters3 = new fmraster.ChannelRaster( '#fm3' );
    this.rasters4 = new fmraster.ChannelRaster( '#fm4' );
    this.rasters5 = new fmraster.ChannelRaster( '#fm5' );
    this.rasters6 = new fmraster.ChannelRaster( '#fm6' );
    this.rasters7 = new fmraster.ChannelRaster( '#fm7' );
    this.rasters8 = new fmraster.ChannelRaster( '#fm8' );
    this.rasters9 = new fmraster.ChannelRaster( '#fm9' );
    this.rasters10 = new fmraster.ChannelRaster( '#fm10' );
    this.rasters11 = new fmraster.ChannelRaster( '#fm11' );
    this.rasters12 = new fmraster.ChannelRaster( '#fm12' );

    this.brain = new fmbrain.BrainVisualizer( '#fm-brain' );
    this.scope = new fmscope.ChannelScope( '#fm-scope' );
    this.raster = []
    this.raster.push(this.rasters);
    this.raster.push(this.rasters1);
    this.raster.push(this.rasters2);
    this.raster.push(this.rasters3);
    this.raster.push(this.rasters4);
    this.raster.push(this.rasters5);
    this.raster.push(this.rasters6);
    this.raster.push(this.rasters7);
    this.raster.push(this.rasters8);
    this.raster.push(this.rasters9);
    this.raster.push(this.rasters10);
    this.raster.push(this.rasters11);
    this.raster.push(this.rasters12);
        // Event hooks
for(var i =0; i<this.raster.length; i++)
{
    this.raster[i].onselectchannel = function( newChannel ) {
        manager.brain.setSelectedChannel( newChannel );
    };
  }
    // this.raster1.onselectchannel = function( newChannel ) {
    //     manager.brain.setSelectedChannel( newChannel );
    // };

    // Events

    this.onoptionchange = function( option, newValue ) {};

    this.onsave = function( saveName ) {};

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

    _syncRasterConfig: function() {

      for(var i =0; i<this.raster.length; i++)
      {
        this.raster[i].setRowHeight( this.getRowHeight() );
        this.raster[i].setExtent( this.getRasterExtent() );
      }
    },

    _mergeDefaultConfig: function( config ) {

        // Copy over any extras that might not be merged here
        var mergedConfig = config;

        // For required config items, specify a default if nothing is provided
        mergedConfig.rowHeight              = config.rowHeight              || 5;
        mergedConfig.maxRowHeight           = config.maxRowHeight           || 10;
        mergedConfig.pxPerRowHeight         = config.pxPerRowHeight         || 5;

        mergedConfig.rasterExtent           = config.rasterExtent           || 5;
        mergedConfig.maxRasterExtent        = config.maxRasterExtent        || 10;
        mergedConfig.unitsPerRasterExtent   = config.unitsPerRasterExtent   || 1;

        mergedConfig.iconShowDuration       = config.iconShowDuration       || 100;
        mergedConfig.iconHideDelay          = config.iconHideDelay          || 1000;
        mergedConfig.iconHideDuration       = config.iconHideDuration       || 100;

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

        for(var i =0; i<this.raster.length; i++)
        {
          this.raster[i].setup();    // TODO Always will fail for charts until
        }            // data arrives; necessary?

        // Populate options with the current cookie-set values
        this._populateOptions( this.getOptions() );

        this._syncRasterConfig();

    },

    /*
    updateRecordDetails: function( subject, record ) {

        // Use straight href for back button
        $( '.fm-back' ).attr( 'href', '/#' + subject );

        // TODO ...

    },
    */

    rewireButtons: function() {

        var manager = this;

        $( '.fm-zoom-in' ).on( 'click', function( event ) {
            event.preventDefault();
            if ( $( this ).hasClass( 'disabled' ) ) { return; }
            manager.zoomIn( event );
        } );
        $( '.fm-zoom-out' ).on( 'click', function( event ) {
            event.preventDefault();
            if ( $( this ).hasClass( 'disabled' ) ) { return; }
            manager.zoomOut( event );
        } );
        $( '.fm-gain-up' ).on( 'click', function( event ) {
            event.preventDefault();
            if ( $( this ).hasClass( 'disabled' ) ) { return; }
            manager.gainUp( event );
        } );
        $( '.fm-gain-down' ).on( 'click', function( event ) {
            event.preventDefault();
            if ( $( this ).hasClass( 'disabled' ) ) { return; }
            manager.gainDown( event );
        } );

        $( '.fm-toggle-fullscreen' ).on( 'click', function( event ) {
            event.preventDefault();
            manager.toggleFullscreen( event );
        } );

        $( '.fm-show-options' ).on( 'click', function( event ) {
            event.preventDefault();
            manager.showOptions( event );
        } );
        $( '.fm-options-tab-list a' ).on( 'click', function( event ) {
            event.preventDefault();
            manager.showOptionsTab( this, event );
        } );

        $( '.fm-save-cloud' ).on( 'click', function( event ) {
            event.preventDefault();
            // TODO Bad.
            manager.onsave( $( '#fm-option-save-name' ).val() );
        } );

        $( '.dropdown-menu' ).children().on( 'click', function( event ) {
          if (!$(this).hasClass("active")) {

          // Remove the class from anything that is active
          //$("li.active").removeClass("active");
          // And make this active
          $(this).addClass("active");
          }
          else{
            $(this).removeClass("active");
          }
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

        var updateOptions = function( updater ) {
            var options = manager.getOptions();
            updater( options );
            manager.setOptions( options );
        };

        // TODO Manually handling radio because my markup is dumb
        $( '#fm-option-stim-timing-state' ).on( 'click', function( event ) {
            $( '#fm-option-stim-timing-state' ).prop( 'checked', true );
            $( '#fm-option-stim-timing-signal' ).prop( 'checked', false );

            updateOptions( function( options ) {
                options.stimulus.timingStrategy = 'state';
            } );
            manager.onoptionchange( 'stim-timing', 'state' );
        } );
        $( '#fm-option-stim-timing-signal' ).on( 'click', function( event ) {
            $( '#fm-option-stim-timing-state' ).prop( 'checked', false );
            $( '#fm-option-stim-timing-signal' ).prop( 'checked', true );

            updateOptions( function( options ) {
                options.stimulus.timingStrategy = 'signal';
            } );
            manager.onoptionchange( 'stim-timing', 'signal' );
        } );

        $( '#fm-option-stim-channel' ).on( 'change', function( event ) {
            var newValue = this.value;
            updateOptions( function( options ) {
                options.stimulus.signal.channel = newValue;
            } );
            manager.onoptionchange( 'stim-channel', newValue );
        } );
        $( '#fm-option-stim-off' ).on( 'change', function( event ) {
            var newValue = +this.value;
            updateOptions( function( options ) {
                options.stimulus.signal.offValue = newValue;
            } );
            manager.onoptionchange( 'stim-off', newValue );
        } );
        $( '#fm-option-stim-on' ).on( 'change', function( event ) {
            var newValue = +this.value;
            updateOptions( function( options ) {
                options.stimulus.signal.onValue = newValue;
            } );
            manager.onoptionchange( 'stim-on', newValue );
        } );


        $ ( '#fm-option-nuke-cookies' ).on( 'click', function( event ) {
            manager.clearOptions();
            manager.clearExclusion();
        } );


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

    updateRaster: function( guarantee ) {

        var manager = this;

        var updater = function() {
          for(var i =0; i<manager.raster.length; i++)
          {
            manager.raster[i].update();
          }
        };

        if ( guarantee ) {
            // Guarantee the update happens now
            updater();
        } else {
            // Debounce the update calls to prevent overload
            cronelib.debounce( updater, this.config.rasterDebounceDelay, true )();
        }
    },

    updateScope: function( guarantee ) {

        var manager = this;

        var updater = function() {
            manager.scope.autoResize();
            manager.scope.update();
        };

        if ( guarantee ) {
            // Guarantee the update happens now
            updater();
        } else {
            // Debounce the update calls to prevent overload
            cronelib.debounce( updater, this.config.scopeDebounceDelay, true )();
        }
    },

    updateBrain: function() {

        var manager = this;

        cronelib.debounce( function() {
            manager.brain.autoResize();
            manager.brain.update();
        }, this.config.brainDebounceDelay )();

    },


    /* Button handlers */

    _updateZoomClasses: function() {
        if ( this.config.rowHeight >= this.config.maxRowHeight ) {
            $( '.fm-zoom-in' ).addClass( 'disabled' );
        } else {
            $( '.fm-zoom-in' ).removeClass( 'disabled' );
        }
        if ( this.config.rowHeight <= 1 ) {
            $( '.fm-zoom-out' ).addClass( 'disabled' );
        } else {
            $( '.fm-zoom-out' ).removeClass( 'disabled' );
        }
    },

    _updateGainClasses: function() {
        if ( this.config.rasterExtent >= this.config.maxRasterExtent ) {
            $( '.fm-gain-down' ).addClass( 'disabled' );
        } else {
            $( '.fm-gain-down' ).removeClass( 'disabled' );
        }
        if ( this.config.rasterExtent <= 1 ) {
            $( '.fm-gain-up' ).addClass( 'disabled' );
        } else {
            $( '.fm-gain-up' ).removeClass( 'disabled' );
        }
    },

    zoomIn: function( event ) {

        // Update UI-internal gain measure
        this.config.rowHeight = this.config.rowHeight + 1;
        if ( this.config.rowHeight > this.config.maxRowHeight ) {
            this.config.rowHeight = this.config.maxRowHeight;
            return;                         // Only update if we actually change
        }

        this._updateZoomClasses();

        // Cache the scroll state before our manipulations
        // TODO Use row in middle of viewport, not fraction of scrolling
        var prevScrollFraction = this._getScrollFraction();
        // Alter raster parameters
        for(var i =0; i<this.raster.length; i++)
        {
        this.raster[i].setRowHeight( this.getRowHeight() );
}
  //      this.raster1.setRowHeight( this.getRowHeight() );
        // Redraw the raster with a guarantee
        this.updateRaster( true );
        //Restore the scroll state
        $( document ).scrollTop( this._topForScrollFraction( prevScrollFraction ) );

    },

    zoomOut: function( event ) {

        // Update UI-internal gain measure
        this.config.rowHeight = this.config.rowHeight - 1;
        if ( this.config.rowHeight < 1 ) {
            this.config.rowHeight = 1;
            return;
        }
        this._updateZoomClasses();

        // Cache the scroll state before our manipulations
        // TODO Use row in middle of viewport, not fraction of scrolling
        var prevScrollFraction = this._getScrollFraction();
        // Alter raster parameters
        this.raster[0].setRowHeight( this.getRowHeight() );
    //    this.raster1.setRowHeight( this.getRowHeight() );
        // Redraw the raster with a guarantee
        this.updateRaster( true );
        // Restore the scroll state
        $( document ).scrollTop( this._topForScrollFraction( prevScrollFraction ) );

    },

    gainDown: function( event ) {

        // Update UI-internal gain measure
        this.config.rasterExtent = this.config.rasterExtent + 1;
        if ( this.config.rasterExtent > this.config.maxPlotExtent ) {
            this.config.rasterExtent = this.config.maxPlotExtent;
            return;
        }

        this._updateGainClasses();

        // Alter raster parameters
        this.raster[0].setExtent( this.getRasterExtent() );
        // this.raster1.setExtent( this.getRasterExtent() );

        // Redraw the raster with a guarantee
        this.updateRaster( true );

    },

    gainUp: function( event ) {

        // Update UI-internal gain measure
        this.config.rasterExtent = this.config.rasterExtent - 1;
        if ( this.config.rasterExtent < 1 ) {
            this.config.rasterExtent = 1;
            return;
        }
        this._updateGainClasses();

        // Alter raster parameters
        this.raster[0].setExtent( this.getRasterExtent() );
        // this.raster1.setExtent( this.getRasterExtent() );

        // Redraw the raster with a guarantee
        this.updateRaster( true );

    },

    _getScrollFraction: function() {
        return $( window ).scrollTop() / ( $( document ).height() - $( window ).height() );
    },

    _topForScrollFraction: function( frac ) {
        return frac * ( $( document ).height() - $( window ).height() );
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
        $( '.fm-back' ).attr( 'href', '/#' + newSubjectName );
    },

    updateTaskName: function( newTaskName ) {
        $( '.fm-task-name' ).text( newTaskName );
        $( '#fm-option-save-name' ).val( newTaskName );
    },

    updateSubjectRecords: function( newRecords ) {

        // Clear list before populating it
        $( '#fm-cloud-records-table' ).empty();

        var addRecordCell = function( record ) {
            // TODO Need to incorporate number of members for badge
            // TODO Could fail if record is badly named

            var outer = $( '<tr/>' );

            var inner = $( '<td/>', {
                text: record
            } );

            inner.appendTo( outer );
            outer.appendTo( '#fm-cloud-records-table' );

        };

        newRecords.forEach( addRecordCell );

    },

    // TODO nomenclature
    updateSelectedTime: function( newTime ) {
        $( '.fm-time-selected' ).text( ( newTime > 0 ? '+' : '' ) + newTime.toFixed( 3 ) + ' s' );
    },

    _populateOptions: function( options ) {

        // TODO We respond to option changes here; best time? Smarter way?

        // Stimulus windows
        $( '#fm-option-stim-trial-start' ).val( options.stimulus.window.start );
        $( '#fm-option-stim-trial-end' ).val( options.stimulus.window.end );
        $( '#fm-option-stim-baseline-start' ).val( options.stimulus.baselineWindow.start );
        $( '#fm-option-stim-baseline-end' ).val( options.stimulus.baselineWindow.end );

        // Response windows
        $( '#fm-option-resp-trial-start' ).val( options.response.window.start );
        $( '#fm-option-resp-trial-end' ).val( options.response.window.end );
        $( '#fm-option-resp-baseline-start' ).val( options.response.baselineWindow.start );
        $( '#fm-option-resp-baseline-end' ).val( options.response.baselineWindow.end );

        // Timing strategy
        $( '#fm-option-stim-timing-state' ).prop( 'checked', options.stimulus.timingStrategy == 'state' );
        $( '#fm-option-stim-timing-signal' ).prop( 'checked', options.stimulus.timingStrategy == 'signal' );
        this.onoptionchange( 'stim-timing', options.stimulus.timingStrategy );

        // Stimulus thresholding
        $( '#fm-option-stim-channel' ).val( options.stimulus.signal.channel );
        this.onoptionchange( 'stim-channel', options.stimulus.signal.channel );
        $( '#fm-option-stim-off' ).val( options.stimulus.signal.offValue );
        this.onoptionchange( 'stim-off', options.stimulus.signal.offValue );
        $( '#fm-option-stim-on' ).val( options.stimulus.signal.onValue );
        this.onoptionchange( 'stim-on', options.stimulus.signal.onValue );

        $( '#fm-option-stim-state' ).val( options.stimulus.state.name );
        $( '#fm-option-stim-state-off' ).val( options.stimulus.state.offValue );
        $( '#fm-option-stim-state-on' ).val( options.stimulus.state.onValue );

        // Response thresholding
        $( '#fm-option-resp-channel' ).val( options.response.signal.channel );
        $( '#fm-option-resp-off' ).val( options.response.signal.offValue );
        $( '#fm-option-resp-on' ).val( options.response.signal.onValue );

        $( '#fm-option-resp-state' ).val( options.response.state.name );
        $( '#fm-option-resp-state-off' ).val( options.response.state.offValue );
        $( '#fm-option-resp-state-on' ).val( options.response.state.onValue );

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

    getRasterExtent: function() {
        return this.config.rasterExtent * this.config.unitsPerRasterExtent;
    },

    getRowHeight: function() {
        return this.config.rowHeight * this.config.pxPerRowHeight;
    },

    getOptions: function() {
        // Get the set options
        var options = Cookies.getJSON( 'options' );

        if ( options === undefined ) {
            // Cookie isn't set, so generate default
            options = {};

            // TODO Move default options into config

            options.stimulus = {};

            // Stimulus-based alignment config

            options.stimulus.window = {
                start   : -1.0,
                end     : 3.0
            };
            options.stimulus.baselineWindow = {
                start   : -1.0,
                end     : -0.2
            };

            options.stimulus.timingStrategy = 'state';

            options.stimulus.signal = {};
            options.stimulus.signal.channel      = 'ainp1';
            options.stimulus.signal.offValue     = 0;
            options.stimulus.signal.onValue      = 1;
            options.stimulus.signal.threshold    = 0.2;

            options.stimulus.state = {};
            options.stimulus.state.name          = 'StimulusCode';
            options.stimulus.state.offValue      = 0;
            options.stimulus.state.onValue       = 'x';

            // Response-based alignment config

            options.response = {};
            options.response.window = {
                start   : -2.0,
                end     : 2.0
            };
            options.response.baselineWindow = {
                start   : -2.0,
                end     : -1.6
            };

            options.response.timingStrategy = 'state';

            options.response.signal = {};
            options.response.signal.channel      = 'ainp2';
            options.response.signal.offValue     = 0;
            options.response.signal.onValue      = 1;
            options.response.signal.threshold    = 0.2;

            options.response.state = {};
            options.response.state.name          = 'RespCode';
            options.response.state.offValue      = 0;
            options.response.state.onValue       = 'x';

            // Set the cookie so this doesn't happen again!
            Cookies.set( 'options', options, {
                expires: this.config.cookieExpirationDays
            } );
        }

        return options
    },

    setOptions: function( options ) {
        Cookies.set( 'options', options, {
            expires: this.config.cookieExpirationDays
        } );
    },

    clearOptions: function() {
        Cookies.remove( 'options' );
        this.getOptions();
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

    clearExclusion: function() {
        Cookies.remove( 'exclusion' );
        this.getExclusion();
    },

    exclude: function( channel ) {
        // TODO Check if channel is in allChannels?
        var exclusion = this.getExclusion();
        exclusion[channel] = true;
        this.setExclusion( exclusion );

        // Update raster display
        for(var i =0; i<this.raster.length; i++)
        {
          this.raster[i].setDisplayOrder( this.allChannels.filter( this.channelFilter() ) );
        }
        // this.raster1.setDisplayOrder( this.allChannels.filter( this.channelFilter() ) );
    },

    unexclude: function( channel ) {
        // TODO Better behavior: Check if channel is in exclusion, then delete
        var exclusion = this.getExclusion();
        exclusion[channel] = false;
        this.setExclusion( exclusion );

        // Update raster display
        for(var i =0; i<this.raster.length; i++)
        {
          this.raster[i].setDisplayOrder( this.allChannels.filter( this.channelFilter() ) );
        }
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
        for(var i =0; i<this.raster.length; i++)
        {
          this.raster[i].setDisplayOrder( this.allChannels.filter( this.channelFilter() ) );
        }

    },

    activateTrialCount: function() {
        $( '.fm-trial-label' ).addClass( 'fm-trial-label-active' );
    },

    deactivateTrialCount: function() {
        $( '.fm-trial-label' ).removeClass( 'fm-trial-label-active' );
    },

    updateTrialCount: function( newCount ) {
        $( '.fm-trial-label' ).text( 'n = ' + newCount );
    },

    didResize: function() {

        this.updateRaster();

        this.updateScope();

        //this.updateBrain();
        this.brain.autoResize();

    }


    /* Animation */

    // TODO

};


// EXPORT MODULE

module.exports = fmui;


//
