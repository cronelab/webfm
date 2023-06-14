// =
//
// fmui
// User interface manager for WebFM
//
// =

// REQUIRES
import * as $ from 'jquery'
import Cookies from 'js-cookie'
import * as cronelib from '../../lib/cronelib'
import fullscreen from '../../lib/fullscreen'
import BrainVisualizer from './fmbrain'
import fmbrain3 from './fmbrain3'
// import fmscope from './fmscope'
// import fmlines from './fmlines'
import ChannelRaster from './fmraster'

// GLOBALS
var ENTER_KEY = 13 // TODO Should probably go in config

// MODULE OBJECT
export class InterfaceManager {
  config: any
  manager: any
  icons: any
  allChannels: any
  // raster: any
  // brain: any
  // brain3: any
  scope: any
  lines: any
  onoptionchange: any
  onsave: any
  constructor() {
    this.config = {}
    this.manager = this
    this.icons = ['transfer', 'working']
    this.allChannels = []
    // this.raster = new ChannelRaster('#fm')
    // this.brain = new BrainVisualizer('#fm-brain', 'map')
    // this.raster.onselectchannel = function (newChannel) {
    //   this.manager.brain.setSelectedChannel(newChannel)
    // }
    // this.brain3 = new fmbrain3.BrainVisualizer()
    // this.scope = new fmscope.ChannelScope('#fm-scope')
    // this.lines = new fmlines.ChannelLines()
    this.onoptionchange = function (option, newValue) {}
    this.onsave = function (saveName) {}
  }

  loadConfig(configURI) {
    var manager = this // Cache this for nested functions

    // Wrap $.getJSON in a standard Promise
    return new Promise(function (resolve, reject) {
      $.getJSON(configURI)
        .done(resolve)
        .fail(function (req, reason, err) {
          // TODO Get error message from jquery object
          reject('Could not load UI config from ' + configURI + ' : ' + reason)
        })
    }).then(function (data) {
      manager.config = data
      manager.setup()
    })
  }

  //   _syncRasterConfig() {
  //     this.raster.setRowHeight(this.getRowHeight())
  //     this.raster.setExtent(this.getRasterExtent())
  //   };

  _mergeDefaultConfig(config) {
    // Copy over any extras that might not be merged here
    var mergedConfig = config

    // For required config items, specify a default if nothing is provided
    mergedConfig.rowHeight = config.rowHeight || 5
    mergedConfig.maxRowHeight = config.maxRowHeight || 10
    mergedConfig.pxPerRowHeight = config.pxPerRowHeight || 5

    mergedConfig.iconShowDuration = config.iconShowDuration || 100
    mergedConfig.iconHideDelay = config.iconHideDelay || 1000
    mergedConfig.iconHideDuration = config.iconHideDuration || 100
    if (document.title.indexOf('WebFM: Map') >= 0) {
      mergedConfig.rasterExtent = config.rasterExtent || 5
      mergedConfig.maxRasterExtent = config.maxRasterExtent || 10
      mergedConfig.unitsPerRasterExtent = config.unitsPerRasterExtent || 1
    }
    mergedConfig.fmMargin = config.fmMargin || {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    }

    mergedConfig.chartDebounceDelay = config.chartDebounceDelay || 100

    return mergedConfig
  }

  setup() {
    var manager = this // Capture this

    // Incorporate the defaults with whatever we've loaded
    this.config = this._mergeDefaultConfig(this.config)

    this.rewireButtons()
    this.rewireForms()

    this.icons.forEach(function (icon) {
      manager.hideIcon(icon)
    })

    // Populate options with the current cookie-set values
    this._populateOptions(this.getOptions())
    if (document.title.indexOf('WebFM: Map') >= 0) {
      //   this.raster.setup() // TODO Always will fail for charts until
      // this.lines.setup();
      //   this._syncRasterConfig()
    }
  }

