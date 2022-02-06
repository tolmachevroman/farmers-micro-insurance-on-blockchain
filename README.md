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

Let's go through [the contract](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol) step by step.

[Line 8](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L8) `Ownable` means that only address that created this contract (i.e. owner) can execute certain methods marked with `onlyOwner` identifier. [Ownable](https://docs.openzeppelin.com/contracts/2.x/api/ownership) is an open-source contract provided by an organization called Zeppelin.

[Lines 12-19](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L12-L19) We define three constants: settlement (payment the insuree receives) multiplier, minimum premium price and temperature threshold. To give an example, if I bought an insurance with 1 ETH premium and temperature has been hotter than the threshold for five days in a row, then I should receive premium \* multiplier, or 3 ETH.

[Line 21](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L21) We need to keep track of active insurances, so that one person/address cannot have more than one active policy.

[Line 22](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L22) We keep insurances on-chain in an array.

[Lines 24-36](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L24-L36) Each `Insurance` object has an insuree (address of its owner), a premium value and last five temperatures encoded in a `Temperature` object. There multiple ways to implement this, actually I started with an array, but there were issues with logging this array later while testing, so I decided to keep it as a struct instead.

[Line 38](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L38) Events are a way for Solidity to broadcast changes to the exterior. This event in particular will be useful later when interacting with the web app.

[Lines 40-46](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L40-L46) Our contract receives money on creation, so its `payable`. Settlements are greater than premiums, so it's a good idea to deploy contract with some reasonable amount of money to start with.

[Lines 49-71](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L49-L71) `createInsurance()` is mostly for testing purposes, when we don't need to actually add a new insurance.

[Lines 73-98](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L73-L98) `buyInsurance()` is called by our clients. It receives ETH sent by them and uses their address to create a new `Insurance` and add it on-chain. Notice that it will revert if the ETH sent is below minimum or if there's an active policy owned by this address.

[Lines 100-121](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L100-L121) `updateTemperature()` is called by a contract owner only, to avoid setting wrong temperature by someone else. This method updates temperature list in all active insurances and checks whether we should pay them.

[Lines 124-134](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L124-L134) `shiftTemperatures()` is a helper method to shift temperatures from right to left when new one is added.

[Lines 137-150](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L137-L150) `shouldPaySettlement()` is a helper method to decide if there should be a settlement payment.

[Lines 152-166](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L152-L166) `paySettlement()` is called by a contract owner only, and transfers settlement to a given insuree.

[Lines 169-176](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/contracts/WeatherInsurance.sol#L169-L176) `remove()` is a helper method to remove an `Insurance` from the `_insurances` array.

Notice that many methods should be `private` when deploying to a public chain, it's just that in order to test them from Javascript code they should be visible. So in a real-world situation, you would mark them `private` after testing and before deployment.
