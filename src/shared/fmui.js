var Cookies = require('js-cookie');
import cronelib from '../lib/cronelib';
import fmbrain from '../shared/fmbrain';
import fmraster from '../shared/fmraster';
import fmscope from '../shared/fmscope'

var $ = require('jquery');

class fmui {
    constructor() {
        this.cronelib = new cronelib();
        var manager = this;
        this.config = {};
        this.icons = [
            'transfer',
            'working'
        ];
        this.allChannels = []; // TODO Can avoid?
        this.raster = new fmraster('#fm');
        this.brain = new fmbrain('#fm-brain');
        this.scope = new fmscope('#fm-scope');
        this.raster.onselectchannel = function (newChannel) {
            manager.brain.setSelectedChannel(newChannel);
        };
        this.onoptionchange = function (option, newValue) {};
        this.onsave = function (saveName) {};

    };

    async loadConfig(configURI) {
        var manager = this;
        let request = await fetch(configURI)
        let data = await request.json()
        manager.config = data;
        manager.setup();
    }

    _syncRasterConfig() {
        this.raster.setRowHeight(this.getRowHeight());
        this.raster.setExtent(this.getRasterExtent());
    }

    _mergeDefaultConfig(config) {
        var mergedConfig = config;
        mergedConfig.rowHeight = config.rowHeight || 5;
        mergedConfig.maxRowHeight = config.maxRowHeight || 10;
        mergedConfig.pxPerRowHeight = config.pxPerRowHeight || 5;
        mergedConfig.rasterExtent = config.rasterExtent || 5;
        mergedConfig.maxRasterExtent = config.maxRasterExtent || 10;
        mergedConfig.unitsPerRasterExtent = config.unitsPerRasterExtent || 1;
        mergedConfig.iconShowDuration = config.iconShowDuration || 100;
        mergedConfig.iconHideDelay = config.iconHideDelay || 1000;
        mergedConfig.iconHideDuration = config.iconHideDuration || 100;
        mergedConfig.fmMargin = config.fmMargin || {
            'left': 0,
            'right': 0,
            'top': 0,
            'bottom': 0
        };
        mergedConfig.chartDebounceDelay = config.chartDebounceDelay || 100;
        return mergedConfig;
    }
    setup() {
        var manager = this; // Capture this
        this.config = this._mergeDefaultConfig(this.config);
        this.rewireButtons();
        this.rewireForms();
        this.icons.forEach(function (icon) {
            manager.hideIcon(icon);
        });
        this.raster.setup(); // TODO Always will fail for charts until
        this._populateOptions(this.getOptions());
        this._syncRasterConfig();
    }

    rewireButtons() {
        var manager = this;
        document.getElementsByClassName('fm-zoom-in')[0].onclick = function (event) {
            event.preventDefault();
            if (event.target.classList.contains('disabled')) {
                return;
            }
            manager.zoomIn(event);
        };
        document.getElementsByClassName('fm-zoom-out')[0].onclick = function (event) {
            event.preventDefault();
            if (event.target.classList.contains('disabled')) {
                return;
            }
            manager.zoomOut(event);
        };
        document.getElementsByClassName('fm-gain-up')[0].onclick = function (event) {
            event.preventDefault();
            if (event.target.classList.contains('disabled')) {
                return;
            }
            manager.gainUp(event);
        };
        document.getElementsByClassName('fm-gain-down')[0].onclick = function (event) {
            event.preventDefault();
            if (event.target.classList.contains('disabled')) {
                return;
            }
            manager.gainDown(event);
        };


        document.getElementsByClassName('fm-show-options')[0].onclick = function (event) {
            event.preventDefault();
            manager.showOptions(event);
        };
        $('.fm-options-tab-list a').on('click', function (event) {
            event.preventDefault();
            manager.showOptionsTab(this, event);
        });

        document.getElementsByClassName('fm-save-cloud')[0].onclick = function (event) {
            event.preventDefault();
            manager.onsave(document.getElementById('fm-option-save-name').value);
        };

    }

