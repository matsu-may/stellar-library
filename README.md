# Stellar Library

## Problem

Traditional library management systems are centralized, lack transparency in fee
collection, and provide no verifiable record of borrowing history.

## Solution

A decentralized library management smart contract on Stellar that handles
membership registration, book catalog management, borrowing/returning with
automated late fee enforcement, and on-chain borrow history.

## Why Stellar

Leverages Soroban smart contracts for trustless library operations with native
XLM token transfers for membership fees and late fee payments via the SAC
(Stellar Asset Contract).

## Target User

Community libraries, DAOs, or educational institutions looking for transparent,
on-chain book lending management.

## Live Demo

- Network: Stellar Testnet
- Contract ID: CC3EIRCKWEOIDBSIDCBZ3YFBHIZZ66SKT3GWV22WAAZDTKQALWGJG6GY
- Transaction:https://lab.stellar.org/r/testnet/contract/CC3EIRCKWEOIDBSIDCBZ3YFBHIZZ66SKT3GWV22WAAZDTKQALWGJG6GY
  https://stellar.expert/explorer/testnet/tx/e09b5444d00a53cf570b1c6fa7473dc2edeef9797b56323e89993427da2d2b1b
  https://stellar.expert/explorer/testnet/tx/c24fc12e2aa565911a152b820d9bc6f1e6c4924b6115a9680b10a6faea69fc70

## How to Run

1. Install prerequisites: Rust, Node.js (v22+), Stellar CLI, and
   [Scaffold Stellar CLI Plugin](https://github.com/AhaLabs/scaffold-stellar)
2. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url> && cd stellar-library
   cp .env.example .env
   npm install
   ```
3. Start the development server (compiles contracts, deploys locally, launches
   frontend):
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser to interact with the library dApp
5. Run contract tests:
   ```bash
   cargo test -p library
   ```

## About me

- Name : Tran Viet Thong
- Telegram : @thongtran133
- Gmail : thongthai130308@gmail.com
