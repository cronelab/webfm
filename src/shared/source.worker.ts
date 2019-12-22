import BCI2K from "bci2k";
const ctx: Worker = self as any;


ctx.onmessage = e => {
	if (e.data == "Connect!") {
		let _bciConnection = new BCI2K.bciOperator();
		let _bciSourceConnection = new BCI2K.bciData();

		_bciConnection.connect(`ws://127.0.0.1`)
			.then((event: any) => {
				_bciConnection.stateListen()
				_bciConnection.onStateChange = (currentState: any) => ctx.postMessage({
					state: currentState
				})
				_bciSourceConnection.connect("ws://127.0.0.1:20100", 'worker').then(() => {
					_bciSourceConnection.onGenericSignal = (data: any) => {
						ctx.postMessage({
							data: data
						})
					}
				})
			})

	}
}