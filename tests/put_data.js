var http = require( 'http' );

var options = {
    host: 'localhost',
    path: '/api/data/TEST_SUBJECT_2',
    port: '54321',
    method: 'PUT'
};

callback = function( response ) {

    var str = '';

    response.on( 'data', function ( chunk ) {
        str += chunk;
    } );

    response.on( 'end', function () {
        console.log( str );
    } );
}

var data = {
    metadata: {
        feature: 'ERP',
        montage: ['CH01', 'CH02', 'CH03'],
        kind: 'timeseries'
    },
    contents: {
        values: {
            'CH01': [1,2,3,4,5],
            'CH02': [1,2,3,4,5],
            'CH03': [1,2,3,4,5]
        },
        times: [0, 0.2, 0.4, 0.6, 0.8]
    }
};

var req = http.request( options, callback );
//req.write( JSON.stringify( data ) );
req.end();