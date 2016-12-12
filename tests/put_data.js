var http = require( 'http' );

var options = {
    host: 'localhost',
    path: '/api/data/PY16N006/NamingPriming1',
    //path: '/api/data/TEST_SUBJECT_2/TEST_TASK_1',
    //path: '/api/geometry/TEST_SUBJECT',
    port: '54321',
    method: 'GET'
    //method: 'PUT',
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

//var data = 'CH01,0.1,0.2\nCH02,0.3,0.4\nCH03,0.5,0.6';

var req = http.request( options, callback );
//req.write( JSON.stringify( data ) );
//req.write( data );
req.end();