  rewireButtons() {
    var manager = this

    $('.fm-zoom-in').on('click', function (event) {
      event.preventDefault()
      if ($(this).hasClass('disabled')) {
        return
      }
      manager.zoomIn(event)
    })
    $('.fm-zoom-out').on('click', function (event) {
      event.preventDefault()
      if ($(this).hasClass('disabled')) {
        return
      }
      manager.zoomOut(event)
    })
    $('.fm-gain-up').on('click', function (event) {
      event.preventDefault()
      if ($(this).hasClass('disabled')) {
        return
      }
      manager.gainUp(event)
    })
    $('.fm-gain-down').on('click', function (event) {
      event.preventDefault()
      if ($(this).hasClass('disabled')) {
        return
      }
      manager.gainDown(event)
    })

    $('.fm-toggle-fullscreen').on('click', function (event) {
      event.preventDefault()
      manager.toggleFullscreen(event)
    })

    $('.fm-show-options').on('click', function (event) {
      event.preventDefault()
      manager.showOptions(event)
    })
    $('.fm-options-tab-list a').on('click', function (event) {
      event.preventDefault()
      manager.showOptionsTab(this, event)
    })

    $('.fm-save-cloud').on('click', function (event) {
      event.preventDefault()
      // TODO Bad.
      manager.onsave($('#fm-option-save-name').val())
    })

    $('.dropdown-menu')
      .children()
      .on('click', function (event) {
        if (!$(this).hasClass('active')) {
          // Remove the class from anything that is active
          //$("li.active").removeClass("active");
          // And make this active
          $(this).addClass('active')
        } else {
          $(this).removeClass('active')
        }
      })
  }

  rewireForms() {
    var manager = this // Capture this

    // TODO Use classes rather than ids?

    // Modal dialog

    $('#fm-options-modal').on('hidden.bs.modal', function (event) {
      manager.optionsHidden(event)
    })

    // Options page

    var updateOptions = function (updater) {
      var options = manager.getOptions()
      updater(options)
      manager.setOptions(options)
    }

    // TODO Manually handling radio because my markup is dumb
    $('#fm-option-stim-timing-state').on('click', function (event) {
      $('#fm-option-stim-timing-state').prop('checked', true)
      $('#fm-option-stim-timing-signal').prop('checked', false)

      updateOptions(function (options) {
        options.stimulus.timingStrategy = 'state'
      })
      manager.onoptionchange('stim-timing', 'state')
    })
    $('#fm-option-stim-timing-signal').on('click', function (event) {
      $('#fm-option-stim-timing-state').prop('checked', false)
      $('#fm-option-stim-timing-signal').prop('checked', true)

      updateOptions(function (options) {
        options.stimulus.timingStrategy = 'signal'
      })
      manager.onoptionchange('stim-timing', 'signal')
    })

    $('#fm-option-stim-channel').on('change', function (event) {
      var newValue = this.value
      updateOptions(function (options) {
        options.stimulus.signal.channel = newValue
      })
      manager.onoptionchange('stim-channel', newValue)
    })
    $('#fm-option-stim-off').on('change', function (event) {
      var newValue = +this.value
      updateOptions(function (options) {
        options.stimulus.signal.offValue = newValue
      })
      manager.onoptionchange('stim-off', newValue)
    })
    $('#fm-option-stim-on').on('change', function (event) {
      var newValue = +this.value
      updateOptions(function (options) {
        options.stimulus.signal.onValue = newValue
      })
      manager.onoptionchange('stim-on', newValue)
    })

    $('#fm-option-nuke-cookies').on('click', function (event) {
      manager.clearOptions()
      manager.clearExclusion()
    })

    // Scope page

    var stimElements = document.getElementsByClassName('stimulusSelector')
    Array.from(stimElements).forEach(function (stimelement) {
      stimelement.addEventListener('click', function (e) {
        // stimelement.parentElement.classList.toggle('active', 'force')
        // manager.updateScopeChannel(stimelement.innerText)
      })
    })

    $('#fm-button').on('click', function (event) {
      // Deactivate the tab list
      $('.fm-options-tab-list .list-group-item').removeClass('active')

      // TODO Get Bootstrap events for tab show / hide to work
      // Selected tab is last word of hash
      var scopeChannel = $('#fm-option-scope-channel').val()

      manager.scope.setup() // TODO Necessary?
      manager.scope.start('LAO3' ? 'LAO3' : undefined)

      // console.log(document.getElementById('chanSel'))
      //   manager.updateScopeChannel( "LAO1" );
    })

    $('#fm-option-scope-channel').on('change', function (event) {
      manager.updateScopeChannel(this.value)
    })

    $('#fm-option-scope-min').on('change', function (event) {
      manager.updateScopeMin(this.value == '' ? null : +this.value)
    })
    $('#fm-option-scope-max').on('change', function (event) {
      manager.updateScopeMax(this.value == '' ? null : +this.value)
    })
  }

