#!/usr/bin/env python3
'''
webfm.export
numpy -> WebFM
'''


## IMPORTS

# Standard library
import os

import tempfile
import base64
import csv
import json

# Numeric stack
import numpy as np


## MEAT

def _load_file_numpy( path ):
    '''
    ...
    '''

    pass


def _preprocess_image( image_path ):
    'Encode image data as web-compatible base64'

    image_format = 'data:image/{ext};base64,{data}'
    image_ext = os.path.splitext( image_path )[1]
    
    image_string = ''

    with open( image_path, 'rb' ) as image_file:
        image_encoded = base64.b64encode( image_file.read() )
        image_string = image_format.format( ext = image_ext, data = image_encoded.decode( 'utf8' ) )

    return image_string


def _preprocess_sensor_geometry( geometry_path ):
    'Encode CSV sensor locations as name -> { u, v } or name -> { u, v, w }'

    geometry_data = {}

    with open( geometry_path, 'r' ) as geometry_file:

        geometry_reader = csv.reader( geometry_file )

        for row in geometry_reader:

            if len( row ) < 1:
                # Blank row
                continue

            channel_name = row[0].strip()

            if channel_name == '':
                # Channe name is empty, so we can't key on it; ignore
                continue

            if len( row ) < 3:
                # Data is stored as CHANNEL, U, V | ergo, something went wrong here
                # TODO Correct format is {}, or { 'u': None, 'v': None } ??
                geometry_data[ channel_name ] = {}
                continue
            
            # No errors, so everything worked!
            geometry_data[ channel_name ] = { 'u': float( row[1] ), 'v': float( row[2] ) }

    return geometry_data


def _preprocess_metadata( metadata ):
    'Handle special _export flags in the metadata structure'

    # Copy input data
    new_metadata = dict( metadata )

    if '_export' in new_metadata:
        # Special flags for items to be handled by the exporter routine

        export_data = new_metadata['_export']

        # Check each of the special flags that are set:
        for export_key, export_value in export_data.items():

            if export_key.lower() == 'brainimage':
                # Path to brain image for conversion to base64 string
                new_metadata['brainImage'] = _preprocess_image( os.path.abspath( export_value ) )
            
            if export_key.lower() == 'sensorgeometry':
                # Path to montage CSV file
                new_metadata['sensorGeometry'] = _preprocess_sensor_geometry( os.path.abspath( export_value ) )

            # Future special export flags
            # if export_key.lower() == '...':

        # Now finished with the relevant _export flags; kill them!
        del new_metadata['_export']

    return new_metadata


def from_files( spec, output_path,
                montage = None,
                metadata = {} ):
    '''
    ...
    '''

    # Pattern: Convert individual files from spec into arrays, then call from_arrays

    data = {}
    for data_key, data_path in spec.items():
        
        # Decide which data loader to call based on file extension
        # TODO Provide mechanism to specify manually?
        data_ext = os.path.splitext( data_path )[1]     # (path, extension)

        if data_ext == '.npy' or data_ext == '.npz':
            loader = _load_file_numpy

        # TODO Implement other loaders
        # elif data_ext == '...':

        else:
            # Input data file is in an unrecognized format; skip
            print( 'Could not load data file: {0}'.format( data_path ) )
            print( '  Unrecognized data format.' )
            continue
        
        try:
            data[ data_key ] = loader( path )
        except Exception as err:
            print( 'Could not load data file: {0}'.format( data_path ) )
            print( '  {0}'.format( err ) )

    return from_arrays( data, output_path,
                        metadata = metadata )


def _reformat_array( array, montage ):
    'Turns a numpy array with the given montage on the first axis into a data entry'
    return { derivation : array[i].tolist() for i, derivation in enumerate( montage ) }


def _conflicting_keys( a, b ):
    'Return overlapping non-matching keys'
    return [ item[0] for item in filter( lambda i : not i[1] == b[ i[0] ],
                                         filter( lambda i : i[0] in b,
                                                 a.items() ) ) ]

