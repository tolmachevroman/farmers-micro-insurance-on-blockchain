const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WeatherInsurance", function () {
    it("Should have balance used to initialize the contract", async function () {
        const _value = 10000
        const WeatherInsurance = await ethers.getContractFactory("WeatherInsurance");
        const weatherInsurance = await WeatherInsurance.deploy({ value: _value });
        await weatherInsurance.deployed();

        const provider = ethers.provider;
        const initialBalance = await provider.getBalance(weatherInsurance.address);

        expect(initialBalance).to.equal(_value);
    });
});

// TODO test buying insurance (minimum premium, cannot have two active insurances)
// TODO test update temperature (all active insurances have this temperature as the last one)
// TODO test shifting temperatures array (new temperature should be last in the array, other shifted)
// TODO test whether should pay settlement (whether triggers the payment condition)
// TODO test paying settlement (whether the Insuree receives the settlement amount)
// TODO test overall functionality with several accounts