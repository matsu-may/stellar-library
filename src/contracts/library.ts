import * as Client from "library"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Standalone Network ; February 2017",
	contractId: "CC66LEXFJPK5F6AEEU4LJ6BQHYVOJYFEJP4QF7R3GSV4Y4S7R6M7QF4Y",
	rpcUrl,
	allowHttp: true,
	publicKey: undefined,
})
