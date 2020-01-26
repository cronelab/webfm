import fs from 'fs'

let subject = ``
let locationFile = fs.readFileSync(`../../data/${subject}/info/electrodeLocations.txt`).toString().split("\n");
let channelFile = fs.readFileSync(`../../data/${subject}/info/channels.json`, 'utf-8')
let channelJSON = JSON.parse(channelFile)
let holder = []
locationFile.forEach(entry => {
	entry.split(' ').forEach((blob, index) => {
		if (blob.length > 0 && index > 2) {
			holder.push(blob)
		}
	})
})
let electrode;
let location;
// fs.writeFile(`../../data/${subject}/info/anatomicalLocations_${subject}.txt`, `Anatomical location data for ${subject}\n\n`, { flag: "a+" }, err => { if (err) throw err })

holder.forEach((data, i) => {
	if (i % 2 == 0) {
		electrode = `${data}`

	}	// console.log(`${location}`)
	else if (i % 2 == 1) {
		location = `${electrode}: ${data}\n`
		channelJSON[electrode]['location'] = data
		// fs.writeFile(`../../data/${subject}/info/anatomicalLocations_${subject}.txt`, location, { flag: "a+" }, err => {
		// 	if (err) throw err
		// })
	}
})
fs.writeFileSync(`../../data/${subject}/info/channels.json`, JSON.stringify(channelJSON), err => {
	if (err) throw err
})