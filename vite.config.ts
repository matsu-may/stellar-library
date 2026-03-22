import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import wasm from "vite-plugin-wasm"

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), nodePolyfills({}), wasm()],
	build: {
		target: "esnext",
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
