import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import wasm from "vite-plugin-wasm"

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), nodePolyfills({}), wasm()],
	build: {
		target: "esnext",
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("@stellar/stellar-sdk")) return "stellar-sdk"
					if (id.includes("@stellar/design-system")) return "stellar-design"
					if (id.includes("@creit.tech/stellar-wallets-kit"))
						return "stellar-wallets"
					if (id.includes("@theahaco/contract-explorer"))
						return "contract-explorer"
					if (
						id.includes("node_modules/react/") ||
						id.includes("node_modules/react-dom/") ||
						id.includes("node_modules/react-router")
					)
						return "react"
				},
			},
		},
	},
	optimizeDeps: {
		exclude: ["@stellar/stellar-xdr-json"],
	},
	envPrefix: "PUBLIC_",
	server: {
		proxy: {
			"/friendbot": {
				target: "http://localhost:8000/friendbot",
				changeOrigin: true,
			},
		},
	},
})
