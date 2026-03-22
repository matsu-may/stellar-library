import * as Client from "guess_the_number"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Standalone Network ; February 2017",
	contractId: "CC5RIU667TL6XKYOP35RK6XWJK344LS5O2L6BXPXWPW2TKVB2NKN2T5G",
	rpcUrl,
	allowHttp: true,
	publicKey: undefined,
})