  showIcon(iconName) {
    // If properties aren't set, use 0
    // TODO Necessary? We guarantee merged defaults when loading ...
    var showDuration = this.config.iconShowDuration || 0
    $('.fm-' + iconName + '-icon').show(showDuration)
  }

  hideIcon(iconName) {
    // If properties aren't set, use 0
    // TODO As above.
    var hideDelay = this.config.iconHideDelay || 0
    var hideDuration = this.config.iconHideDuration || 0

    setTimeout(function () {
      $('.fm-' + iconName + '-icon').hide(hideDuration)
    }, hideDelay)
  }

  updateRaster(guarantee) {
    var manager = this

    var updater = function () {
      //   manager.raster.update()
    }

    if (guarantee) {
      // Guarantee the update happens now
      updater()
    } else {
      // Debounce the update calls to prevent overload
      cronelib.debounce(updater, this.config.rasterDebounceDelay, true)()
    }
  }

  updateScope(guarantee) {
    var manager = this

    var updater = function () {
      manager.scope.autoResize()
      manager.scope.update()
    }

    if (guarantee) {
      // Guarantee the update happens now
      updater()
    } else {
      // Debounce the update calls to prevent overload
      cronelib.debounce(updater, this.config.scopeDebounceDelay, true)()
    }
  }

  updateBrain() {
    var manager = this

    cronelib.debounce(function () {
      //   manager.brain.autoResize()
      //   manager.brain.update()
      //   manager.brain3.update()
    }, this.config.brainDebounceDelay)()
  }

  /* Button handlers */

  _updateZoomClasses() {
    if (this.config.rowHeight >= this.config.maxRowHeight) {
      $('.fm-zoom-in').addClass('disabled')
    } else {
      $('.fm-zoom-in').removeClass('disabled')
    }
    if (this.config.rowHeight <= 1) {
      $('.fm-zoom-out').addClass('disabled')
    } else {
      $('.fm-zoom-out').removeClass('disabled')
    }
  }

  _updateGainClasses() {
    if (this.config.rasterExtent >= this.config.maxRasterExtent) {
      $('.fm-gain-down').addClass('disabled')
    } else {
      $('.fm-gain-down').removeClass('disabled')
    }
    if (this.config.rasterExtent <= 1) {
      $('.fm-gain-up').addClass('disabled')
    } else {
      $('.fm-gain-up').removeClass('disabled')
    }
  }

  zoomIn(event) {
    // Update UI-internal gain measure
    this.config.rowHeight = this.config.rowHeight + 1
    if (this.config.rowHeight > this.config.maxRowHeight) {
      this.config.rowHeight = this.config.maxRowHeight
      return // Only update if we actually change
    }

    this._updateZoomClasses()

    // Cache the scroll state before our manipulations
    // TODO Use row in middle of viewport, not fraction of scrolling
    var prevScrollFraction = this._getScrollFraction()
    // Alter raster parameters
    // this.raster.setRowHeight(this.getRowHeight())
    //      this.raster1.setRowHeight( this.getRowHeight() );
    // Redraw the raster with a guarantee
    this.updateRaster(true)
    //Restore the scroll state
    $(document).scrollTop(this._topForScrollFraction(prevScrollFraction))
  }

  zoomOut(event) {
    // Update UI-internal gain measure
    this.config.rowHeight = this.config.rowHeight - 1
    if (this.config.rowHeight < 1) {
      this.config.rowHeight = 1
      return
    }
    this._updateZoomClasses()

    // Cache the scroll state before our manipulations
    // TODO Use row in middle of viewport, not fraction of scrolling
    var prevScrollFraction = this._getScrollFraction()
    // Alter raster parameters
    // this.raster.setRowHeight(this.getRowHeight())
    //    this.raster1.setRowHeight( this.getRowHeight() );
    // Redraw the raster with a guarantee
    this.updateRaster(true)
    // Restore the scroll state
    $(document).scrollTop(this._topForScrollFraction(prevScrollFraction))
  }

