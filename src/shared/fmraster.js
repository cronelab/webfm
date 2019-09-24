import {
    select
} from "d3-selection";
import {
    scaleLinear,
} from 'd3-scale';
let horizonChart = require('./horizon-chart-custom.js').default;

class fmraster {
    constructor() {
        this.displayOrder = null;
        this.data = null;
        this.timeScale = null;
        this.oncursormove = newTime => { };
        this.onselectchannel = newChannel => { };
        this.selectedChannel = null;
        this.cursorSvg = null;
        this.cursorTime = null;
        this.cursorLocked = false;
        this.chartMax = 7.5;
        this.channelHeight = 15;
        this.channelHeightCutoff = 14;
        this.chartMargin = {
            top: 100,
            right: 0,
            bottom: 0,
            left: 0
        };
    };

    updateCursor(newTime) {
        if (newTime !== undefined) this.cursorTime = newTime;
        var raster = this;
        var height = document.getElementById('fm').offsetHeight;
        select('#fm')
            .select('.fm-cursor-svg')
            .attr('width', document.getElementById('fm').offsetWidth)
            .attr('height', height);
        if (!this.timeScale) return;

        select('#fm')
            .select('.fm-cursor-svg')
            .select('.fm-cursor-line')
            .classed('fm-cursor-locked', () => raster.cursorLocked)
            .attr('x1', this.timeScale.invert(this.cursorTime))
            .attr('y1', 0)
            .attr('x2', this.timeScale.invert(this.cursorTime))
            .attr('y2', height);

        select('#fm')
            .select('.fm-cursor-svg')
            .select('.fm-cursor-origin-line')
            .attr('x1', this.timeScale.invert(0.0))
            .attr('y1', 0)
            .attr('x2', this.timeScale.invert(0.0))
            .attr('y2', height);
    }

    toggleCursor() {

        if (this.cursorLocked) {
            this.cursorLocked = false;
            this.updateCursor();
            return;
        }
        this.cursorLocked = true;
        this.updateCursor();
    }

    setupCharts() {
        if (!this.displayOrder) return;
        if (!this.data) {
            return this.displayOrder.reduce(function (obj, ch) {
                obj[ch] = [0.0];
                return obj;
            });
        }
        var raster = this;
        var width = parseFloat(getComputedStyle(document.getElementById('fm'), null).width.replace("px", "")) - this.chartMargin.left - this.chartMargin.right;
        var step = width / this.data[0].values.length;
        if (!this.timeScale) {
            this.timeScale = scaleLinear()
                .domain([0, width])
                .range([0, 1]);
        } else {
            if (!this.timeScale) return;
            this.timeScale.domain([0, width]);
        }
        let horizonChart1 = horizonChart();
        var horizons = select('#fm').selectAll('.fm-horizon')
            .data(this.data, d => d.channel);
        horizons.enter().append('div')
            .attr('class', 'fm-horizon')
            .each(function (d, i) {
                this.onmousemove = event => {
                    raster.selectChannel(select(event.currentTarget).datum().channel);
                    if (raster.cursorLocked) return
                    var newTime = raster.timeScale(event.pageX - this.getBoundingClientRect().left + document.body.scrollLeft);
                    raster.updateCursor(newTime);
                    raster.oncursormove(newTime);
                };
            })
            .merge(horizons)
            .classed('fm-horizon-small', () => (raster.channelHeight <= raster.channelHeightCutoff))
            .each(function (d, i) {
                horizonChart1.title(d.channel)
                    .height(raster.channelHeight)
                    .step(step)
                    .extent([0, raster.chartMax])
                    .call(this, d.values);
            });
        horizons.exit().remove();
    }



    update(newData) {
        if (newData !== undefined) this._updateData(newData);
        this.setupCharts();
        this.updateCursor();
    }

    _updateData(newData) {
        this.data = this.displayOrder.map(ch => {
            return {
                channel: ch,
                values: newData[ch]
            };
        });
    }



    setDisplayOrder(newDisplayOrder) {
        this.displayOrder = newDisplayOrder;
        if (!this.data) return;
        var dictData = this.data.reduce(function (obj, x) {
            obj[x.channel] = x.values;
            return obj;
        }, {});
        this._updateData(dictData);
    }


    selectChannel(newChannel) {
        if (newChannel == this.selectedChannel) return;
        this.selectedChannel = newChannel;
        this.onselectchannel(newChannel);
    };
}


export default fmraster;