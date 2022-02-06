# Weather-Based Micro Insurance application using Blockchain and React

## Project overview

Consider a situation: you're a farmer 🧑‍🌾 and need to protect your crops from draught. In developed countries, you have sophisticated insurance industry, and after you send a claim, experts from your insurance company come and actually check the damage to decide on the money you'll receive.

However, farmers living in developing countries often times don't have access to that level of insurance or traditional banking. You'd like to provide them with an accessible insurance product and decide on settlements automatically to save costs.

Imagine such a product: farmers can buy insurance starting from 0.1 ETH (Ether, native cryptocurrency of Ethereum and second market cap after Bitcoin), about 300$ in early February 2022. Smart contract, a publicly available code, has no small letters or human meddling. It receives temperature updates from some external provider, say maximum daily temperature every day. If the last five temperatures were hotter than some defined threshold value, it will pay the settlement automatically.

Granted it's a contrived example and real insurance companies don't work this way, but it's a great way to discover smart contracts and how to interact with them!

## Project structure

This is a full stack project. Backend provides smart contract logic running on a local Ethereum blockchain using Hardhat, frontend provides a web app to connect to this local blockchain and interact with the smart contract using React.

Technology stack includes [Hardhat](https://hardhat.org/) and [React](https://reactjs.org/) frameworks, Solidity for backend and Javascript for both of them. Both use [Ethers.js](https://docs.ethers.io/v5/) extensively, too.

Project can be divided in the following sections:

- [Backend](#backend)
  - [Getting started with Hardhat](#getting-started-with-hardhat)
  - [Contract general overview](#contract-general-overview)
  - [Contract implementation](#contract-implementation)
  - Testing the contract
  - Hardhat config file
  - Deploying and local Hardhat chain
- Frontend
  - Getting started with React
  - Interacting with EVM blockchains
  - Widget general overview
  - Widget implementation
  - Testing functionality with local Hardhat chain
- Final thoughts and notes

## Backend

### Getting started with Hardhat

Hardhat is an excellent choice when developing EVM compatible software. It provides clean and simple CLI to create, test and deploy smart contracts. It comes with local blockchain and predefined accounts to deploy your contracts locally to avoid typical delays when working with public chains.

There's no need to deploy our contract on public test chains, and local chain fits perfectly our needs. Still as an exercise, I highly recommend going through [Alchemy tutorials](https://docs.alchemy.com/alchemy/tutorials/simple-web3-script). They are highly educational, and in fact this project was inspired by Alchemy samples.

We'll follow the [basic guide](https://hardhat.org/getting-started/) and create an empty Hardhat project and add an empty `WeatherInsurance.sol` contract.

### Contract general overview

So what do we need in our contract? We should have a way to buy an insurance and to keep it on-chain, a way to send a temperature update, to decide on conditions and finally to pay settlement to a given insurance.

### Contract implementation
