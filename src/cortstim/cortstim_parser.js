var fs = require('fs');
var textFile = fs.readFileSync('PY19N005_1.txt').toString()
firstSegment = textFile.split("Stimulated Electrodes");
var BreakException = {};
firstSegment.forEach((x, i) => {
    try {
        if (i == 0) {
            throw BreakException
        };
        let trialNum = i;
        let electrodes = x.split("\n")[0].split("=")[1].split("-")
        let electrode1 = electrodes[0].replace(/ /g,'')
        let electrode2 = electrodes[1].replace(/ /g,'')
        let intensity = x.split("\n")[1].split("=")[1].split(" ")[1]
        let duration = x.split("\n")[2].split("=")[1].split(" ")[1]
        let modality = x.split("\n")[3].split("=")[1].replace(/ /g,'')
        let response = x.split("\n")[4].split("=")[1].split(" ")[1].replace(/ /g,'')

        console.log(i)

        //Log electrode 1 and 2
        console.log(electrode1)
        console.log(electrode2)
        
        //Log intensity in mA
        // console.log(intensity)

        //Log duration of stimulus in seconds
        // console.log(duration)

        // Log modality of stimulus presentation
        // console.log(modality)

        //Log result
        // console.log(response)
    } catch (e) {

    }
})