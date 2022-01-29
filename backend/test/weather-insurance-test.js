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