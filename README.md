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
  - [Testing the contract](#testing-the-contract)
  - [Hardhat config file](#hardhat-config-file)
  - [Deploying and local Hardhat chain](#deploying-and-local-hardhat-chain)
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

### Testing the contract

Testing is an essential part of smart contracts development, more so that it's difficult to update a contract once it's deployed. We'll use Ethers and Chai libraries to interact with the contract and test it, respectively.

Let's go through the [weather-insurance-test.js](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js) file.

[Line 4](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L4) We refactor contract creation to a separate function, we'll use it everywhere later. Notices that it deploys the contract with 0.1 ETH by default.

[Lines 11-18](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L11-L18) Make sure that contract gets deployed with the initial value we specify.

[Lines 20-48](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L20-L48) Make sure that temperatures get shifted.

[Lines 50-87](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L50-L87) Make sure that payment conditions are triggered.

[Lines 89-136](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L89-L136) Make sure that settlement is paid.

[Lines 138-162](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L138-L162) Make sure temperatures get updated for multiple insurances.

[Lines 164-191](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L164-L191) Make sure clients can have one and only one insurance, bought at a price greater than the minimum specified.

### Hardhat config file

While working with Hardhat you'll eventually need to specify this or that parameter, add some dependency. Hardhat uses a special [config file](https://hardhat.org/config/#available-config-options) for that.

Let's take a look at our [hardhat.config.js](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/hardhat.config.js) file. We added [hardhat-abi-exporter](https://www.npmjs.com/package/hardhat-abi-exporter) to have a `.abi` file every time contract is compiled. This file is a kind of an interface to our contract and required on the frontend side.

Another point to mention is Hardhat local chain. We set `chainId` to 1337 to make it visible to Metamask, a popular cryptowallet we'll use later. Also, we set initial balance of fake accounts to 100 ETH.

### Deploying and local Hardhat chain

As was mentioned earlier, you can deploy your contract to a local blockchain, or to public blockchains. Popular public test blockchains are [Rinkeby](https://rinkeby.etherscan.io/) and [Ropsten](https://ropsten.etherscan.io/), and of course you can deploy to the [Ethereum mainnet](https://etherscan.io/).

We don't want to deploy it to public chains, rather, we'll follow the [guide](https://hardhat.org/guides/deploying.html#deploying-your-contracts) and deploy it to a local standalone Hardhat chain.

We'll set 10 ETH as the initial balance when [deploying](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/scripts/deploy.js) our contract locally.

![enter image description here](https://user-images.githubusercontent.com/560815/152700159-54f47900-fa5d-46ff-ba25-bf9f59aab68a.png)
![enter image description here](https://user-images.githubusercontent.com/560815/152700160-e19d9cf1-c188-4b28-a6f5-6179d483c278.png)

Notice that the contract owner is in fact the first account of the 20 accounts provided by Hardhat.

You may have noticed that in the tests, we [skipped the first signer](https://github.com/tolmachevroman/farmers-micro-insurance-on-blockchain/blob/main/backend/test/weather-insurance-test.js#L168), and started with Alice and Bob as our clients. And that's because the first signer is just us, the ones deploying the contract. We can have an insurance too, no doubt! But I like to think of the contract owner as a _company_, and of others as _clients_.