def write_datafile( fp, contents, metadata ):
    '''
    ...
    '''
    # Debug: pretty-print
    #json.dump( { 'metadata' : metadata, 'contents' : contents }, fp,
    #           indent = 4,
    #           sort_keys = True )
    
    # Normal
    json.dump( { 'metadata' : metadata, 'contents' : contents }, fp )

def write_metadata( fp, metadata ):
    '''
    ...
    '''
    json.dump( metadata, fp,
               indent = 4,
               sort_keys = True )

def write_arrays( contents,
                  output_path = None,
                  output_file = None,
                  montage = None,
                  metadata = {} ):
    '''
    Export data to .fm format from numpy ndarray objects.
    '''

    if output_file is None:
        # Generate output file from output path
        output_file = open( output_path, 'w' )

    if montage is None:
        # No montage provided, so try to infer
        if 'montage' in metadata:
            # Can infer montage from metadata
            montage = metadata['montage']
        else:
            # Can't infer montage
            raise RuntimeError( 'Cannot infer montage for numpy array conversion.' )

    # Reformat numpy contents into final structure
    new_contents = {}
    for content_name, content_array in contents.items():
        new_contents[content_name] = _reformat_array( content_array, montage )

    # Put override montage in metadata, if not specified already
    if 'montage' not in metadata:
        metadata['montage'] = montage

    # Write the data
    write_datafile( output_file, new_contents, metadata )


def bundle_arrays( member_contents, output_path,
                   member_metadata = None,
                   metadata = {} ):
    '''
    ...
    '''

    # Pattern: Export data as temp-files, then bundle them
    # TODO Pretty dumb pattern

    # TODO member_contents is assumed to be output_name -> contents
    # TODO member_metadata is assumed to be output_name -> metadata

    member_tempfiles = {}

    for output_name, contents in member_contents.items():

        cur_metadata = member_metadata[output_name]

        # Trust montage in member_metadata if it is set; otherwise attempt to use common montage
        # TODO Will not gracefully fail if no montage is provided
        montage = None if 'montage' in cur_metadata else metadata['montage']

        # Write member to tempfile
        
        cur_tempfile = tempfile.NamedTemporaryFile( mode = 'w+' )
        #cur_tempfile = open( './tmp_{0}'.format( output_name ), 'w+' )
        member_tempfiles[output_name] = cur_tempfile
        write_arrays( contents,
                      output_file = cur_tempfile,
                      montage = montage,
                      metadata = cur_metadata )
        cur_tempfile.flush()

    # Bundle tempfiles to proper output path
    file_spec = { output_name: tf.name for output_name, tf in member_tempfiles.items() }
    bundle_files( file_spec, output_path,
                  metadata = metadata )

def bundle_files( file_spec, output_path,
                  metadata = {} ):
    '''
    ...
    '''

    # TODO Magic numbers
    metadata_filename = '.metadata'

    # A helpful lambda 
    # split returns (head, tail); splitext returns (path, ext)
    get_name = lambda path : os.path.splitext( os.path.split( path )[1] )[0]

    bundle_name = get_name( output_path )

    # Ensure proper formatting of file_spec

    if type( file_spec ) is str:
        # Turn a string spec into a list spec
        file_spec = [ file_spec ]

    if type( file_spec ) is list:
        # Turn a list spec into a dict spec
        file_spec = { get_name( path ) : path for path in file_spec }

    if type( file_spec ) is not dict:
        raise TypeError( 'Unsupported file_spec for bundle_files: {0}'.format( type( file_spec ) ) )

    # Preprocess the common metadata
    common_metadata = _preprocess_metadata( metadata )

    # Make sure that the output bundle directory exists
    os.makedirs( output_path, exist_ok = True )

    # Write the common metadata file
    metadata_path = os.path.join( output_path, metadata_filename )
    metadata_relpath = os.path.join( '.', metadata_filename )
    with open( metadata_path, 'w' ) as metadata_file:
        write_metadata( metadata_file, common_metadata )

    # file_spec is now a output_name -> input_path dict
    for output_name, input_path in file_spec.items():
        
        cur_output_path = os.path.join( output_path, output_name, '.fm' )

        with open( input_path, 'r' ) as input_file:
            
            # Deserialize JSON
            cur_object = json.load( input_file )
            cur_metadata = cur_object['metadata']
            cur_contents = cur_object['contents']

            # Warn against metadata conflicts
            meta_conflicts = _conflicting_keys( cur_metadata, common_metadata )
            if meta_conflicts:
                print( 'WARNING: Conflicting metadata keys for input file {0}'.format( input_path ) )
                print( '  {0}'.format( meta_conflicts ) )
            
            # Link metadata
            if '_import' in cur_metadata:
                cur_import = cur_metadata['_import']
                if type( cur_import ) is str:
                    # Need to re-set as list and append
                    cur_metadata['_import'] = [ cur_import, metadata_relpath ]
                if type( cur_import ) is list:
                    # Just need to append
                    cur_metadata['_import'] += [ metadata_relpath ]
            else:
                cur_metadata['_import'] = metadata_relpath
            
            # Write to bundle
            with open( os.path.join( output_path, '{0}.fm'.format( output_name ) ), 'w' ) as output_file:
                write_datafile( output_file, cur_contents, cur_metadata )


