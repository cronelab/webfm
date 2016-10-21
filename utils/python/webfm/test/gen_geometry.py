#!/usr/bin/env python3

import csv
import numpy as np

n = 16
channels = [ 'chan{0:02d}'.format( i ) for i in range( 1, n + 1 ) ]

del_channels = [ 4, 8 ]

channel_x = 0.5 + 0.5 * np.cos( np.arange( n ) )
channel_y = 0.5 + 0.5 * np.sin( np.arange( n ) )

for c in del_channels:
    del channels[c]

channel_slice = np.array( [ i not in del_channels for i in range( n ) ] )
channel_x = channel_x[ channel_slice ]
channel_y = channel_y[ channel_slice ]

with open( 'sensors.csv', 'w' ) as f:
    writer = csv.writer( f )
    for i in range( len( channels ) ):
        writer.writerow( [ channels[i], channel_x[i], channel_y[i] ] )