    rewireForms() {
        var manager = this; // Capture this
        $('#fm-options-modal').on('hidden.bs.modal', function (event) {
            manager.optionsHidden(event);
        });
        var updateOptions = function (updater) {
            var options = manager.getOptions();
            updater(options);
            manager.setOptions(options);
        };
        document.getElementById('fm-option-stim-timing-state').onclick = function (event) {
            document.getElementById('fm-option-stim-timing-state').prop('checked', true);
            document.getElementById('fm-option-stim-timing-signal').prop('checked', false);
            updateOptions(function (options) {
                options.stimulus.timingStrategy = 'state';
            });
            manager.onoptionchange('stim-timing', 'state');
        };
        document.getElementById('fm-option-stim-timing-signal').onclick = function (event) {
            document.getElementById('fm-option-stim-timing-state').prop('checked', false);
            document.getElementById('fm-option-stim-timing-signal').prop('checked', true);

            updateOptions(function (options) {
                options.stimulus.timingStrategy = 'signal';
            });
            manager.onoptionchange('stim-timing', 'signal');
        };

        document.getElementById('fm-option-stim-channel').onchange = function (event) {
            var newValue = this.value;
            updateOptions(function (options) {
                options.stimulus.signal.channel = newValue;
            });
            manager.onoptionchange('stim-channel', newValue);
        };
        document.getElementById('fm-option-stim-off').onchange = function (event) {
            var newValue = +this.value;
            updateOptions(function (options) {
                options.stimulus.signal.offValue = newValue;
            });
            manager.onoptionchange('stim-off', newValue);
        };
        document.getElementById('fm-option-stim-on').onchange = function (event) {
            var newValue = +this.value;
            updateOptions(function (options) {
                options.stimulus.signal.onValue = newValue;
            });
            manager.onoptionchange('stim-on', newValue);
        };


        document.getElementById('fm-option-nuke-cookies').onclick = function (event) {
            manager.clearOptions();
            manager.clearExclusion();
        };


        document.getElementById('fm-option-scope-channel').onchange = function (event) {
            manager.updateScopeChannel(this.value);
        };

        document.getElementById('fm-option-scope-min').onchange = function (event) {
            manager.updateScopeMin((this.value == '') ? null : +this.value);
        };
        document.getElementById('fm-option-scope-max').onchange = function (event) {
            manager.updateScopeMax((this.value == '') ? null : +this.value);
        };

    }

    showIcon(iconName) {
        var showDuration = this.config.iconShowDuration || 0;
        $('.fm-' + iconName + '-icon').show(showDuration);
    }

    hideIcon(iconName) {
        // If properties aren't set, use 0
        // TODO As above.
        var hideDelay = this.config.iconHideDelay || 0;
        var hideDuration = this.config.iconHideDuration || 0;

        setTimeout(function () {
            document.getElementsByClassName(`fm-${iconName}-icon`)[0].classList.add('d-none');
        }, hideDelay);
    }

    updateRaster(guarantee) {

        var manager = this;
        var updater = function () {
            manager.raster.update();
        };
        if (guarantee) {
            updater();
        } else {
            this.cronelib.debounce(updater, this.config.rasterDebounceDelay, true)();
        }
    }

    updateScope(guarantee) {
        var manager = this;
        var updater = function () {
            manager.scope.autoResize();
            manager.scope.update();
        };
        if (guarantee) {
            updater();
        } else {
            this.cronelib.debounce(updater, this.config.scopeDebounceDelay, true)();
        }
    }

