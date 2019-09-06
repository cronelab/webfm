import re
import pandas as pd

stimElectrodes = []
with open('PY19N005_1.txt')as file:
    fileContents = file.read()
    entries = fileContents.split('Stimulated Electrodes =')
    for idx, entry in enumerate(entries):
        stimElectrodes.append(entry.split('Stimulation Intensity')[0].split(' - '))
        # print(entry.split('Stimulation Intensity'))
        # print(stimElectrodes)
        # print(idx)
        # elec1 = stimElectrodes[0].replace(" ","")
        # elec2 = stimElectrodes[1].replace(" ","")
# print(stimElectrodes[1])

entry1 = entries[1]
print(entry1.split("Stimulation Intensity")[0])
print(entry1.split("Stimulation Duration")[0])
print(entry1.split("Modality")[0])
