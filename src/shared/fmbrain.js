import * as d3 from "d3";


class fmbrain {
    constructor(baseNodeId) {
        this.baseNodeId = baseNodeId;
        this.imageData = null;
        this.sensorGeometry = null;
        this.selectedChannel = null;
        this.data = null;
        this.dotRadiusScale = null;
        this.dotColorScale = null;
        this.dotXScale = null;
        this.dotYScale = null;
        this.brainSvg = null;
        this.aspect = null;
        this.size = {
            width: 0,
            height: 0
        };
        this.margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };
        this.dotMinRadius = 0.003; // u (horizontal) units
        this.dotMaxRadius = 0.040;

        this.extent = 10.0; // TODO Expose
        this.dotColors = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#000000", "#fee090", "#fdae61", "#f46d43", "#d73027"];
        this.dotColorsDomain = [-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9];
    };



    _reformatForDisplay(data) {
        var brain = this;
        return Object.keys(data).filter(function (ch) {
            if (Object.keys(brain.sensorGeometry).indexOf(ch) < 0) {
                return false;
            }
            if (brain.sensorGeometry[ch].u === undefined || brain.sensorGeometry[ch].v === undefined) {
                return false;
            }
            return true;
        }).map(function (ch) {
            return {
                channel: ch,
                value: data[ch]
            };
        });
    };
    setupFromDataset(dataset) {
        this.setup(dataset.metadata.brainImage, dataset.metadata.sensorGeometry);
    };
    _getDimensionsForData(data) {
        return new Promise(function (resolve, reject) {
            var image = document.createElement('img');
            image.addEventListener('load', function () {
                resolve({
                    width: image.width,
                    height: image.height
                });
                this.remove();
            });
            image.src = data;
        });
    }
    setup(imageData, sensorGeometry) {
        var brain = this;
        this.imageData = imageData;
        this.sensorGeometry = sensorGeometry;



        this.data = Object.keys(this.sensorGeometry).reduce((obj, ch) => {
            obj[ch] = 0.0;
            return obj;
        }, {});






        this.size.width = document.getElementById('fm-brain').offsetWidth - (this.margin.left + this.margin.right);




        this.dotXScale = d3.scaleLinear() // u -> x
            .domain([0, 1])
            .range([0, this.size.width]);
        this.dotYScale = d3.scaleLinear() // v -> y
            .domain([0, 1])
            .range([1, 0]);
        this.dotRadiusScale = d3.scaleSqrt()
            .domain([0, this.extent])
            .range([this.dotMinRadius, this.dotMaxRadius])
            .clamp(true);
        this.dotColorScale = d3.scaleLinear()
            .domain(this.dotColorsDomain)
            .range(this.dotColors)
            .clamp(true);
        this._getDimensionsForData(this.imageData)
            .then(function (dimensions) {
                brain.aspect = dimensions.width / dimensions.height;
                brain.autoResize();
                brain.update();
            });
        this.brainSvg = d3.select(this.baseNodeId).append('svg')
            .attr('class', 'fm-brain-svg');
        var g = this.brainSvg.append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
        g.append('image')
            .attr('class', 'fm-brain-image')
            .attr('xlink:href', this.imageData)
            .attr('x', '0')
            .attr('y', '0');
        g.append('g')
            .attr('class', 'fm-brain-dots');
    }
    _dotFilter(d) {
        if (this._dotX(d) === undefined) {
            return false;
        }
        return true;
    }

    _dotFill(d) {
        return this.dotColorScale(d.value);
    }
    _dotVisibility(d) {
        if (d.channel == this.selectedChannel) {
            return 'visible';
        }
        if (d.value == 0) {
            return 'hidden';
        }
        return 'visible';
    }
    _dotX(d) {
        var pos = this.sensorGeometry[d.channel];
        if (isNaN(pos.u)) {
            return -this.dotXScale(this.dotMaxRadius);
        }
        return this.dotXScale(pos.u);
    }
    _dotY(d) {
        var pos = this.sensorGeometry[d.channel];
        // TODO Bad way to handle errors
        if (isNaN(pos.u)) {
            return -this.dotXScale(this.dotMaxRadius);
        }
        return this.dotYScale(pos.v);
    }
    _dotRadius(d) {
        if (isNaN(d.value)) {
            return this.dotXScale(this.dotRadiusScale(Math.abs(0.0)));
        }
        return this.dotXScale(this.dotRadiusScale(Math.abs(d.value)));
    }
    _dotPosition(dot) {
        dot.attr('visibility', this._dotVisibility.bind(this))
            .attr('cx', this._dotX.bind(this))
            .attr('cy', this._dotY.bind(this))
            .attr('r', this._dotRadius.bind(this));
    }
    _dotOrder(a, b) {
        if (a.channel == this.selectedChannel) {
            return +1;
        }
        if (b.channel == this.SelectedChannel) {
            return -1;
        }
        return this._dotRadius(b) - this._dotRadius(a);
    }

    resize(width, height) {
        if (!this.brainSvg) {
            return;
        }
        this.size.width = width;
        this.size.height = height;
        this.dotXScale.range([0, this.size.width]);
        this.dotYScale.range([this.size.height, 0]);
        var baseSelection = d3.select(this.baseNodeId);
        baseSelection.select('.fm-brain-svg')
            .attr('width', this.size.width + this.margin.left + this.margin.right)
            .attr('height', this.size.height + this.margin.top + this.margin.bottom);
        baseSelection.select('.fm-brain-image')
            .attr('width', this.size.width)
            .attr('height', this.size.height);
        baseSelection.selectAll('.fm-brain-dot')
            .call(this._dotPosition.bind(this))
            .sort(this._dotOrder.bind(this));
    }
    autoResize() {
        if (!this.aspect) {
            return;
        }
        var width = document.getElementById('fm-brain').offsetWidth - (this.margin.left + this.margin.right);
        var height = width / this.aspect;
        if (width <= 0 || height <= 0) {
            return;
        }
        this.resize(width, height);
    }
    update(newData) {
        if (newData !== undefined) {
            this.data = newData;
        }
        if (!this.brainSvg) {
            return;
        }
        var brain = this;
        var brainDots = d3.select(this.baseNodeId).select('.fm-brain-dots').selectAll('.fm-brain-dot')
            .data(this._reformatForDisplay(this.data), function (d) {
                return d.channel;
            });
        brainDots.enter().append('circle')
            .attr('class', 'fm-brain-dot')
            .merge(brainDots)
            .classed('fm-brain-dot-selected', function (d) {
                return d.channel == brain.selectedChannel;
            })
            .style('fill', this._dotFill.bind(this))
            .call(this._dotPosition.bind(this))
            .sort(this._dotOrder.bind(this));
    }

    setSelectedChannel(newChannel) {
        if (newChannel == this.selectedChannel) {
            return;
        }
        this.selectedChannel = newChannel;
        this.update();
    };
};

export default fmbrain;