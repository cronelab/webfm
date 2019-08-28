import * as d3 from "d3";
d3.horizonChart = require('../lib/horizon-chart-custom.js').default;

class fmraster {
    constructor(baseNodeId) {
        this.baseNodeId = baseNodeId;
        this.displayOrder = null;
        this.data = null;
        this.timeScale = null;
        this.oncursormove = newTime => {};
        this.onselectchannel = newChannel => {};
        this.selectedChannel = null;
        this.cursorSvg = null;
        this.cursorTime = null;
        this.cursorLocked = false;
        this.cursorSize = {
            'width': 0,
            'height': 0
        };
        this.chartMin = 0.0; // TODO Expose to manager
        this.chartMax = 7.5;
        this.channelHeight = 15;
        this.channelHeightCutoff = 14;
        this.chartMargin = {
            top: 100,
            right: 0,
            bottom: 0,
            left: 0
        };
        this.rangeColors = [
            "#313695",
            "#4575b4",
            "#74add1",
            "#abd9e9",
            "#ffffff",
            "#fee090",
            "#fdae61",
            "#f46d43",
            "#d73027"
        ];
    };

    setup() {
        this.setupCharts();
        this.setupCursor();
    }
    setupCursor() {
        var raster = this;
        this.cursorSvg = d3.select(this.baseNodeId).append('svg')
            .attr('class', 'fm-cursor-svg');
        document.getElementById('fm').onclick = event => raster._cursorClick(event);
        this.cursorTime = 0.0;
        this.cursorSvg.append('line')
            .attr('class', 'fm-cursor-line');
        this.cursorSvg.append('line')
            .attr('class', 'fm-cursor-origin-line');
        this.updateCursor();
    }
    updateCursor(newTime) {

        if (newTime !== undefined) {
            this.cursorTime = newTime;
        }

        var raster = this;

        var width = document.getElementById('fm-brain').offsetWidth;
        var height = document.getElementById('fm-brain').offsetHeight;

        d3.select(this.baseNodeId)
            .select('.fm-cursor-svg')
            .attr('width', width)
            .attr('height', height);

        if (!this.timeScale) {
            return;
        }

        var cursorX = this.timeScale.invert(this.cursorTime);

        d3.select(this.baseNodeId)
            .select('.fm-cursor-svg')
            .select('.fm-cursor-line')
            .classed('fm-cursor-locked', function () {
                return raster.cursorLocked;
            })
            .attr('x1', cursorX)
            .attr('y1', 0)
            .attr('x2', cursorX)
            .attr('y2', height);

        var originX = this.timeScale.invert(0.0);

        d3.select(this.baseNodeId)
            .select('.fm-cursor-svg')
            .select('.fm-cursor-origin-line')
            .attr('x1', originX)
            .attr('y1', 0)
            .attr('x2', originX)
            .attr('y2', height);
    }

    _cursorClick(event) {
        this.toggleCursor();
    }

    lockCursor() {
        this.cursorLocked = true;
        this.updateCursor();
    }

    unlockCursor() {
        this.cursorLocked = false;
        this.updateCursor();
    }

    toggleCursor() {

        if (this.cursorLocked) {
            this.unlockCursor();
            return;
        }

        this.lockCursor();

    }


    setupCharts() {
        if (!this.displayOrder) {
            return;
        }

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
            this.timeScale = d3.scaleLinear()
                .domain([0, width])
                .range([0, 1]);
        } else {
            if (!this.timeScale) {
                return;
            }
            this.timeScale.domain([0, width]);
        }
        var horizonChart = d3.horizonChart();
        var horizons = d3.select(this.baseNodeId).selectAll('.fm-horizon')
            .data(this.data, function (d) {
                return d.channel;
            });
        var horizonMouseMove = function (event) {

            var newChannel = d3.select(event.currentTarget).datum().channel;
            raster.selectChannel(newChannel);

            if (raster.cursorLocked) {
                return;
            }

            var offset = this.getBoundingClientRect()
            var cursorX = event.pageX - offset.left + document.body.scrollLeft;
            var newTime = raster.timeScale(cursorX);
            raster.updateCursor(newTime);
            raster.oncursormove(newTime);
        };
        horizons.enter().append('div')
            .attr('class', 'fm-horizon')
            .each(function (d, i) {
                this.onmousemove = horizonMouseMove;
            })
            .merge(horizons)
            .classed('fm-horizon-small', function () {
                return (raster.channelHeight <= raster.channelHeightCutoff);
            })
            .each(function (d, i) {
                // Call Horizon chart rendering
                horizonChart.title(d.channel)
                    .height(raster.channelHeight)
                    .step(step)
                    .extent([raster.chartMin, raster.chartMax])
                    .call(this, d.values);
            });
        horizons.exit().remove();
    }



    update(newData) {
        if (newData !== undefined) {
            this._updateData(newData);
        }
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
        if (!this.data) {
            return;
        }
        var dictData = this.data.reduce(function (obj, x) {
            obj[x.channel] = x.values;
            return obj;
        }, {});
        this._updateData(dictData);
    }
    setExtent(newExtent) {
        this.chartMax = newExtent;
    }
    setRowHeight(newHeight) {
        this.channelHeight = newHeight;
    }

    setSelectedChannel(newChannel) {
        this.selectedChannel = newChannel;
    }

    selectChannel(newChannel) {
        if (newChannel == this.selectedChannel) {
            return;
        }
        this.setSelectedChannel(newChannel);
        this.onselectchannel(newChannel);
    };
}


export default fmraster;