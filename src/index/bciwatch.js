import BCI2K from 'bci2k'


export default class BCI2KWatcher{
  constructor(){
    this._bciConnection = new BCI2K();
    this.watching = false;
    this.state = "Not Connected";
  }

  async connect(address) {
    let connection = await this._bciConnection.connect(address)
    this._updateState("Connected");
    return connection;
  };


  _updateState(newState) {
    if (this.state != newState) {
      this.state = newState;
      this.onstatechange(this.state.trim());
    }
  }

  async _checkState() {
    let systemStates = await this._bciConnection.execute("Get System State");
    if (!this._bciConnection.connected()) {
      let newState = "Not Connected"
      this._updateState(newState);
    }
    else{
      let newState = systemStates
      this._updateState(newState);
    }
    
    if (this.watching) {
      setTimeout(() => this._checkState(), 500);
    }
  }

  start() {
    var watcher = this;
    this.watching = true;
    setTimeout(() => watcher._checkState(), 100);
    // setTimeout(() => watcher._stateVectorWatch(), 100);
  }

  stop() {
    this.watching = false;
  }

  async getParameter(parameter) {
    var watcher = this;
    return await watcher._bciConnection.execute(`Get Parameter ${parameter}`)
  }
}
