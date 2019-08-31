import BCI2K from "@cronelab/bci2k";


onmessage = e => {
    if (e.data == "Connect!") {
        let _bciConnection = new BCI2K.bciOperator();
        let _bciSourceConnection = new BCI2K.bciData();

        _bciConnection.connect(`ws://127.0.0.1`)
            .then(event => {
                _bciConnection.stateListen()
                _bciConnection.onStateChange = currentState => postMessage({
                    state: currentState
                })
                _bciSourceConnection.connect("ws://127.0.0.1:20100", 'worker').then(() => {
                    _bciSourceConnection.onGenericSignal = data => {
                        postMessage({
                            data: data
                        })
                    }
                })
            })

    }
}