    updateBrain() {
        var manager = this;
        this.cronelib.debounce(function () {
            manager.brain.autoResize();
            manager.brain.update();
        }, this.config.brainDebounceDelay)();

    }

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
            document.getElementsByClassName('fm-gain-down')[0].classList.add('disabled');
        } else {
            document.getElementsByClassName('fm-gain-down')[0].classList.remove('disabled');
        }
        if (this.config.rasterExtent <= 1) {
            document.getElementsByClassName('fm-gain-up')[0].classList.add('disabled');
        } else {
            document.getElementsByClassName('fm-gain-up')[0].classList.remove('disabled');
        }
    }

    zoomIn(event) {

        // Update UI-internal gain measure
        this.config.rowHeight = this.config.rowHeight + 1;
        if (this.config.rowHeight > this.config.maxRowHeight) {
            this.config.rowHeight = this.config.maxRowHeight;
            return; // Only update if we actually change
        }

        this._updateZoomClasses();

        // Cache the scroll state before our manipulations
        // TODO Use row in middle of viewport, not fraction of scrolling
        var prevScrollFraction = this._getScrollFraction();
        // Alter raster parameters
        this.raster.setRowHeight(this.getRowHeight());
        // Redraw the raster with a guarantee
        this.updateRaster(true);
        //Restore the scroll state
        $(document).scrollTop(this._topForScrollFraction(prevScrollFraction));

    }

    zoomOut(event) {

        // Update UI-internal gain measure
        this.config.rowHeight = this.config.rowHeight - 1;
        if (this.config.rowHeight < 1) {
            this.config.rowHeight = 1;
            return;
        }
        this._updateZoomClasses();

        // Cache the scroll state before our manipulations
        // TODO Use row in middle of viewport, not fraction of scrolling
        var prevScrollFraction = this._getScrollFraction();
        // Alter raster parameters
        this.raster.setRowHeight(this.getRowHeight());
        // Redraw the raster with a guarantee
        this.updateRaster(true);
        // Restore the scroll state
        $(document).scrollTop(this._topForScrollFraction(prevScrollFraction));

    }

    gainDown(event) {

        // Update UI-internal gain measure
        this.config.rasterExtent = this.config.rasterExtent + 1;
        if (this.config.rasterExtent > this.config.maxPlotExtent) {
            this.config.rasterExtent = this.config.maxPlotExtent;
            return;
        }

        this._updateGainClasses();

        // Alter raster parameters
        this.raster.setExtent(this.getRasterExtent());

        // Redraw the raster with a guarantee
        this.updateRaster(true);

    }

    gainUp(event) {

        // Update UI-internal gain measure
        this.config.rasterExtent = this.config.rasterExtent - 1;
        if (this.config.rasterExtent < 1) {
            this.config.rasterExtent = 1;
            return;
        }
        this._updateGainClasses();

        // Alter raster parameters
        this.raster.setExtent(this.getRasterExtent());

        // Redraw the raster with a guarantee
        this.updateRaster(true);

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
        this.scope.stop();
    }

    showOptionsTab(caller, event) {

        // Show the caller's tab
        $(caller).tab('show');

        // Deactivate the tab list
        $('.fm-options-tab-list .list-group-item').removeClass('active');

        // TODO Get Bootstrap events for tab show / hide to work
        // Selected tab is last word of hash
        var selectedTab = caller.hash.split('-').pop();
        var scopeChannel = $('#fm-option-scope-channel').val();

        if (selectedTab == 'scope') {
            this.scope.setup(); // TODO Necessary?
            this.scope.start(scopeChannel ? scopeChannel : undefined);
        } else {
            this.scope.stop();
        }

        // Activate the caller
        // TODO Deactivation is with class behavior, but this is specific instance
        // Could cause de-synch behavior if multiple instances of class
        $(caller).addClass('active');

    }

    updateScopeMin(newMin) {
        if (isNaN(newMin)) {
            return;
        }
        this.scope.setMinTarget(newMin);
    }

    updateScopeMax(newMax) {
        if (isNaN(newMax)) {
            return;
        }
        this.scope.setMaxTarget(newMax);
    }

    updateScopeChannel(newChannel) {
        this.scope.start(newChannel);
    }
    updateSubjectName(newSubjectName) {
        document.getElementsByClassName('fm-subject-name')[0].innerHTML = newSubjectName;
        document.getElementsByClassName('fm-back')[0].setAttribute('href', `/#${newSubjectName}`);
    }
    updateTaskName(newTaskName) {
        document.getElementsByClassName('fm-task-name')[0].innerHTML = newTaskName;
        document.getElementById('fm-option-save-name').value = newTaskName;
    }

    updateSubjectRecords(newRecords) {
        let recordsTable = document.getElementById('fm-cloud-records-table')
        while (recordsTable.hasChildNodes()) {
            recordsTable.removeChild(recordsTable.firstChild);
        }

        var addRecordCell = function (record) {
            var outer = $('<tr/>');
            var inner = $('<td/>', {
                text: record
            });
            inner.appendTo(outer);
            outer.appendTo('#fm-cloud-records-table');
        };

        newRecords.forEach(addRecordCell);

    }

    updateSelectedTime(newTime) {
        document.getElementsByClassName('fm-time-selected')[0].innerHTML = (newTime > 0 ? '+' : '') + newTime.toFixed(3) + ' s';
    }

    _populateOptions(options) {
        // Stimulus windows
        document.getElementById('fm-option-stim-trial-start').value = options.stimulus.window.start
        document.getElementById('fm-option-stim-trial-end').value = options.stimulus.window.end
        document.getElementById('fm-option-stim-baseline-start').value = options.stimulus.baselineWindow.start
        document.getElementById('fm-option-stim-baseline-end').value = options.stimulus.baselineWindow.end

        // Response windows
        document.getElementById('fm-option-resp-trial-start').value = options.response.window.start
        document.getElementById('fm-option-resp-trial-end').value = options.response.window.end
        document.getElementById('fm-option-resp-baseline-start').value = options.response.baselineWindow.start
        document.getElementById('fm-option-resp-baseline-end').value = options.response.baselineWindow.end

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

        document.getElementById('fm-option-stim-state').vaue = options.stimulus.state.name;
        document.getElementById('fm-option-stim-state-off').value = options.stimulus.state.offValue
        document.getElementById('fm-option-stim-state-on').value = options.stimulus.state.onValue

        // Response thresholding
        document.getElementById('fm-option-resp-channel').value = options.response.signal.channel
        document.getElementById('fm-option-resp-off').value = options.response.signal.offValue
        document.getElementById('fm-option-resp-on').value = options.response.signal.onValue

        document.getElementById('fm-option-resp-state').value = options.response.state.name
        document.getElementById('fm-option-resp-state-off').value = options.response.state.offValue
        document.getElementById('fm-option-resp-state-on').value = options.response.state.onValue

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
        // Get the set options
        var options = Cookies.getJSON('options');

        if (options === undefined) {
            // Cookie isn't set, so generate default
            options = {};

            // TODO Move default options into config

            options.stimulus = {};

            // Stimulus-based alignment config

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

            // Response-based alignment config

            options.response = {};
            options.response.window = {
                start: -2.0,
                end: 2.0
            };
            options.response.baselineWindow = {
                start: -2.0,
                end: -1.6
            };

            options.response.timingStrategy = 'state';

            options.response.signal = {};
            options.response.signal.channel = 'ainp2';
            options.response.signal.offValue = 0;
            options.response.signal.onValue = 1;
            options.response.signal.threshold = 0.2;

            options.response.state = {};
            options.response.state.name = 'RespCode';
            options.response.state.offValue = 0;
            options.response.state.onValue = 'x';

            // Set the cookie so this doesn't happen again!
            Cookies.set('options', options, {
                expires: this.config.cookieExpirationDays
            });
        }

        return options
    }

    setOptions(options) {
        Cookies.set('options', options, {
            expires: this.config.cookieExpirationDays
        });
    }

    clearOptions() {
        Cookies.remove('options');
        this.getOptions();
    }

    getExclusion() {
        // Get the excluded channels
        var exclusion = Cookies.getJSON('exclusion');

        if (exclusion === undefined) {
            // Cookie is not set, so generate default
            exclusion = {};
            // ... and set it so this doesn't happen again!
            Cookies.set('exclusion', exclusion, {
                expires: this.config.cookieExpirationDays
            });
        }

        return exclusion;
    }

    setExclusion(exclusion) {
        Cookies.set('exclusion', exclusion, {
            expires: this.config.cookieExpirationDays
        });
    }

    clearExclusion() {
        Cookies.remove('exclusion');
        this.getExclusion();
    }

    exclude(channel) {
        // TODO Check if channel is in allChannels?
        var exclusion = this.getExclusion();
        exclusion[channel] = true;
        this.setExclusion(exclusion);

        // Update raster display
        this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()));
    }

    unexclude(channel) {
        // TODO Better behavior: Check if channel is in exclusion, then delete
        var exclusion = this.getExclusion();
        exclusion[channel] = false;
        this.setExclusion(exclusion);

        // Update raster display
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

    activateTrialCount() {
        document.getElementsByClassName('fm-trial-label')[0].classList.add('fm-trial-label-active');
    }

    deactivateTrialCount() {
        document.getElementsByClassName('fm-trial-label')[0].classList.remove('fm-trial-label-active');
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