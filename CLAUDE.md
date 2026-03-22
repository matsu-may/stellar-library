# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Scaffold Stellar dApp template: React + TypeScript frontend paired with Soroban
(Stellar) smart contracts in Rust. Uses `stellar-scaffold` CLI to compile
contracts to WASM, deploy them, and auto-generate TypeScript client packages.

## Common Commands

```bash
npm run dev              # Start dev server (stellar scaffold watch + Vite concurrently)
npm run build            # TypeScript check + Vite production build
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TypeScript type-checking only
npm run install:contracts # Build contract client packages in packages/ workspace
```

### Contract Development

```bash
# Compile and deploy contracts (handled automatically by `npm run dev`)
stellar scaffold build --build-clients

# Run Rust contract tests
cargo test -p guess-the-number
cargo test -p fungible-allowlist
cargo test -p nft-enumerable
```

### Environment Setup

```bash
cp .env.example .env     # Then edit network config
# Key env vars: STELLAR_SCAFFOLD_ENV, PUBLIC_STELLAR_NETWORK, PUBLIC_STELLAR_RPC_URL
```

## Architecture

### Smart Contracts (`contracts/`)

Rust workspace members compiled to WASM via Soroban SDK 23.x. Three example
contracts:

- **guess-the-number**: Game contract (admin-managed pot, PRNG-based guessing)
- **fungible-allowlist**: SEP-41 token with role-based access control (admin +
  manager roles)
- **nft-enumerable**: NFT with sequential minting and enumeration

Contracts use OpenZeppelin's `stellar-contracts` v0.5.1 for token standards and
access control. Rust toolchain pinned to 1.89.0 with `wasm32v1-none` target.

### Auto-Generated Contract Clients (`packages/`)

`stellar-scaffold` compiles contracts and generates TypeScript NPM packages in
`packages/`. These are workspace dependencies consumed by the frontend. The
`packages/` directory is gitignored — clients are built at dev/CI time.

### Frontend (`src/`)

React 19 SPA with two routes:

- `/` — Home page with GuessTheNumber demo
- `/debug` — Contract Explorer (dynamically loads all contract clients via
  `import.meta.glob`)

**Providers** (Context API):

- `WalletProvider` — wallet connection, network state, balance polling (1s
  interval) via StellarWalletsKit
- `NotificationProvider` — toast notifications with auto-dismiss

**Contract config** (`src/contracts/util.ts`): Zod-validated network
configuration supporting LOCAL, TESTNET, FUTURENET, PUBLIC networks. Contract
client files in `src/contracts/` are auto-generated (excluded from linting).

### Network Environments (`environments.toml`)

Three environments: development (localhost), staging (testnet), production
(mainnet). Each defines RPC URL, network passphrase, and contract deployment
configs with constructor args.

## Key Conventions

- Environment variables use `PUBLIC_` prefix (Vite convention)
- Pre-commit hooks run ESLint + Prettier via lint-staged
- Contract client files in `src/contracts/` (except `util.ts`) are
  auto-generated — don't edit manually
- Vite config includes Node polyfills and WASM support for Stellar SDK
  compatibility
- CI builds contracts with `STELLAR_SCAFFOLD_ENV=development`