  gainDown(event) {
    // Update UI-internal gain measure
    this.config.rasterExtent = this.config.rasterExtent + 1
    if (this.config.rasterExtent > this.config.maxPlotExtent) {
      this.config.rasterExtent = this.config.maxPlotExtent
      return
    }

    this._updateGainClasses()

    // Alter raster parameters
    // this.raster.setExtent(this.getRasterExtent())
    // this.raster1.setExtent( this.getRasterExtent() );

    // Redraw the raster with a guarantee
    this.updateRaster(true)
  }

  gainUp(event) {
    // Update UI-internal gain measure
    this.config.rasterExtent = this.config.rasterExtent - 1
    if (this.config.rasterExtent < 1) {
      this.config.rasterExtent = 1
      return
    }
    this._updateGainClasses()

    // Alter raster parameters
    // this.raster.setExtent(this.getRasterExtent())
    // this.raster1.setExtent( this.getRasterExtent() );

    // Redraw the raster with a guarantee
    this.updateRaster(true)
  }

  _getScrollFraction() {
    return $(window).scrollTop() / ($(document).height() - $(window).height())
  }

  _topForScrollFraction(frac) {
    return frac * ($(document).height() - $(window).height())
  }

  toggleFullscreen(event) {
    fullscreen
      .toggle()
      .then(function (result) {
        if (fullscreen.is()) {
          // TODO Change fullscreen button icon
        } else {
          // TODO
        }
      })
      .catch(function (reason) {
        console.log('Could not toggle fullscreen: ' + reason)
      })
  }

  showOptions(event) {
    $('#fm-options-modal').modal('show')
  }

  optionsHidden(event) {
    this.scope.stop()
  }

  showOptionsTab(caller, event) {
    // Show the caller's tab
    $(caller).tab('show')

    // Deactivate the tab list
    $('.fm-options-tab-list .list-group-item').removeClass('active')

    // TODO Get Bootstrap events for tab show / hide to work
    // Selected tab is last word of hash
    var selectedTab = caller.hash.split('-').pop()
    var scopeChannel = $('#fm-option-scope-channel').val()

    if (selectedTab == 'scope') {
      this.scope.setup() // TODO Necessary?
      this.scope.start(scopeChannel ? scopeChannel : undefined)
    } else {
      this.scope.stop()
    }

    // Activate the caller
    // TODO Deactivation is with class behavior, but this is specific instance
    // Could cause de-synch behavior if multiple instances of class
    $(caller).addClass('active')
  }

  setModalSize(size, event) {
    console.log('Changing size to ' + size)

    if (size == 'lg') {
      $('#fm-options-modal-dialog').removeClass('modal-sm').addClass('modal-lg')
      return
    }

    if (size == 'sm') {
      $('#fm-options-modal-dialog').removeClass('modal-lg').addClass('modal-sm')
      return
    }

    $('#fm-options-modal-dialog').removeClass('modal-lg modal-sm')
    return
  }

  updateScopeMin(newMin) {
    if (isNaN(newMin)) {
      return
    }
    this.scope.setMinTarget(newMin)
  }

  updateScopeMax(newMax) {
    if (isNaN(newMax)) {
      return
    }
    this.scope.setMaxTarget(newMax)
  }

  updateScopeChannel(newChannel) {
    this.scope.start(newChannel)
  }

  updateTaskName(newTaskName) {
    $('.fm-task-name').text(newTaskName)
    $('#fm-option-save-name').val(newTaskName)
  }

  updateSubjectRecords(newRecords) {
    // Clear list before populating it
    $('#fm-cloud-records-table').empty()

    var addRecordCell = function (record) {
      // TODO Need to incorporate number of members for badge
      // TODO Could fail if record is badly named

      var outer = $('<tr/>')

      var inner = $('<td/>', {
        text: record,
      })

      inner.appendTo(outer)
      outer.appendTo('#fm-cloud-records-table')
    }

    newRecords.forEach(addRecordCell)
  }

  // TODO nomenclature
  updateSelectedTime(newTime) {
    $('.fm-time-selected').text(
      (newTime > 0 ? '+' : '') + newTime.toFixed(3) + ' s'
    )
  }

