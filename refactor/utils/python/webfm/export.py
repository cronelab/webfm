#!/usr/bin/env python3
'''
webfm.export
numpy -> WebFM
'''


## IMPORTS

# Standard library
import os

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

            channel_name = row[0].trim()

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
                new_metadata['brainImage'] = _preprocess_image( os.abspath( export_value ) )
            
            if export_key.lower() == 'sensorgeometry':
                # Path to montage CSV file
                new_metadata['sensorGeometry'] = _preprocess_sensor_geometry( os.abspath( export_value ) )

            # Future special export flags
            # if export_key.lower() == '...':

        # Now finished with the relevant _export flags; kill them!
        del metadata['_export']

    return metadata


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


def from_arrays( data, montage, output_path,
                 metadata = {} ):
    '''
    Export data to .fm format from numpy ndarray objects.
    '''

    # ...


def bundle_files( file_spec, output_path,
                  metadata = {} ):
    '''
    ...
    '''

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
        raise TypeError( 'Unsupported file_spec for bundle_files: {0}'.format( type( file_spec ) )

    # Preprocess the common metadata
    common_metadata = _preprocess_metadata( metadata )

    # Make sure that the output bundle directory exists
    os.makedirs( output_path, exist_ok = True )

    # Write the common metadata file
    metadata_path = os.path.join( output_path, '.metadata' )
    with open( metadata_path, 'w' ) as metadata_file:
        json.dump( common_metadata, metadata_file )

    # file_spec is now a output_name -> input_path dict
    for output_name, input_path in file_spec.items():
        
        cur_output_path = os.path.join( output_path, output_name, '.fm' )

        with open( input_path, 'r' ) as input_file:
            
            cur_data = json.load( input_file )      # Deserialize JSON
            cur_data['metadata'] = './.metadata'    # Replace metadata with relpath to common metadata
            
            # Write to bundle
            with open( os.path.join( output_path, output_name, '.fm' ), 'w' ) as output_file:
                json.dump( cur_data, output_file )


## MAIN

def main():
    
    # Run a test export
    


## ENTRY

if __name__ == '__main__':
    main()


#
