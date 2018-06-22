// ======================================================================== //
//
// index/main
// Main entry for WebFM dashboard (index.html).
//
// ======================================================================== //


// REQUIRES

var path        = require( 'path' );
var $           = require( 'jquery' );
var bciwatch    = require( './bciwatch' );
var Cookies     = require( 'js-cookie' );

// INIT

var knownSubjects   = undefined;
var subjectRecords  = undefined;

var apiPath         = '/api';
var configPath      = '/index/config';

var parameterRecheckDuration    = 2000;

// BCI2K state watch setup
var bciWatcher      = null;

// HELPERS
var removeNewlines = function( s ) {
    return s.replace( /(\r\n|\n|\r)/gm, '' );
};

// Handling configuration cookies

var getSourceAddress = function() {

    return new Promise( function( resolve, reject ) {

        var sourceAddress = Cookies.get( 'sourceAddress' );

        if ( sourceAddress === undefined ) {

            var configURI = path.join( configPath, 'online' );

            $.getJSON( configURI )
                .done( function( data ) {
                    // Set the cookie for the future, so we can get it directly
                    Cookies.set( 'sourceAddress', data.sourceAddress );
                    // Resolve to the value
                    resolve( data.sourceAddress );
                } )
                .fail( function( req, reason, err ) {
                    // TODO Get error message from jquery object
                    reject( 'Could not load watcher config from ' + configURI + ' : ' + reason );
                } );
        }
        resolve( sourceAddress );
    } );
};

var setSourceAddress = function( newSourceAddress ) {
    Cookies.set( 'sourceAddress', newSourceAddress );
};


// Handling BCI2K

var setupWatcher = function() {

    bciWatcher = new bciwatch.BCI2KWatcher();

    // Set up state change callback
    bciWatcher.onstatechange = bciStateChange;

    bciWatcher.loadConfig( path.join( configPath, 'online' ) )
                .then( function() {
                    return getSourceAddress();
                } )
                .then( function( localSourceAddress ) {
                    return bciWatcher.connect( localSourceAddress );
                } )
                .then( function( connectionEvent ) {
                    bciWatcher.start();
                } )
                .catch( function( reason ) {
                    console.log( 'Could not set up BCI Watcher: ' + reason );      // TODO Respond intelligently
                } );

};

// TODO
var goLiveStates    = [ 'Suspended', 'Running' ];
//var mapItStates     = [ 'Idle', 'Suspended', 'Running' ];
var mapItStates     = [ 'Running' ];
var infoStates      = [ 'Suspended', 'Running' ];

// TODO Shouldn't have to edit JS to change look and feel ...
// should use special-purpose CSS classes
var stateClasses    = {
    'Not Connected' : 'text-muted',
    'Idle'          : 'text-info',
    'Suspended'     : 'text-warning',
    'Running'       : 'text-success'
};

var clearTaskDetails = function() {
    $( '#subject-label' ).html( '' );
};

var getSubjectName = function() {

    bciWatcher.getParameter( 'SubjectName' )
                .then( function( subjectName ) {

                    if ( subjectName.length == 0 ) {
                        // Parameter not set

                        $( '#subject-label' ).html( '<small>(No SubjectName set.)</small>' );

                        // TODO The fact that there's this awkward magic number
                        // use suggests that this is a bad way to do this ...
                        setTimeout( function() {
                            getSubjectName();
                        }, parameterRecheckDuration );

                        return;
                    }

                    $( '#subject-label' ).html( subjectName );

                } )
                .catch( function( reason ) {

                    console.log( reason );      // TODO Handle

                } );

};

var getTaskName = function() {

    bciWatcher.getParameter( 'DataFile' )
                .then( function( data ) {

                    if ( data.length == 0 ) {
                        // Parameter not set

                        $( '#task-label' ).html( '<small>(No DataFile set.)</small>' );

                        // TODO The fact that there's this awkward magic number
                        // use suggests that this is a bad way to do this ...
                        setTimeout( function() {
                            getTaskName();
                        }, parameterRecheckDuration );

                        return;
                    }

                    // TODO Is this format universal?
                    var dataPathParts = data.split( path.sep );
                    var taskName = dataPathParts[1];    // i.e., subject/task/...

                    $( '#task-label' ).html( taskName );

                } )
                .catch( function( reason ) {

                    console.log( reason );      // TODO Handle

                } );

};


