// webfm - main.js
// Main entry point for client-side scripts.

define( [ 'jquery', 'window', 'bci2k', './fmstat', './cronelib', 'd3-selection', 'd3-horizon-chart' ],
function( $, window, BCI2K, fmstat, cronelib, d3_selection, d3_horizon_chart ) {

    // Initialization
    // TODO Load config

    // Config
    var query = cronelib.parseQuery( window.location.search );

    var generateData = ( query.generate == 'yes' );
    
    var loadSubject = query.subject || undefined;
    var loadTask = query.task || undefined;
    var loadData;
    if ( ( generateData ) || ( loadSubject === undefined ) || ( loadTask === undefined) ) {
        loadData = false;
    } else {
        loadData = true;
        console.log( 'Loading data for ' + loadSubject + '::' + loadTask + '.' );
    }

    // BCI2K
    var bci = new BCI2K.Connection();
    var bciRunning = false;
    var dataConnection = null;

    // FM data
    var hgMean = null;
    var hgM2 = null;
    var hgVar = null;
    var nTrials = 0;

    // UI
    var subjectName = '';
    var channels = [];
    var valueUnits = 1.0;
    var startTime = 0.0;
    
    var rowHeight = 2;
    var maxRowHeight = 8;
    var pxPerHeight = 8;

    var plotExtent = 4;
    var maxPlotExtent = 1000;
    var unitsPerExtent = 0.5;

    var showDuration = 0;
    var hideDelay = 500;
    var hideDuration = 500;


    function updateSubjectName( newName, taskName ) {
        subjectName = newName;

        if ( taskName !== undefined ) {
            $('#subject-text').text( subjectName + ' - ' + taskName );
        } else {
            $('#subject-text').text( subjectName );
        }
    }

    // BCI2K Setup

    if ( !(generateData || loadData) )
    {

        bci.connect();

        ( function getDataConnection() {
            if ( bci.connected() && bciRunning ) {
                console.log( 'BCI Running!' );
                // DataConnection gives us the trial data via its ondata property
                dataConnection = new BCI2K.DataConnection();
                dataConnection.onproperties = onProperties;
                dataConnection.ondata = onData;
                // TODO Get the DataConnection port via an execute call
                dataConnection.connect( window.location.hostname + ':20325' );

                // Get other session info
                bci.execute( 'Get Parameter SubjectName', function( subjectResult ) {
                    updateSubjectName( subjectResult.output.trim() );
                    loadElectrodes();
                } );
            }
            else {
                console.log( '[DC] BCI not ready ...' );
                setTimeout( getDataConnection, 500 );
            }
        } )();

        ( function checkRunning() {
            if ( bci.connected() ) {
                console.log( 'BCI Running??' );
                // Need to ensure that we're running first before anything goes down.
                bci.execute( 'Get System State', function( result ) {
                    console.log( result.output );
                    if ( result.output.search( 'Running' ) >= 0 ) {
                        bciRunning = true;
                    }
                    else {
                        console.log( 'BCI not running ...' );
                        setTimeout( checkRunning, 500 );
                    }
                } );
            }
            else {
                console.log( '[RUN] BCI not connected ...' );
                setTimeout( checkRunning, 500 );
            }
        } )();

    }


    // BCI2K Callbacks

    function onProperties( properties ) {

        showIcon( 'transfer' );

        channels = properties.channels;
        valueUnits = properties.valueUnits;
        // ...

        hideIcon( 'transfer' );

    }

    function onData( data ) {

        showIcon( 'transfer' );

        if ( data.length != channels.length ) {
            console.log( 'Incorrect number of channels in data!' );
        }
        else {
            crunchNewData( data );
            updateCharts();
        }

        hideIcon( 'transfer' );

    }


    // Stats

    function crunchNewData( newData ) {

        showIcon( 'working' );

        nTrials += 1;

        if ( hgMean == null ) {
            hgMean = newData;
            hgM2 = fmstat.zeros( hgMean.length, hgMean[0].length );
            hgVar = fmstat.zeros( hgMean.length, hgMean[0].length );
            return;
        }

        // delta = x - mean
        delta = fmstat.add_m( newData, fmstat.smul_m( -1.0, hgMean ) );
        // mean += delta / n
        hgMean = fmstat.add_m( hgMean, fmstat.smul_m( (1 / nTrials), delta ) );
        // M2 += delta * (x - mean)
        hgM2 = fmstat.add_m( hgM2, fmstat.pmul_m( delta, fmstat.add_m( newData, fmstat.smul_m( -1.0, hgMean ) ) ) );
        // var = M2 / (n - 1)
        hgVar = fmstat.smul_m( (1 / (nTrials - 1)), hgM2 );

        hideIcon( 'working' );

    }


    // UX

    $('#fm').height( $(window).height() - 70 );
    /*
    $( document ).ready( function() {
        $('.container-brain').pushpin( {
            offset: $('.container-brain').offset().top
        } );
    } );
    */

    $( window ).on( 'resize', function() {
        $('#fm').height( $( window ).height() - 70 );
    } );

    $( window ).on( 'resize', cronelib.debounce( updateCharts, 100 ) );
    //$( window ).on( 'resize', cronelib.debounce( updatebrain, 5 ) );

    $('#zoom-in-button').on( 'click', zoomIn );
    $('#zoom-out-button').on( 'click', zoomOut );
    $('#gain-up-button').on( 'click', gainUp );
    $('#gain-down-button').on( 'click', gainDown );

    function showIcon( iconName ) {
        $('#' + iconName + '-icon').show( showDuration );
    }
    function hideIcon( iconName ) {
        setTimeout( function() {
            $('#' + iconName + '-icon').hide( hideDuration );
        }, hideDelay );
    }

    function zoomIn() {
        rowHeight = rowHeight + 1;
        if ( rowHeight > maxRowHeight ) {
            rowHeight = maxRowHeight;
            return;
        }
        updateCharts();
    }
    function zoomOut() {
        rowHeight = rowHeight - 1;
        if ( rowHeight < 1 ) {
            rowHeight = 1;
            return;
        }
        updateCharts();
    }

    function gainDown() {
        plotExtent = plotExtent + 1;
        if ( plotExtent > maxPlotExtent ) {
            plotExtent = maxPlotExtent;
            return;
        }
        updateCharts();
    }
    function gainUp() {
        plotExtent = plotExtent - 1;
        if ( plotExtent < 1 ) {
            plotExtent = 1;
            return;
        }
        updateCharts();
    }

    function updateCharts() {

        var chartData = channels.map( function( c, i ) {
            return {
                'name': c,
                'values': hgMean[i]
            }
        });

        // thread problems?
        // updatebrain( chartData );
        if ( cursorLocked ) {
            updateBrain( cursorX / $('#fm .horizon').width() );
        }

        var fmWidth = $('#fm').width();

        var enterHorizon = function( d, i ) {
            d3_horizon_chart.horizonChart()
                .title( d.name )
                .height( rowHeight * pxPerHeight )
                .step( fmWidth / chartData[0].values.length )
                .extent( [-(plotExtent * unitsPerExtent), plotExtent * unitsPerExtent] )
                .call( this, d.values, i );
        }

        // TODO Hella slow!!
        d3_selection.select( '#fm' ).selectAll( '.horizon' )
            .remove();

        var update = d3_selection.select( '#fm' ).selectAll( '.horizon' )
            .data( chartData );

        update.enter()
                .append( 'div' )
                    .attr( 'class', 'horizon' )
                    .style( 'padding-top', function( d, i ) {
                        return (i == 0) ? cursorTimescaleHeight.toString() + 'px' : '0px';
                    } )
                    .style( 'border-bottom', function() {
                        return( rowHeight * pxPerHeight < 15 ) ? 'solid 1px rgba(0,0,0,.2)' : 'solid 1px rgba(0,0,0,.5)';
                    } )
                    .each( enterHorizon )
                    .selectAll( '.title' )
                        .style( 'font-size', function() {
                            return ( rowHeight * pxPerHeight < 15 ) ? '8px' : '15px';
                        } )
                        .style( 'line-height', function() {
                            return ( rowHeight * pxPerHeight ).toString() + 'px';
                        } );

        update.exit()
            .remove();


        $( '#fm .horizon' ).on( 'mousemove', function( event ) {
            
            selectedChannel = d3.select( event.currentTarget ).datum().name;

            if ( cursorLocked ) {
                updateBrain();
            } else {
                // Update the brain with the current fraction
                updateBrain( event.offsetX / $( event.currentTarget ).width() );
                updateCursor( event.offsetX );
            }
            
        } );

    }


    // DEBUG Data generation

    var gen_nTime = 1 * 500;
    var gen_trialTime = 2 * 1000; // ms

    function gen_addTrial() {

        console.log( 'Adding trial.' );

        var data = channels.map( function( d ) {
            var tv = fmstat.linspace( -1, 3, gen_nTime );
            var yv = tv.map( fmstat.sin_f( 0.33 ), tv );
            return fmstat.add_v( yv, fmstat.smul_v( 0.5, fmstat.randn_v( yv.length ) ) );
        } );

        onData( data );

        if ( generateData && (nTrials < 200) )
            setTimeout( gen_addTrial, gen_trialTime );

    }

    if ( generateData ) {
        updateSubjectName( 'demo_subject' );
        loadElectrodes();

        for ( var i = 1; i <= 128; i++ )
            channels.push( 'E' + i.toString() );
        setTimeout( gen_addTrial, 100 );
    }


    // Load cached data file

    function loadFMFile( fmSubject, fmTask ) {

        var dataDir = './data/' + fmSubject + '/';
        var fmFilename = dataDir + fmSubject + '_' + fmTask + '.webfm';

        $.getJSON( fmFilename, function( data ) {

            updateSubjectName( data.subjectName, fmTask );
            
            onProperties( {
                channels: data.channels,
                valueUnits: data.valueUnits
            } );
            startTime = data.startTime;

            hgMean = data.hgMean;

            loadElectrodes();
            updateCharts();

        } ).fail( function( req ) {
            console.log( req );
        } );

    }

    if ( loadData ) {
        loadFMFile( loadSubject, loadTask );
    }


    // Brain visualization

    function interpolateValues( values, frac ) {
        var iFrac = frac * values.length;
        var iLow = Math.floor( iFrac ),
            iHigh = iLow + 1;
        iFrac = iFrac - iLow;
        return ( values[iLow] * (1 - iFrac) ) + ( values[iHigh] * iFrac );
    }

    function interpolateData( frac ) {
        return channels.map( function( c, i ) {
            return {
                name: c,
                value: ( hgMean ) ? interpolateValues( hgMean[i], frac ) : 1.0
            };
        } );
    }

    function positionChannel( dataChannel ) {
        // Debug mode
        if ( generateData ) {
            var channelNumber = parseInt( dataChannel.slice( 1 ) );
            var channelString = '';
            if ( channelNumber < 10 ) {
                channelString = '0' + channelNumber.toString();
            } else {
                channelString = channelNumber.toString();
            }
            return 'RTG' + channelString;
        } else {
            return dataChannel;
        }
    }

    var brainMargin = {
        top: 10,
        right: 10,
        bottom: 0,
        left: 0
    };
    var brainSize = {
        width: 0,
        height: 0
    };
    var brainSvg;
    var brainImage;
    var brainDots;

    var selectedChannel = null;
    var dotMinRadius = 0.003; // 0.0015
    var dotScale = 0.0080;
    var dotColors = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#fee090", "#fdae61", "#f46d43", "#d73027"];

    function updateBrainSize() {
        brainSize.width = $('#brain').parent().width() - brainMargin.right - brainMargin.left;
        brainSize.height = $('#brain').parent().width() - brainMargin.top - brainMargin.bottom;
    }
    
    // Setup calls

    function dotX( d ) {
        var p = channelPositions[positionChannel( d.name )];
        return ( p ) ? channelPositions[positionChannel( d.name )].x * (brainSize.width) : undefined; // 29, 32, 38
    }
    function dotY( d ) {
        var p = channelPositions[positionChannel( d.name )];
        return ( p ) ? (1 - channelPositions[positionChannel( d.name )].y) * (brainSize.height * 1.093) : undefined;
    }
    function dotRadius( d ) {
        return ( dotMinRadius + dotScale * Math.abs( d.value ) ) * brainSize.width;
    }
    function dotColor( d ) {
        if ( d.value == 0.0 ) {
            return '#ffffff';
        } else if ( d.value > 0.0 ) {
            /*
            var colorIdx = dotColors.length / 2 - 1;
            colorIdx = colorIdx + Math.min( Math.ceil( d.value * 2.0 ), dotColors.length - 1 );
            return dotColors[colorIdx];
            */
            return dotColors[6];
        } else {    // d.value < 0.0
            // TODO Figure out
            return dotColors[2];
        }
    }
    function dotStroke( d ) {
        if ( selectedChannel == null )
            return '#000000';
        if ( d.name == selectedChannel )
            return '#ffff00';

        return '#000000';
    }
    function dotStrokeWidth( d ) {
        if ( selectedChannel == null )
            return 1;
        if ( d.name == selectedChannel )
            return 3;

        return 1;
    }
    function dotFilter( d ) {
        if ( dotX( d ) === undefined ) {
            return false;
        }

        return true;
    }

    function dotPosition( dot ) {
        dot.attr( 'cx', function( d ) {
                return dotX( d );
            } )
            .attr( 'cy', function( d ) {
                return dotY( d );
            } )
            .attr( 'r', function( d ) {
                return dotRadius( d );
            } );
    }

    // Defines a sort order so that the smallest dots are drawn on top.
    function dotOrder( a, b ) {
        if ( a.name == selectedChannel )
            return +1;
        if ( b.name == selectedChannel )
            return -1;
        return dotRadius(b) - dotRadius(a);
    }

    var cursorSvg;
    var cursorLine;
    var cursorTimescale;
    var cursorTimescaleBorder;
    var cursorText;
    var cursorLineOrigin;
    var cursorX = null;
    var cursorLocked = false;

    var cursorSize = {
        width: $( '#fm' ).width(),
        height: $( '#fm' ).height() + 10
    }
    function updateCursorSize() {
        cursorSize.width = $( '#fm' ).width();
        cursorSize.height = $( '#fm' ).height() + 10;
    }

    function cursorOpacity( d ) {
        if ( cursorLocked ) {
            return 1.0;
        } else {
            return 0.5;
        }
    }

    var cursorTimescaleHeight = 50;
    var cursorTextWidthBuffer = 150;

    function setupCursor() {

        cursorSvg = d3.select( '#fm' ).append( 'svg' )
                                        .attr( 'class', 'cursor-svg' )
                                        .style( 'position', 'fixed' )
                                        .style( 'z-index', '100' )
                                        .style( 'pointer-events', 'none' )
                                        .attr( 'width', cursorSize.width )
                                        .attr( 'height', cursorSize.height );

        cursorTimescale = cursorSvg.append( 'rect' )
                                    .attr( 'class', 'cursor-timescale' )
                                    .style( 'stroke', 'none' )
                                    .style( 'fill', '#ffffff' )
                                    .attr( 'x', 0 )
                                    .attr( 'y', 0 )
                                    .attr( 'width', cursorSize.width )
                                    .attr( 'height', cursorTimescaleHeight );

        cursorTimescaleBorder = cursorSvg.append( 'line' )
                                            .attr( 'class', 'cursor-timescale-border' )
                                            .style( 'stroke', '#000000' )
                                            .style( 'stroke-width', '1' )
                                            .style( 'shape-rendering', 'crispEdges' )
                                            .style( 'stroke-linecap', 'butt' )
                                            .attr( 'x1', 0 )
                                            .attr( 'y1', cursorTimescaleHeight )
                                            .attr( 'x2', cursorSize.width )
                                            .attr( 'y2', cursorTimescaleHeight );

        cursorText = cursorSvg.append( 'text' )
                                .attr( 'class', 'cursor-text' )
                                .text( '0.0' )
                                .attr( 'x', 0 )
                                .attr( 'y', cursorTimescaleHeight - 8 )
                                .attr( 'font-size', 40 );

        cursorLine = cursorSvg.append( 'line' )
                                .attr( 'class', 'cursor-line' )
                                .style( 'stroke', '#000000' )
                                .style( 'stroke-opacity', cursorOpacity )
                                .style( 'stroke-width', 2 )
                                .style( 'stroke-linecap', 'butt' )
                                .attr( 'x1', 0 )
                                .attr( 'y1', 0 )
                                .attr( 'x2', 0 )
                                .attr( 'y2', cursorSize.height );

        cursorLineOrigin = cursorSvg.append( 'line' )
                                .attr( 'class', 'cursor-line-origin' )
                                .style( 'stroke', '#000000' )
                                .style( 'stroke-opacity', 0.5 )
                                .style( 'stroke-width', 2 )
                                .style( 'stroke-linecap', 'butt' )
                                .attr( 'x1', xForTime( 0.0 ) )
                                .attr( 'y1', cursorTimescaleHeight )
                                .attr( 'x2', xForTime( 0.0 ) )
                                .attr( 'y2', cursorSize.height );

        updateCursor();

    }
    setupCursor();

    function fracForX( x ) {
        return x / $('#fm .horizon').width();
    }
    function timeForX( x ) {
        if ( !hgMean )
            return 0.0;

        return startTime + ( valueUnits * hgMean[0].length ) * fracForX( x );
    }
    function xForTime( t ) {
        if ( !hgMean )
            return 0.0;

        return ( ( t - startTime ) / ( valueUnits * hgMean[0].length ) ) * $('#fm .horizon').width();
    }

    function formatTime( t ) {
        if ( Math.abs( t ) < 1 )
            return t.toPrecision( 3 ) + ' s';
        return t.toPrecision( 4 ) + ' s';
    }

    function updateCursor( x ) {

        updateCursorSize();

        if ( x !== undefined )
            cursorX = x;

        cursorSvg.attr( 'width', cursorSize.width )
                    .attr( 'height', cursorSize.height );

        cursorTimescale.attr( 'width', cursorSize.width );
        cursorTimescaleBorder.attr( 'x2', cursorSize.width );

        if ( ( cursorSize.width - cursorX ) > cursorTextWidthBuffer )
        {
            cursorText.attr( 'x', cursorX + 5 )
                        .attr( 'text-anchor', 'start' )
                        .text( formatTime( timeForX( cursorX ) ) );
        } else {
            cursorText.attr( 'x', cursorX - 5 )
                        .attr( 'text-anchor', 'end' )
                        .text( formatTime( timeForX( cursorX ) ) );
        }
        

        cursorLine.style( 'stroke-opacity', cursorOpacity )
                    .attr( 'x1', cursorX )
                    .attr( 'y1', 0 )
                    .attr( 'x2', cursorX )
                    .attr( 'y2', cursorSize.height );

        cursorLineOrigin.attr( 'x1', xForTime( 0.0 ) )
                        .attr( 'y1', cursorTimescaleHeight )
                        .attr( 'x2', xForTime( 0.0 ) )
                        .attr( 'y2', cursorSize.height );

    }

    function showCursor() {
        $( '#fm .cursor-line' ).show( showDuration );
    }
    function hideCursor() {
        $( '#fm .cursor-line' ).hide( hideDuration );
    }


    function setupBrain() {

        var dataDir = './data/' + subjectName + '/';
        var brainLocation = dataDir + 'brain.png';

        // Setup D3 rendering
        brainSvg = d3.select("#brain").append("svg")
                        .attr("width", brainSize.width + brainMargin.left + brainMargin.right)
                        .attr("height", brainSize.height + brainMargin.top + brainMargin.bottom);
        brainSvg.append("g")
                .attr("transform", "translate(" + brainMargin.left + "," + brainMargin.top + ")");

        // Add brain image
        brainImage = brainSvg.append('g').append('image')
                                            .attr( 'xlink:href', brainLocation )
                                            .attr( 'x', '0' )
                                            .attr( 'y', '0' );

        // Enter data
        brainDots = brainSvg.append("g")
                                .attr("class", "dots")
                            .selectAll(".dot")
                                .data( interpolateData( 0.0 ) )
                            .enter().append("circle")
                            .filter( dotFilter )
                                .attr("class", "dot")
                                .style("fill", dotColor )
                                .style("stroke", dotStroke )
                                .style( 'stroke-width', dotStrokeWidth )
                                .call( dotPosition )
                                .sort( dotOrder );

        // Perform activity rendering / resizing
        updateBrain();

    }

    var cachedFrac = 0.0;

    function updateBrain( frac ) {

        if ( frac === undefined ) {
            frac = cachedFrac;
        } else {
            cachedFrac = frac;
        }

        updateBrainSize();

        // Update SVG
        brainSvg.attr( "width", brainSize.width + brainMargin.left + brainMargin.right )
                .attr( "height", brainSize.height + brainMargin.top + brainMargin.bottom );

        // Update image
        brainImage.attr( 'width', brainSize.width )
                    .attr( 'height', brainSize.height * 1.093 );

        // Update dots
        brainDots.data( interpolateData( frac ) )
                    .style( 'fill', dotColor )
                    .style( 'stroke', dotStroke )
                    .style( 'stroke-width', dotStrokeWidth )
                    .call( dotPosition )
                    .sort( dotOrder );

    }

    var channelPositions = {};

    function loadElectrodes() {

        var dataDir = './data/' + subjectName + '/';
        var montageLocation = dataDir + 'montage.csv';

        $.get( montageLocation, function( data ) {
            var lines = data.split( '\n' );
            lineData = lines.map( function( d ) {
                return d.split( ',' );
            } );

            lineData.forEach( function( d ) {
                if ( d.length > 1 ) {
                    channelPositions[d[0]] = {
                        x: d[1],
                        y: d[2]
                    }
                }
            } );

            setupBrain();
        }) ;

    }

    function lockCursor() {
        cursorLocked = true;
        updateCursor();
    }
    function unlockCursor() {
        cursorLocked = false;
        updateCursor();
    }
    function toggleCursor() {
        if ( cursorLocked ) {
            unlockCursor();
        } else {
            lockCursor();
        }
    }

    $( window ).on( 'resize', cronelib.debounce( updateBrain, 5 ) );
    $( window ).on( 'resize', cronelib.debounce( updateCursor, 5 ) );

    $( '#fm' ).on( 'click', function( event ) {

        if ( animationPlaying ) {
            stopAnimation();
            return;
        }

        toggleCursor();

    } );

    $( '#fm' ).on( 'mouseenter', function( event ) {
        if ( cursorLocked ) {
            // -- //
        } else {
            showCursor();
        }
    } );
    $( '#fm' ).on( 'mouseleave', function( event ) {
        if ( cursorLocked ) {
            // -- //
        } else {
            selectedChannel = null;

            // TODO Set flag for doing integral over whole region
            updateBrain( 0.0 );

            hideCursor();
        }
    } );
    

    /* Fullscreen mode */

    function requestFullscreen( element ) {
        // Set onFullscreenChange to be called once the document goes fullscreen.
        document.addEventListener( 'webkitfullscreenchange', onFullscreenChange );
        document.addEventListener( 'mozfullscreenchange', onFullscreenChange );
        document.addEventListener( 'fullscreenchange', onFullscreenChange );
        document.addEventListener( 'MSFullscreenChange', onFullscreenChange );

        // Actually request fullscreen priviliges for the document
        if( element.requestFullscreen ) element.requestFullscreen();
        else if( element.msRequestFullscreen ) element.msRequestFullscreen();
        else if( element.mozRequestFullScreen ) element.mozRequestFullScreen();
        else if( element.webkitRequestFullscreen ) element.webkitRequestFullscreen();
    }
    function exitFullscreen() {
        if ( document.exitFullscreen ) document.exitFullscreen();
        else if ( document.msRequestFullscreen ) document.msExitFullscreen();
        else if ( document.mozCancelFullScreen ) document.mozCancelFullScreen();
        else if ( document.webkitExitFullscreen ) document.webkitExitFullscreen();
    }
    function toggleFullscreen() {
        if ( isFullscreen() ) {
            exitFullscreen();
        } else {
            requestFullscreen( document.documentElement );
        }
    }

    function isFullscreen() { // Really dumb but compatible
        return document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement;
    }
    function onFullscreenChange() {
        if ( isFullscreen() ) {
            $( '#fullscreen-button-icon' ).text( 'fullscreen_exit' );
        } else {
            $( '#fullscreen-button-icon' ).text( 'fullscreen' );
        }
    }

    $( '#fullscreen-button' ).on( 'click', function( event ) {
        toggleFullscreen();
    } );


    /* Animations */

    var animationPlaying = false;

    function tweenTime() {
        
        var timeOffset = 0.5; // TODO ~Magic~
        
        var timeForTau = d3.interpolate( startTime + timeOffset, startTime + ( valueUnits * hgMean[0].length ) );
        var fracForTau = d3.interpolate( timeOffset / ( valueUnits * hgMean[0].length ), 1.0 );

        return function( tau ) {
            updateBrain( fracForTau( tau ) );
            updateCursor( xForTime( timeForTau( tau ) ) );
        };

    }

    function playAnimation() {

        showCursor();
        lockCursor();
        animationPlaying = true;

        // Change play button appearance
        $( '#play-button-icon' ).text( 'stop' );
        $( '#play-button' ).removeClass( 'light-blue' );
        $( '#play-button' ).addClass( 'yellow' );
        $( '#play-button' ).addClass( 'darken-4' );

        cursorSvg.transition()
                    .duration( 15 * 1000 )  // TODO ~Magic~
                    .ease( 'linear' )
                    .tween( 'time', tweenTime )
                    .each( 'end', stopAnimation );

    }

    function stopAnimation() {

        cursorSvg.transition()
                    .duration( 0 );

        // Change play button appearance
        $( '#play-button-icon' ).text( 'play_arrow' );
        $( '#play-button' ).addClass( 'light-blue' );
        $( '#play-button' ).removeClass( 'yellow' );
        $( '#play-button' ).removeClass( 'darken-4' );

        animationPlaying = false;
        unlockCursor();

    }

    function toggleAnimation() {
        if ( animationPlaying ) {
            stopAnimation();
        } else {
            playAnimation();
        }
    }

    $( '#play-button' ).on( 'click', function( event ) {
        toggleAnimation();
    } );


    // Nothing to export.
    // return;



    /*************************************************************************************/
    /*
    * Brain plotting/visualization
    */
    
    /*
    // make brain image
    var canvas = document.getElementById('canvas-brain');
    // Resize canvas accordingly
    canvas.width = $('#canvas-brain').parent().width();
    var context = canvas.getContext('2d');
    var brainImage = new Image();
    var imageScale = 1;
    var electrodelocations = {};
    brainImage.src = "Brain.png";
    brainImage.onload = function () {
        imageScale = canvas.width / brainImage.width;
        canvas.height = brainImage.height * imageScale;
        context.drawImage( brainImage, 0, 0, brainImage.width * imageScale, brainImage.width * imageScale );

        // I think this is bad style...
        // Read in in electrodes
        $.get( "electrodelocations.txt", function ( data ) {
            drawElectrodes( data );
        } );
    };



    function drawElectrodes(locations) {
        if (locations == undefined) {
            console.log("Electrodes not found");
        }
        var lines = locations.split("\n");
        var n = lines.length;
        var v_offset = canvas.height / n;
        var h_offset = canvas.width / n;
        var scale_factor = 100;
        var radius = 4;
        var electrode, x, y;
        var imgwidth = brainImage.width * imageScale;
        var imgheight = brainImage.height * imageScale
        for (var i = 0; i < lines.length; i++) {
            electrode = lines[i].split(",");
            // What are the airnp, etc. electrodes supposed to be?
            if (electrode.length == 3) {
                x = electrode[1] * imgwidth;
                y = imgheight - electrode[2]*imgheight;
                drawCircle(x, y, radius);
                electrodelocations[electrode[0]] = {
                    "x": x,
                    "y": y,
                    "r": radius,
                };
            }
        }
    }

    function drawCircle(x, y, r) {
        context.beginPath();
        context.arc(x, y, r, 0, 2 * Math.PI);
        context.strokeStyle = '#000000';
        context.fillStyle = '#aded00';
        context.fill();
        context.stroke();
        context.closePath()
    }

    // random mapping
    var channel_electrode_map = {};
    for ( var i = 1; i <= 64; i++ ) {
        channel_electrode_map['E' + i.toString()] = 'RTG' + i.toString();
    }

    function updatebrain(chart) {
        // Update canvas
        canvas.width = $('#canvas-brain').parent().width();
        imageScale = canvas.width / brainImage.width;
        canvas.height = brainImage.height * imageScale;

        var data, electrode;
        // console.log(chart);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(brainImage, 0, 0, brainImage.width * imageScale, brainImage.width * imageScale);
        // deleting background image as well. maybe create another canvas to house
        // the brain image and just have this canvas deal with the electrode plots./
        // Very computationally intensive atm.
        // better option is tio set background static as a css style of canvas element
        for (var i = 0; i < chart.length; i++) {
            data = chart[i].values;
            electrode = electrodelocations[channel_electrode_map[chart[i]['name']]];
            if ( electrode === undefined )
                continue;
            for (var j = 0; j < 1; j++) {
                drawCircle(electrode['x'], electrode['y'], Math.abs(data[j]) * 10);
            }
        }
    }
    */
    

} );