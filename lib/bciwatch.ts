import { BCI2K_OperatorConnection } from 'bci2k'

export default class BCI2KWatcher {
  _bciConnection: BCI2K_OperatorConnection
  watching: boolean
  state: string
  config: any

  constructor() {
    this._bciConnection = new BCI2K_OperatorConnection()
    this.watching = false
    this.state = 'Not Connected'
    this.config = {}
  }

  connect(address) {
    // For nested functions
    var watcher = this

    if (address === undefined) {
      address = this.config.sourceAddress
    }

    return this._bciConnection.connect(address).then(event => {
      this._bciConnection.stateListen()
      watcher._bciDidConnect(event)
      return event
    })

    // return this._bciConnection.connect(address)
    //     .then(function (event) {
    //         watcher._bciDidConnect(event);
    //         return event;
    //     });
  }
  async loadConfig(configURI) {
    var watcher = this // Cache this for nested functions
    let req = await fetch(configURI)
    let data = await req.json()
    watcher.config = data
  }

  _bciDidConnect(event) {
    this._updateState('Connected')
  }

  _updateState(newState) {
    if (this.state != newState) {
      this.state = newState
      // this.onstatechange(this.state);
    }
  }

  _checkState() {
    // Capture this for inline functions
    var watcher = this

    var tryLaterIfWatching = function () {
      if (watcher.watching) {
        setTimeout(function () {
          watcher._checkState()
        }, watcher.config.checkStateInterval)
      }
    }

    if (!this._bciConnection.connected()) {
      // Update to Not Connected state
      this._updateState('Not Connected')
      tryLaterIfWatching()
      return
    }

    // console.log(this._bciConnection)
    // this._bciConnection.execute('Get System State', function (result) {
    //     console.log(result)
    //     // Got the state back from BCI2K
    //     var newState = result.output.trim();
    //     // Update to new state
    //     watcher._updateState(newState);
    //     tryLaterIfWatching();
    // });
  }

  start() {
    // Capture this for inline functions
    var watcher = this

    this.watching = true

    // Check Now!
    setTimeout(function () {
      watcher._checkState()
    }, 0)
  }

  stop() {
    this.watching = false

    // This should short-circuit any active state checking.
  }

  getParameter(parameter) {
    // Capture this for inline functions
    var watcher = this

    // Make promises for system calls to add on dataset properties
    // return promisify(function (cb) {
    //     watcher._bciConnection.execute('Get Parameter ' + parameter, function (result) {
    //         // TODO Do I want this for everything?
    //         // TODO Check for err based on result.exitcode
    //         cb(null, result.output.trim());
    //     });
    // });
  }
}