var bciStateChange = function( newState ) {

    // Update state label text
    $( '#state-label' ).html( '<strong>' + newState + '<strong>' );

    // Set correct state class
    $.map( stateClasses, function( v, k ) {
        if ( newState == k ) {
            $( '#state-label' ).addClass( v );
            return;
        }
        $( '#state-label' ).removeClass( v );
    } );

    // Encourage mapping when appropriate
    if ( mapItStates.indexOf( newState ) >= 0 ) {
        $( '#map-button' ).removeClass( 'disabled' );
    } else {
        $( '#map-button' ).addClass( 'disabled' );
    }

    if ( goLiveStates.indexOf( newState ) >= 0 ) {
        $( '#live-button' ).removeClass( 'disabled' );
    } else {
        $( '#live-button' ).addClass( 'disabled' );
    }

    // Attempt to get subject and task info if available
    if ( infoStates.indexOf( newState ) >= 0 ) {

        $( '#info-label' ).removeClass( 'hidden' );

        getSubjectName();

        getTaskName();

    } else {

        $( '#info-label' ).addClass( 'hidden' );

        clearTaskDetails();

    }

};


// GUI Helpers

var updateMainBrain = function( brainData ) {
    // We can directly add the base64 image data. Science!
    $( '#main-brain' ).attr( 'src', brainData );
};
var updateCCEPS = function( brainData ) {
    // We can directly add the base64 image data. Science!
    $( '#main-brain2' ).attr( 'src', brainData );
};

var addRecordCell = function( subject, record ) {
    // TODO Need to incorporate number of members for badge
    // TODO Could fail if record is badly named
    $( '<a/>', {
        id:     record,
        href:   path.join( '/', 'map', subject, record ),
        class:  'list-group-item',
        text:   record
    } ).appendTo( '#record-list' );
};
// TODO Better way to curry?
var recordCellAdderFor = function( subject ) {
    return function( record ) {
        addRecordCell( subject, record );
    };
};

var addSubjectCell = function( subject ) {

    var cellClick = function() {
        selectSubject( subject );
    };

    // TODO Need to incorporate number of members for badge
    $( '<a/>', {
        id:     subject,
        href:   '#' + subject,
        class:  'list-group-item',
        text:   subject,
        on: {
            click: cellClick
        },
        onclick: "document.cookie='WebFM: Map'"
    } ).appendTo( '#subject-list' );

};

var loadBrain = function( subject ) {

    var brainPath = path.join( apiPath, 'brain', subject );

    $.get( brainPath )
        .done( function( brainData ) {

            // Update the main brain image
            updateMainBrain( removeNewlines( brainData ) );

        } )
        .fail( function( req, status, err ) {

            console.log( err );

            if ( req.status == 418 ) {  // I'm a teapot (subject exists, but not brain)

                // On 418 we still get a brain back
                var brainData = req.responseText;
                updateMainBrain( removeNewlines( brainData ) );

            }

        } );

};


// Main logic

var clearRecords = function() {
    $( '#record-list' ).empty();
}

var loadRecords = function( subject ) {

    var listPath = path.join( apiPath, 'list', subject );

    $.getJSON( listPath )
        .done( function( records ) {

            // Ensure consistent ordering
            records.sort();

            // Update the DOM for the record list
            records.forEach( recordCellAdderFor( subject ) );

        } )
        .fail( function( req, textStatus, err ) {

            // TODO Handle errors
            console.log( err );

        } );

};

var selectSubject = function( subject ) {

    // Deselect everyone
    $( '#subject-list' ).children().removeClass( 'active' );

    if ( subject.length == 0 ) {
        // Nothing we can do.
        return;
    }

    // Re-select current
    $( '#' + subject ).addClass( 'active' );

    // Clear records for a clean slate
    clearRecords();

    // Load the records from the server API
    loadRecords( subject );

    // Load the brain image from the server API
    loadBrain( subject );

};

var loadSubjects = function() {

    var listPath = path.join( apiPath, 'list' );

    $.getJSON( listPath )
        .done( function( subjects ) {

            // Ensure consistent ordering
            subjects.sort();

            // Update the DOM for the subject list
            subjects.forEach( addSubjectCell );

            // Check for a hash
            // TODO Only do this on load?
            selectFromHash( window.location.hash );

        } )
        .fail( function( req, textStatus, err ) {

            // TODO Handle errors
            console.log( err );

        } );

};

var selectFromHash = function( hash ) {

    // window.location.hash has a '#' at the front, so clip it
    var hashSubject = hash.slice( 1 );

    selectSubject( hashSubject );

};


var setupOnlineOptions = function() {

    // Setup form values
    getSourceAddress()
        .then( function( sourceAddress ) {
            $( '#source-address' ).val( sourceAddress );
        } )
        .catch( function( reason ) {
            console.log( 'Could not get source address for display: ' + reason );
        } );

};


