# Electrode marker

- These scripts were created by Yujing Wang circa ~2016

- Matlab interface to load in a brain image (.jpg screenshot exposing entire brain with white electrode markers on it) and an array of electrode names.
- Start the GUI, load the two files, click the electrodes.
- This will export 2? csv files. One is for CCEPS, the other for WebFM.

- brainImage = imread('PYXXX.jpg')
- store brainImage variable as brainImage.mat, place in SubjectData directory
- Create a channel# x 1 cell and populate it with the channel names and save it as channelNames
- store the channelNames variable as channelNames.mat
- Run ExtractSensorLoc.m, load up your files, click to your hearts delight.