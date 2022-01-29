const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Weather Insurance", function () {
  it("Should have balance used to initialize the contract", async function () {
    const _value = 10000;
    const WeatherInsurance = await ethers.getContractFactory(
      "WeatherInsurance"
    );
    const weatherInsurance = await WeatherInsurance.deploy({ value: _value });
    await weatherInsurance.deployed();

    const provider = ethers.provider;
    const initialBalance = await provider.getBalance(weatherInsurance.address);

    expect(initialBalance).to.equal(_value);
  });
});

describe("Weather Insurance contract user", function () {
  it("Should be able to buy an insurance", async function () {
    const _value = 10000;
    const WeatherInsurance = await ethers.getContractFactory(
      "WeatherInsurance"
    );
    const weatherInsurance = await WeatherInsurance.deploy({ value: _value });
    await weatherInsurance.deployed();

    // minimum premium value for insurance
    await expect(
      weatherInsurance.buyInsurance({ value: 1000 })
    ).to.be.revertedWith("Premium value is too low");

    // insurance can be successfully created
    const premium = (1e18).toString();
    const [user1] = await ethers.getSigners();

    await weatherInsurance.buyInsurance({
      value: premium,
      from: user1.address,
    });
    const insurance = await weatherInsurance.insurances(0);
    expect(insurance.premium).to.equal(premium);
    expect(insurance.insuree).to.equal(user1.address);

    // cannot have two active insurances
    await expect(
      weatherInsurance.buyInsurance({ value: premium, from: user1.address })
    ).to.be.revertedWith("Client already has an active policy");
  });
});

// TODO test update temperature (all active insurances have this temperature as the last one)
// TODO test shifting temperatures array (new temperature should be last in the array, other shifted)
// TODO test whether should pay settlement (whether triggers the payment condition)
// TODO test paying settlement (whether the Insuree receives the settlement amount)
// TODO test overall functionality with several accounts