// TODO Duplication

var showOnlineOptions = function() {
    $( '#online-options' ).removeClass( 'hidden' );
};
var hideOnlineOptions = function() {
    $( '#online-options' ).addClass( 'hidden' );
};
var toggleOnlineOptions = function() {
    if ( $( '#online-options' ).hasClass( 'hidden' ) ) {
        showOnlineOptions();
    } else {
        hideOnlineOptions();
    }
};

var showNewSubject = function() {
    $( '#new-subject-options' ).removeClass( 'hidden' );
};
var hideNewSubject = function() {
    $( '#new-subject-options' ).addClass( 'hidden' );
};
var toggleNewSubject = function() {
    if ( $( '#new-subject-options' ).hasClass( 'hidden' ) ) {
        showNewSubject();
    } else {
        hideNewSubject();
    }
};


var updateSourceAddress = function( newSourceAddress ) {
    // Update cookie with new value
    setSourceAddress( newSourceAddress );
    // Reset our connection
    bciWatcher.stop();
    setupWatcher();
};

var addSubject = function( subjectId ) {
    // Make call
    $.ajax( {
        url: path.join( apiPath, 'data', subjectId ),
        method: 'PUT'
    } ).done( function( data, status, xhr ) {
        console.log( status );
        console.log( data );
    } ).fail( function( xhr, status, err ) {
        console.log( status );
        console.log( xhr.responseText );
    } );
};

$( '#CCEPS_RUN' ).on( 'click', function() {

    updateCCEPS

} );


$( '#source-address-ok' ).on( 'click', function() {
    // Get new value from form
    var newSourceAddress = $( '#source-address' ).val();
    updateSourceAddress( newSourceAddress );
    //
    hideOnlineOptions();
} );

$( '.toggle-online-options' ).on( 'click', function() {
    toggleOnlineOptions();
} );

$( '#new-subject-ok' ).on( 'click', function() {
    var newSubjectId = $( '#new-subject-id' ).val();
    addSubject( newSubjectId );
} );

$( '.toggle-new-subject' ).on( 'click', function() {
    toggleNewSubject();
} );


$( '.upload-sensor-geometry' ).on( 'click', function() {

    // Trigger the file uploader element
    $( '#upload-sensor-geometry-input' ).click();

    // TODO GUI Changes

} );

$( '#upload-sensor-geometry-input' ).on( 'change', function() {

    console.log( 'PUTTING GEOMETRY' );

    var files = $( this ).get( 0 ).files;

    // TODO This will fail in certain obvious cases; should be caching a
    // current subject state variable
    var subject = window.location.hash.slice( 1 );

    if ( files.length > 0 ) {

        var file = files[0];

        // FormData carries the payload for our PUT request
        var formData = new FormData();

        // We only care about the first file
        // TODO Get name from jquery element somehow?
        formData.append( 'sensorGeometry', file, file.name );

        // Make an AJAX request

        $.ajax( {
            url: path.join( apiPath, 'geometry', subject ),
            method: 'PUT',
            data: formData,
            processData: false,
            contentType: false
        } ).done( function( data, status, xhr ) {

            // Reload the newly uploaded brain
            selectSubject( subject );

        } ).fail( function( xhr, status, err ) {

            // TODO GUI for error
            console.log( 'Upload failed :( ' + JSON.stringify( err ) );
        } );
    }
} );


$( '.upload-brain-image' ).on( 'click', function() {

    // Trigger the file uploader element
    $( '#upload-brain-image-input' ).click();

    // TODO GUI Changes

} );

$( '#upload-brain-image-input' ).on( 'change', function() {

    var files = $( this ).get( 0 ).files;

    // TODO This will fail in certain obvious cases; should be caching a
    // current subject state variable
    var subject = window.location.hash.slice( 1 );

    if ( files.length > 0 ) {

        var file = files[0];

        // FormData carries the payload for our PUT request
        var formData = new FormData();

        // We only care about the first file
        // TODO Get name from jquery element somehow?
        formData.append( 'brainImage', file, file.name );

        // Make an AJAX request

        $.ajax( {
            url: path.join( apiPath, 'brain', subject ),
            method: 'PUT',
            data: formData,
            processData: false,
            contentType: false
        } ).done( function( data, status, xhr ) {

            // Reload the newly uploaded brain
            selectSubject( subject );

        } ).fail( function( xhr, status, err ) {

            // TODO GUI for error
            console.log( 'Upload failed :( ' + JSON.stringify( err ) );
        } );
    }
} );

$( window ).on( 'load', function() {
    loadSubjects();
    setupOnlineOptions();
    setupWatcher();
} );