  _populateOptions(options) {
    // TODO We respond to option changes here; best time? Smarter way?

    // Stimulus windows
    $('#fm-option-stim-trial-start').val(options.stimulus.window.start)
    $('#fm-option-stim-trial-end').val(options.stimulus.window.end)
    $('#fm-option-stim-baseline-start').val(
      options.stimulus.baselineWindow.start
    )
    $('#fm-option-stim-baseline-end').val(options.stimulus.baselineWindow.end)

    // Response windows
    $('#fm-option-resp-trial-start').val(options.response.window.start)
    $('#fm-option-resp-trial-end').val(options.response.window.end)
    $('#fm-option-resp-baseline-start').val(
      options.response.baselineWindow.start
    )
    $('#fm-option-resp-baseline-end').val(options.response.baselineWindow.end)

    // Timing strategy
    $('#fm-option-stim-timing-state').prop(
      'checked',
      options.stimulus.timingStrategy == 'state'
    )
    $('#fm-option-stim-timing-signal').prop(
      'checked',
      options.stimulus.timingStrategy == 'signal'
    )
    this.onoptionchange('stim-timing', options.stimulus.timingStrategy)

    // Stimulus thresholding
    $('#fm-option-stim-channel').val(options.stimulus.signal.channel)
    this.onoptionchange('stim-channel', options.stimulus.signal.channel)
    $('#fm-option-stim-off').val(options.stimulus.signal.offValue)
    this.onoptionchange('stim-off', options.stimulus.signal.offValue)
    $('#fm-option-stim-on').val(options.stimulus.signal.onValue)
    this.onoptionchange('stim-on', options.stimulus.signal.onValue)

    $('#fm-option-stim-state').val(options.stimulus.state.name)
    this.onoptionchange('stim-state', options.stimulus.state.name)
    $('#fm-option-stim-state-off').val(options.stimulus.state.offValue)
    this.onoptionchange('stim-state-on', options.stimulus.state.onValue)
    $('#fm-option-stim-state-on').val(options.stimulus.state.onValue)
    this.onoptionchange('stim-state-off', options.stimulus.state.offValue)

    // Response thresholding
    $('#fm-option-resp-channel').val(options.response.signal.channel)
    $('#fm-option-resp-off').val(options.response.signal.offValue)
    $('#fm-option-resp-on').val(options.response.signal.onValue)

    $('#fm-option-resp-state').val(options.response.state.name)
    $('#fm-option-resp-state-off').val(options.response.state.offValue)
    $('#fm-option-resp-state-on').val(options.response.state.onValue)
  }

  _populateMontageList(newChannelNames) {
    var manager = this

    var exclusion = this.getExclusion()

    var montageBody = $('.fm-montage-table tbody')

    // Clear out old montage
    montageBody.empty()

    // Build up new montage
    // TODO Incorporate excluded channels
    newChannelNames.forEach(function (ch) {
      var curRow = $('<tr></tr>')
      curRow.append(
        $('<th scope="row" class="fm-montage-cell-channelname">' + ch + '</th>')
      )

      var isExcludedText = exclusion[ch] ? 'Yes' : 'No'
      curRow.append(
        $('<td class="fm-montage-cell-isexcluded">' + isExcludedText + '</td>')
      ) // TODO Check if excluded

      if (exclusion[ch]) {
        curRow.addClass('danger')
      }

      curRow.on('click', function (event) {
        var selection = $(this)
        var shouldExclude = !selection.hasClass('danger')

        if (shouldExclude) {
          manager.exclude(ch)
        } else {
          manager.unexclude(ch)
        }

        selection.toggleClass('danger')
        $('.fm-montage-cell-isexcluded', this).text(
          shouldExclude ? 'Yes' : 'No'
        )
      })

      montageBody.append(curRow)
    })
  }

  getRasterExtent() {
    return this.config.rasterExtent * this.config.unitsPerRasterExtent
  }

  getRowHeight() {
    return this.config.rowHeight * this.config.pxPerRowHeight
  }

