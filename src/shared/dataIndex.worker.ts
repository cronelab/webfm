const ctx: Worker = self as any;


ctx.onmessage = e => {
	dataForTime(e.data.displayData, e.data.time, e.data.dataWindow)
}

const dataForTime = (displayData: any, time: any, dataWindow: any) => {
	var dataSamples = 0;
	Object.keys(displayData).every(function (ch) {
		dataSamples = displayData[ch].length;
		return false;
	});
	var timeIndexFloat = ((time - dataWindow.start) / (dataWindow.end - dataWindow.start)) * dataSamples;
	var timeIndex = Math.floor(timeIndexFloat);
	var timeFrac = timeIndexFloat - timeIndex;
	let disp = Object.keys(displayData).reduce(function (obj: any, ch: any) {
		let ins = displayData[ch]
		obj[ch] = (1.0 - timeFrac) * ins[timeIndex] + (timeFrac) * ins[timeIndex + 1];
		return obj
	}, {});
	ctx.postMessage(disp);

}

export default {} as typeof Worker & (new () => Worker);
