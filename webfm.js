// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config( {
    baseUrl: 'lib',

    paths: {
        app:                '../app',
        jquery:             '../../bower_components/jquery/dist/jquery',
        jdataview:          '../../bower_components/jdataview/dist/browser/jdataview',
        //bootstrap:          'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js',
        materialize:        'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.6/js/materialize.min',

        // D3 Stuff
        d3:                 'https://d3js.org/d3.v3.min',
        'd3-selection':     'https://d3js.org/d3-selection.v0.6.min',
        'd3-array':         'https://d3js.org/d3-array.v0.7.min',
        'd3-collection':    'https://d3js.org/d3-collection.v0.1.min',
        'd3-color':         'https://d3js.org/d3-color.v0.4.min',
        'd3-format':        'https://d3js.org/d3-format.v0.5.min',
        'd3-interpolate':   'https://d3js.org/d3-interpolate.v0.7.min',
        'd3-time':          'https://d3js.org/d3-time.v0.2.min',
        'd3-time-format':   'https://d3js.org/d3-time-format.v0.3.min',
        'd3-scale':         'https://d3js.org/d3-scale.v0.6.min',
        'd3-axis':          'https://d3js.org/d3-axis.v0.3.min',
        'd3-queue':         'https://d3js.org/d3-queue.v2.min',
        'd3-dispatch':      'https://d3js.org/d3-dispatch.v0.4.min',
        'd3-dsv':           'https://d3js.org/d3-dsv.v0.3.min',
        'd3-request':       'https://d3js.org/d3-request.v0.4.min',
        'd3-horizon-chart': 'https://npmcdn.com/d3-horizon-chart/build/d3-horizon-chart.min',
        
        // Local stuff
        // bci2kconfig:        '../../system/bci2kconfig.js'
    },

    shim: {
        //bootstrap: { deps: ['jquery'] },
        materialize: { deps: ['jquery'] },

        /*
        d3_selection: { exports: 'd3_selection' },
        d3_array: { exports: 'd3_array' },
        d3_ollection: { exports: 'd3_collection' },
        d3_color: { exports: 'd3_color' },
        d3_format: { exports: 'd3_format' },
        d3_interpolate: { exports: 'd3_interpolate' },
        d3_color: { exports: 'd3_color' },
        */

        'd3-horizon-chart': {
            deps: ['d3', 'd3-selection', 'd3-array', 'd3-collection',
                'd3-color', 'd3-format', 'd3-interpolate', 'd3-time',
                'd3-time-format', 'd3-scale', 'd3-axis', 'd3-queue',
                'd3-dispatch', 'd3-dsv', 'd3-request' ],
            exports: 'd3_horizon_chart'
        }
    }
} );

// Start loading the main app file.
requirejs( ['app/main'] );