## MAIN

def main():
    
    # Run a test export

    output_path = './test/test.fmbundle'

    fs = int( 1000 / 8 )
    t0 = -1.0

    n_channels = 128
    n_time = fs * 1
    n_trials = 60

    channels = [ 'chan{0:02d}'.format( i ) for i in range( 1, n_channels + 1 ) ]
    channels_bipolar = [ '{0},{1}'.format( channels[i], channels[i+1] ) for i in range( len( channels ) - 1 ) ]

    t_vector = t0 + (1/fs) * np.arange( n_time )

    metadata_1 = {
        'feature'   : 'high gamma (70-110 Hz) power',
        'kind'      : 'timeseries',
        'times'     : [ t for t in t_vector ],
        'montage'   : channels
    }

    metadata_2 = {
        'feature'       : 'event-related potential',
        'kind'          : ['potential', 'bipolar', 'timeseries'],
        'timeStart'     : t0,
        'timeStep'      : 1 / fs,
        'montage'       : channels_bipolar
    }

    member_metadata = {
        'data1' : metadata_1,
        'data2' : metadata_2
    }

    bundle_metadata = {
        'subject'       : 'TEST_SUBJECT',
        'label'         : 'SignalGenerator',
        'displayOrder'  : [ 'data1', 'data2' ],
        '_export' : {
            'brainImage'        : './test/kitten.png',
            'sensorGeometry'    : './test/sensors.csv'
        }
    }

    trials_1 = np.zeros( (n_channels, n_trials, n_time) )
    for i_ch, ch in enumerate( channels ):
        for i_trial in range( n_trials ):
            trials_1[i_ch, i_trial, :] = np.sin( t_vector ) + np.random.normal( t_vector.shape )
    mean_1 = np.mean( trials_1, axis = 1 )
    std_1 = np.std( trials_1, axis = 1 )

    trials_2 = np.zeros( (n_channels, n_trials, n_time) )
    for i_ch, ch in enumerate( channels_bipolar ):
        for i_trial in range( n_trials ):
            trials_2[i_ch, i_trial, :] = np.cos( t_vector ) + np.random.normal( t_vector.shape )
    mean_2 = np.mean( trials_2, axis = 1 )
    std_2 = np.std( trials_2, axis = 1 )

    contents_1 = {
        'mean'      : mean_1,
        'stdev'     : std_1,
        #'trials'    : trials_1
    }

    contents_2 = {
        'mean'      : mean_2,
        'stdev'     : std_2,
        #'trials'    : trials_2
    }

    member_contents = {
        'data1' : contents_1,
        'data2' : contents_2
    }

    bundle_arrays( member_contents, output_path,
                   member_metadata = member_metadata,
                   metadata = bundle_metadata )


## ENTRY

if __name__ == '__main__':
    main()


#
