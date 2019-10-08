import fmbrain from './fmbrain';
import fmraster from './fmraster';
import fmscope from './fmscope'
import {
    select
} from "d3-selection";
let $ = require('jquery');

class fmui {
    constructor() {
        let manager = this;
        this.config = {};
        this.allChannels = [];
        this.raster = new fmraster('#fm');
        this.brain = new fmbrain();
        this.scope = new fmscope();
        this.raster.onselectchannel = newChannel => {
            manager.brain.setSelectedChannel(newChannel);
        };
        this.onoptionchange = (option, newValue) => { };
        this.onsave = saveName => { };
        this.config.rowHeight = 3;
        this.config.maxRowHeight = 10;
        this.config.pxPerRowHeight = 5;
        this.config.rasterExtent = 5;
        this.config.maxRasterExtent = 10;
        this.config.unitsPerRasterExtent = 1;
        this.config.iconHideDelay = 1000;
        this.config.iconHideDuration = 100;
        this.config.fmMargin = {
            'left': 0,
            'right': 0,
            'top': 0,
            'bottom': 0
        };
        this.config.chartDebounceDelay = 100;
    };


    debounce(func, wait, immediate) {
        let timeout;
        return () => {
            let context = this,
                args = arguments;
            let later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };



    setup() {
        let manager = this;
        this.rewireButtons();
        this.rewireForms();
        this.raster.cursorTime = 0.0;
        this.raster.setupCharts();
        this.raster.cursorSvg = select('#fm').append('svg').attr('class', 'fm-cursor-svg');
        document.getElementById('fm').onclick = event => manager.raster.toggleCursor();
        this.raster.cursorSvg.append('line').attr('class', 'fm-cursor-line');
        this.raster.cursorSvg.append('line').attr('class', 'fm-cursor-origin-line');
        this.raster.updateCursor();
        this._populateOptions(this.getOptions());
        this.raster.channelHeight = this.getRowHeight()
        this.raster.chartMax = this.getRasterExtent();
    }
    zoom(event, which) {
        this.config.rowHeight = this.config.rowHeight + which;
        console.log(this.config.rowHeight)
        if (which == 1) {
            if (this.config.rowHeight < 1) {
                this.config.rowHeight = 1;
                return;
            }

        } else {
            if (this.config.rowHeight > this.config.maxRowHeight) {
                this.config.rowHeight = this.config.maxRowHeight;
                return;
            }
        }
        this._updateZoomClasses();
        var prevScrollFraction = this._getScrollFraction();
        this.raster.channelHeight = this.getRowHeight();
        this.updateRaster(true);
        $(document).scrollTop(this._topForScrollFraction(prevScrollFraction));

    }

    gainAdjust(event, which) {
        // if (event.target.classList.contains('disabled')) return
        if (which == "Down") {
            console.log(this.config.rasterExtent)
            this.config.rasterExtent = this.config.rasterExtent + 1;
            if (this.config.rasterExtent > this.config.maxPlotExtent) {
                this.config.rasterExtent = this.config.maxPlotExtent;
                return;
            }
        } else {
            console.log(this.config.rasterExtent)

            this.config.rasterExtent = this.config.rasterExtent - 1;
            if (this.config.rasterExtent < 1) {
                this.config.rasterExtent = 1;
                return;
            }
        }
        // this._updateGainClasses();
        this.raster.chartMax = this.getRasterExtent();

        this.updateRaster(true);
    }


    rewireButtons() {
        var manager = this;
        document.getElementsByClassName('fm-zoom-in')[0].onclick = event => {
            event.preventDefault();
            manager.zoom(event, 1);
        };
        document.getElementsByClassName('fm-zoom-out')[0].onclick = event => {
            event.preventDefault();
            manager.zoom(event, -1);
        };
        document.getElementById('gainDown').onclick = event => {
            event.preventDefault();
            manager.gainAdjust(event, "Down")
        };
        document.getElementById('gainUp').onclick = event => {
            event.preventDefault();
            manager.gainAdjust(event, "Up")
        };
        document.getElementById('clearExclusionButton').onclick = e => {
            e.preventDefault();
            manager.clearExclusion()
        };
        document.getElementsByClassName('fm-show-options')[0].onclick = event => {
            event.preventDefault();
            manager.showOptions(event);
        };

        // $('.fm-options-tab-list a').on('click', function (event) {
        document.getElementsByClassName('fm-show-options')[0].onclick = event => {
            event.preventDefault();
            manager.showOptionsTab(this, event);
        };
        document.getElementsByClassName('fm-save-cloud')[0].onclick = event => {
            event.preventDefault();
            manager.onsave(document.getElementById('fm-option-save-name').value);
        };

    }

    rewireForms() {
        var manager = this; // Capture this
        $('#fm-options-modal').on('hidden.bs.modal', event => manager.optionsHidden(event));
        var updateOptions = function (updater) {
            var options = manager.getOptions();
            updater(options);
            manager.setOptions(options);
        };
        document.getElementById('fm-option-stim-timing-state').onclick = (event) => {
            document.getElementById('fm-option-stim-timing-state').checked = true;
            document.getElementById('fm-option-stim-timing-signal').checked = false;
            updateOptions(options => options.stimulus.timingStrategy = 'state');
            manager.onoptionchange('stim-timing', 'state');
        };
        document.getElementById('fm-option-stim-timing-signal').onclick = event => {
            document.getElementById('fm-option-stim-timing-state').checked = false;
            document.getElementById('fm-option-stim-timing-signal').checked = true;
            updateOptions(options => options.stimulus.timingStrategy = 'signal');
            manager.onoptionchange('stim-timing', 'signal');
        };

        document.getElementById('fm-option-stim-channel').onchange = function (event) {
            var newValue = this.value;
            updateOptions(options => options.stimulus.signal.channel = newValue);
            manager.onoptionchange('stim-channel', newValue);
        };
        document.getElementById('fm-option-stim-off').onchange = function (event) {
            var newValue = +this.value;
            updateOptions(options => options.stimulus.signal.offValue = newValue);
            manager.onoptionchange('stim-off', newValue);
        };
        document.getElementById('fm-option-stim-on').onchange = function (event) {
            var newValue = +this.value;
            updateOptions(options => options.stimulus.signal.onValue = newValue);
            manager.onoptionchange('stim-on', newValue);
        };

        document.getElementById('fm-option-stim-trial-start').onchange = event => {
            updateOptions(options => options.stimulus.window.start = parseInt(event.target.value));
        };
        document.getElementById('fm-option-stim-trial-end').onchange = event => {
            updateOptions(options => options.stimulus.window.end = parseInt(event.target.value));
        };

        document.getElementById('fm-option-stim-baseline-start').onchange = event => {
            updateOptions(options => options.stimulus.baselineWindow.start = parseInt(event.target.value));
        };
        document.getElementById('fm-option-stim-baseline-end').onchange = event => {
            updateOptions(options => options.stimulus.baselineWindow.end = parseInt(event.target.value));
        };


        document.getElementById('fm-option-stim-state').onchange = event => {
            updateOptions(options => options.stimulus.state.name = event.target.value);
            manager.onoptionchange('stim-channel', event.target.value);
        };
        document.getElementById('fm-option-stim-state-off').onchange = event => {
            updateOptions(options => options.stimulus.state.offValue = event.target.value);
            manager.onoptionchange('stim-off', event.target.value);
        };
        document.getElementById('fm-option-stim-state-on').onchange = event => {
            updateOptions(options => options.stimulus.state.onValue = event.target.value);
            manager.onoptionchange('stim-on', event.target.value);
        };
        document.getElementById('fm-option-stim-state-exclude').onchange = event => {
            updateOptions(options => options.stimulus.state.exclude = event.target.value);
            manager.onoptionchange('stim-exclude', event.target.value);
        };


        document.getElementById('fm-option-nuke-cookies').onclick = function (event) {
            manager.clearOptions();
            manager.clearExclusion();
        };


        document.getElementById('fm-option-scope-channel').onchange = function (event) {
            manager.scope.start(this.value);
        };

        document.getElementById('fm-option-scope-min').onchange = function (event) {
            manager.updateScopeMin((this.value == '') ? null : +this.value);
        };
        document.getElementById('fm-option-scope-max').onchange = function (event) {
            if (isNaN((this.value == '') ? null : +this.value)) return;
            manager.scope.targetExtent[1] = (this.value == '') ? null : +this.value;
        };
    }

    updateRaster(guarantee) {

        var manager = this;
        var updater = () => manager.raster.update();
        if (guarantee) {
            updater();
        } else {
            this.debounce(updater, this.config.rasterDebounceDelay, true)();
        }
    }

    updateScope(guarantee) {
        var manager = this;
        var updater = () => {
            // manager.scope.autoResize();
            manager.scope.update();
        };
        if (guarantee) {
            updater();
        } else {
            this.debounce(updater, this.config.scopeDebounceDelay, true)();
        }
    }

    // updateBrain() {
    //     var manager = this;
    //     debounce(function () {
    //         manager.brain.autoResize();
    //         manager.brain.update();
    //     }, this.config.brainDebounceDelay)();

    // }

    _updateZoomClasses() {
        if (this.config.rowHeight >= this.config.maxRowHeight) {
            document.getElementsByClassName('fm-zoom-in')[0].classList.add('disabled');
        } else {
            document.getElementsByClassName('fm-zoom-in')[0].classList.remove('disabled');
        }
        if (this.config.rowHeight <= 1) {
            document.getElementsByClassName('fm-zoom-out')[0].classList.add('disabled');
        } else {
            document.getElementsByClassName('fm-zoom-out')[0].classList.remove('disabled');
        }
    }

    _updateGainClasses() {
        if (this.config.rasterExtent >= this.config.maxRasterExtent) {
            document.getElementById('gainDown').classList.add('disabled');
        } else {
            document.getElementById('gainDown').classList.remove('disabled');
        }
        if (this.config.rasterExtent <= 1) {
            document.getElementById('gainUp').classList.add('disabled');
        } else {
            document.getElementById('gainUp').classList.remove('disabled');
        }
    }


    _getScrollFraction() {
        return $(window).scrollTop() / ($(document).height() - $(window).height());
    }

    _topForScrollFraction(frac) {
        return frac * ($(document).height() - $(window).height());
    }

    showOptions(event) {
        $('#fm-options-modal').modal('show');
    }

    optionsHidden(event) {
        this.scope.scoping = false;

    }

    showOptionsTab(caller, event) {

        // Show the caller's tab
        // $(caller).tab('show');
        $('#fm-options-modal').modal("show")


        // Deactivate the tab list
        $('.fm-options-tab-list .list-group-item').removeClass('active');

        // TODO Get Bootstrap events for tab show / hide to work
        // Selected tab is last word of hash
        // var selectedTab = caller.hash.split('-').pop();
        // var scopeChannel = $('#fm-option-scope-channel').val();

        // if (selectedTab == 'scope') {
        //     this.scope.setup(); // TODO Necessary?
        //     this.scope.start(scopeChannel ? scopeChannel : undefined);
        // } else {
        //     this.scope.scoping = false;

        // }

        // Activate the caller
        // TODO Deactivation is with class behavior, but this is specific instance
        // Could cause de-synch behavior if multiple instances of class
        // $(caller).addClass('active');

    }

    updateScopeMin(newMin) {
        if (isNaN(newMin)) {
            return;
        }
        this.scope.targetExtent[0] = newMin;
    }


    _populateOptions(options) {
        // Stimulus windows
        document.getElementById('fm-option-stim-trial-start').value = options.stimulus.window.start
        document.getElementById('fm-option-stim-trial-end').value = options.stimulus.window.end
        document.getElementById('fm-option-stim-baseline-start').value = options.stimulus.baselineWindow.start
        document.getElementById('fm-option-stim-baseline-end').value = options.stimulus.baselineWindow.end

        // // Timing strategy
        // document.getElementById('fm-option-stim-timing-state').prop('checked', options.stimulus.timingStrategy == 'state');
        // document.getElementById('fm-option-stim-timing-signal').prop('checked', options.stimulus.timingStrategy == 'signal');
        this.onoptionchange('stim-timing', options.stimulus.timingStrategy);

        // Stimulus thresholding
        document.getElementById('fm-option-stim-channel').value = options.stimulus.signal.channel
        this.onoptionchange('stim-channel', options.stimulus.signal.channel);
        document.getElementById('fm-option-stim-off').value = options.stimulus.signal.offValue
        this.onoptionchange('stim-off', options.stimulus.signal.offValue);
        document.getElementById('fm-option-stim-on').value = options.stimulus.signal.onValue
        this.onoptionchange('stim-on', options.stimulus.signal.onValue);

        document.getElementById('fm-option-stim-state').value = options.stimulus.state.name;
        document.getElementById('fm-option-stim-state-off').value = options.stimulus.state.offValue
        document.getElementById('fm-option-stim-state-on').value = options.stimulus.state.onValue
        this.onoptionchange('state-name', options.stimulus.state.name);
        this.onoptionchange('stim-off', options.stimulus.state.offValue);
        this.onoptionchange('stim-on', options.stimulus.state.onValue);

    }

    _populateMontageList(newChannelNames) {
        var manager = this;
        var exclusion = this.getExclusion();
        var montageBody = $('.fm-montage-table tbody');
        montageBody.empty();
        newChannelNames.forEach(function (ch) {
            var curRow = $('<tr></tr>');
            curRow.append($('<th scope="row" class="fm-montage-cell-channelname">' + ch + '</th>'));
            var isExcludedText = exclusion[ch] ? 'Yes' : 'No';
            curRow.append($('<td class="fm-montage-cell-isexcluded">' + isExcludedText + '</td>')); // TODO Check if excluded
            if (exclusion[ch]) {
                curRow.addClass('danger');
            }
            curRow.on('click', function (event) {
                var selection = $(this);
                var shouldExclude = !selection.hasClass('danger');
                if (shouldExclude) {
                    manager.exclude(ch);
                } else {
                    manager.unexclude(ch);
                }
                selection.toggleClass('danger');
                $('.fm-montage-cell-isexcluded', this).text(shouldExclude ? 'Yes' : 'No');
            });
            montageBody.append(curRow);
        });
    }

    getRasterExtent() {
        return this.config.rasterExtent * this.config.unitsPerRasterExtent;
    }

    getRowHeight() {

        return this.config.rowHeight * this.config.pxPerRowHeight;
    }

    getOptions() {
        let options = JSON.parse(localStorage.getItem('options')) || null

        if (options == undefined) {
            options = {};
            options.stimulus = {};
            options.stimulus.window = {
                start: -1.0,
                end: 3.0
            };
            options.stimulus.baselineWindow = {
                start: -1.0,
                end: -0.2
            };

            options.stimulus.timingStrategy = 'state';

            options.stimulus.signal = {};
            options.stimulus.signal.channel = 'ainp1';
            options.stimulus.signal.offValue = 0;
            options.stimulus.signal.onValue = 1;
            options.stimulus.signal.threshold = 0.2;

            options.stimulus.state = {};
            options.stimulus.state.name = 'StimulusCode';
            options.stimulus.state.offValue = 0;
            options.stimulus.state.onValue = 'x';
            options.stimulus.state.exclude = 99;

            localStorage.setItem('options', JSON.stringify(options))

        }

        return options
    }

    setOptions(options) {
        localStorage.setItem('options', JSON.stringify(options))
    }

    clearOptions() {
        localStorage.setItem('options', {})

        this.getOptions();
    }

    getExclusion() {
        let exclusion = JSON.parse(localStorage.getItem('exclusion')) || {}
        localStorage.setItem('exclusion', JSON.stringify(exclusion));
        return exclusion;
    }

    clearExclusion() {
        let exclusion = this.getExclusion();
        Object.keys(exclusion).forEach(ch => {
            exclusion[ch] = false
            localStorage.setItem('exclusion', JSON.stringify(exclusion))
        });
        [].forEach.call(document.getElementsByClassName('fm-montage-cell-isexcluded'), a => a.innerText = "No")
        this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()));

    }

    exclude(channel) {
        var exclusion = this.getExclusion();
        exclusion[channel] = true;
        localStorage.setItem('exclusion', JSON.stringify(exclusion))
        this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()));
    }

    unexclude(channel) {
        var exclusion = this.getExclusion();
        exclusion[channel] = false;
        localStorage.setItem('exclusion', JSON.stringify(exclusion))
        this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()));
    }

    channelFilter() {
        var exclusion = this.getExclusion();
        return function (ch) {
            if (exclusion[ch] === undefined) {
                return true;
            }
            return !exclusion[ch];
        };
    }
    updateChannelNames(newChannelNames) {
        this.allChannels = newChannelNames;
        this._populateMontageList(this.allChannels);
        this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()));
    }

    updateTrialCount(newCount) {
        document.getElementsByClassName('fm-trial-label')[0].innerHTML = 'n = ' + newCount;
    }
    didResize() {
        this.updateRaster();
        this.updateScope();
        this.brain.autoResize();
    }

};
export default fmui;