  getOptions() {
    // Get the set options
    var options = Cookies.getJSON('options')

    if (options === undefined) {
      // Cookie isn't set, so generate default
      options = {}

      // TODO Move default options into config

      options.stimulus = {}

      // Stimulus-based alignment config

      options.stimulus.window = {
        start: -1.0,
        end: 3.0,
      }
      options.stimulus.baselineWindow = {
        start: -1.0,
        end: -0.2,
      }

      options.stimulus.timingStrategy = 'state'

      options.stimulus.signal = {}
      options.stimulus.signal.channel = 'ainp1'
      options.stimulus.signal.offValue = 0
      options.stimulus.signal.onValue = 1
      options.stimulus.signal.threshold = 0.2

      options.stimulus.state = {}
      options.stimulus.state.name = 'StimulusCode'
      options.stimulus.state.offValue = 0
      options.stimulus.state.onValue = 'x'

      // Response-based alignment config

      options.response = {}
      options.response.window = {
        start: -2.0,
        end: 2.0,
      }
      options.response.baselineWindow = {
        start: -2.0,
        end: -1.6,
      }

      options.response.timingStrategy = 'state'

      options.response.signal = {}
      options.response.signal.channel = 'ainp2'
      options.response.signal.offValue = 0
      options.response.signal.onValue = 1
      options.response.signal.threshold = 0.2

      options.response.state = {}
      options.response.state.name = 'RespCode'
      options.response.state.offValue = 0
      options.response.state.onValue = 'x'

      // Set the cookie so this doesn't happen again!
      Cookies.set('options', options, {
        expires: this.config.cookieExpirationDays,
      })
    }

    return options
  }

  setOptions(options) {
    Cookies.set('options', options, {
      expires: this.config.cookieExpirationDays,
    })
  }

  clearOptions() {
    Cookies.remove('options')
    this.getOptions()
  }

  getExclusion() {
    // Get the excluded channels
    var exclusion = Cookies.getJSON('exclusion')

    if (exclusion === undefined) {
      // Cookie is not set, so generate default
      exclusion = {}
      // ... and set it so this doesn't happen again!
      Cookies.set('exclusion', exclusion, {
        expires: this.config.cookieExpirationDays,
      })
    }

    return exclusion
  }

  setExclusion(exclusion) {
    Cookies.set('exclusion', exclusion, {
      expires: this.config.cookieExpirationDays,
    })
  }

  clearExclusion() {
    Cookies.remove('exclusion')
    this.getExclusion()
  }

  exclude(channel) {
    // TODO Check if channel is in allChannels?
    var exclusion = this.getExclusion()
    exclusion[channel] = true
    this.setExclusion(exclusion)
    // this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()))
    this.lines.setDisplayOrder(this.allChannels.filter(this.channelFilter()))
  }

  unexclude(channel) {
    // TODO Better behavior: Check if channel is in exclusion, then delete
    var exclusion = this.getExclusion()
    exclusion[channel] = false
    this.setExclusion(exclusion)
    // this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()))
    this.lines.setDisplayOrder(this.allChannels.filter(this.channelFilter()))
  }

  channelFilter() {
    var exclusion = this.getExclusion()
    return function (ch) {
      if (exclusion[ch] === undefined) {
        return true
      }
      return !exclusion[ch]
    }
  }
  updateStimulusCode(stuff) {
    this.lines.setTrialNumber(stuff)
  }

  updateChannelNames(newChannelNames) {
    // Update our state
    this.allChannels = newChannelNames

    // Update the GUI with the complete channel list
    this._populateMontageList(this.allChannels)

    // Update the raster with the filtered channel list
    // TODO Support different ordering, or just exclusion?
    if (document.title.indexOf('WebFM: Map') >= 0) {
      //   this.raster.setDisplayOrder(this.allChannels.filter(this.channelFilter()))
      this.lines.setDisplayOrder(this.allChannels.filter(this.channelFilter()))

      var chNames = this.allChannels.filter(this.channelFilter())
      chNames.forEach(ch => {
        var item = document.createElement('li')
        var item2 = document.createElement('a')
        item.appendChild(item2)
        item.setAttribute('class', 'chSelFxn')
        item.setAttribute('id', ch)
        item2.setAttribute('href', '#')
        item2.appendChild(document.createTextNode(ch))
        item2.classList.add('stimulusSelector')
        document.getElementById('chanSel').appendChild(item)
      })
    }
  }

  activateTrialCount() {
    $('.fm-trial-label').addClass('fm-trial-label-active')
  }

  deactivateTrialCount() {
    $('.fm-trial-label').removeClass('fm-trial-label-active')
  }

  updateTrialCount(newCount) {
    $('.fm-trial-label').text('n = ' + newCount)
  }

  didResize() {
    if (document.title.indexOf('WebFM: Map') >= 0) {
      this.updateRaster(false)
    }
    this.updateScope(false)

    //this.updateBrain();
    // this.brain.autoResize()
  }
}

export default InterfaceManager
