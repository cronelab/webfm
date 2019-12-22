import {
	scaleLinear,
} from 'd3-scale';
import {
	select
} from "d3-selection";
import {
	line
} from "d3-shape";
import {
	axisBottom,
	axisLeft
} from "d3-axis";
class fmscope {
	scoping: any;
	channel: any;
	data: any;
	dataExtent: any;
	targetExtent: any;
	extentSnap: any;
	windowSamples: any;
	plotHeight: any;
	plotMargin: any;
	plotSvg: any;
	plotXScale: any;
	plotYScale: any;
	plotLine: any;
	plotXAxis: any;
	plotYAxis: any;
	constructor() {
		this.scoping = false;
		this.channel = null;
		this.data = null;
		this.dataExtent = null;
		this.targetExtent = null;
		this.extentSnap = 0.25;
		this.windowSamples = 2500;
		this.plotHeight = 250;
		this.plotMargin = {
			left: 50,
			right: 40,
			top: 10,
			bottom: 20
		};
		this.plotSvg = null;
		this.plotXScale = null;
		this.plotYScale = null;
		this.plotLine = null;
		this.plotXAxis = null;
		this.plotYAxis = null;
	}

	_setupData() {
		this.data = Array.apply(null, new Array(this.windowSamples)).map(Number.prototype.valueOf, 0);
		if (!this.channel) {
			this.dataExtent = [-32768, 32767];
			this.targetExtent = [null, null];
		} else {
			if (!this.dataExtent) this.dataExtent = [-100, 100];
			if (!this.targetExtent) this.targetExtent = [null, null];
		}
	}

	autoResize() {
		var width = parseFloat(getComputedStyle(document.getElementById('fm-scope'), null).width.replace("px", "")) - (this.plotMargin.left + this.plotMargin.right)
		var height = this.plotHeight;
		if (width <= 0 || height <= 0) return;
		this._resizePlot(width, height);
	}

	_resizePlot(width: any, height: any) {
		this.plotSvg.attr('width', width + this.plotMargin.left + this.plotMargin.right)
			.attr('height', height + this.plotMargin.top + this.plotMargin.bottom);
		this.plotXScale.range([0, width]);
		this.plotYScale.range([height, 0]);
		select('.fm-scope-axis-x')
			.attr('transform', 'translate(' + 0 + ',' + height + ')');
	}

	_setupPlot() {
		var scope = this;
		this.plotSvg = select('#fm-scope').append('svg')
			.attr('class', 'fm-scope-plot');
		var g = this.plotSvg.append('g')
			.attr('transform', 'translate(' + this.plotMargin.left + ',' + this.plotMargin.top + ')');
		this.plotXScale = scaleLinear()
			.domain([0, this.windowSamples - 1]);
		this.plotYScale = scaleLinear()
			.domain(this.dataExtent);
		this.plotLine = line()
			.x((d, i) => scope.plotXScale(i))
			.y((d) => scope.plotYScale(d));
		this.plotXAxis = axisBottom(this.plotXScale);
		this.plotYAxis = axisLeft(this.plotYScale);
		g.append('g')
			.attr('class', 'axis fm-scope-axis-x');
		g.append('g')
			.attr('class', 'axis fm-scope-axis-y');
		g.append('path')
			.attr('class', 'line fm-scope-line');
		this.autoResize();
	}
	setup() {
		this._setupData();
		if (!this.plotSvg) this._setupPlot();
		this.update();
	}

	start(newChannel: any) {
		if (newChannel == this.channel) {
			if (this.scoping) return;
		}
		if (newChannel !== undefined) {
			this.channel = newChannel;
		} else {
			if (this.scoping) return;
		}
		this.scoping = true;
		this._setupData();
		this.update();
	}

	_updatePlot() {
		var s1 = select('.fm-scope-axis-x');
		s1.call(this.plotXAxis);
		select('.fm-scope-axis-y')
			.call(this.plotYAxis);
		if (!this.data) {
			return;
		}
		select('.fm-scope-line')
			.datum(this.data)
			.attr('d', this.plotLine);
	}

	update(newData?: any) {
		if (!this.scoping) return;
		if (newData !== undefined) this._receiveSignal(newData);
		this._updatePlot();
	}

	_pushSamples(samples: any) {
		var scope = this;
		samples.forEach((s: any) => {
			scope.data.shift();
			scope.data.push(s);
		});
	}

	_updateScale() {
		var dataMin = this.data.reduce((acc: any, d: any) => Math.min(acc, d));
		var dataMax = this.data.reduce((acc: any, d: any) => Math.max(acc, d));
		console.log(dataMax)
		console.log(dataMin)
		var targetMin = 0;
		var targetMax = 0;
		if (!this.targetExtent) {
			targetMin = dataMin;
			targetMax = dataMax;
		} else {
			targetMin = (this.targetExtent[0] === null) ? dataMin : this.targetExtent[0];
			targetMax = (this.targetExtent[1] === null) ? dataMax : this.targetExtent[1];
		}
		this.dataExtent[0] = this.dataExtent[0] + this.extentSnap * (targetMin - this.dataExtent[0]);
		this.dataExtent[1] = this.dataExtent[1] + this.extentSnap * (targetMax - this.dataExtent[1]);
		this.plotYScale.domain(this.dataExtent);
	}

	_receiveSignal(signal: any) {
		if (!this.scoping) return;
		if (!this.channel) return;
		if (Object.keys(signal).indexOf(this.channel) < 0) return;
		this._pushSamples(signal[this.channel]);
		this._updateScale();
	}

}

export default fmscope;