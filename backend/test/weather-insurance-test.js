const { expect } = require("chai");
const { ethers } = require("hardhat");

const deployContract = async function (value = 1e9) {
  const WeatherInsurance = await ethers.getContractFactory("WeatherInsurance");
  const weatherInsurance = await WeatherInsurance.deploy({ value: value });
  return await weatherInsurance.deployed();
};

describe("Weather Insurance", function () {
  it("Should have balance used to initialize the contract", async function () {
    const value = 10000;
    const weatherInsurance = await deployContract(value);
    const provider = ethers.provider;
    const initialBalance = await provider.getBalance(weatherInsurance.address);

    expect(initialBalance).to.equal(value);
  });

  it("Should update temperature for all insurances", async function () {
    const weatherInsurance = await deployContract();

    const premium = (1e18).toString();
    const [user1, user2] = await ethers.getSigners();

    await weatherInsurance.buyInsurance(user1.address, premium);

    await weatherInsurance.buyInsurance(user2.address, premium);

    await weatherInsurance.updateTemperature(25);

    const insurance1 = await weatherInsurance.insurances(0);
    const insurance2 = await weatherInsurance.insurances(1);

    console.log(insurance2);
    // expect(insurance.premium).to.equal(premium);
  });
});

describe("Weather Insurance contract user", function () {
  it("Should be able to buy an insurance", async function () {
    const weatherInsurance = await deployContract();
    const [user1] = await ethers.getSigners();

    // minimum premium value for insurance
    await expect(
      weatherInsurance.buyInsurance(user1.address, 1000)
    ).to.be.revertedWith("Premium value is too low");

    // insurance can be successfully created
    const premium = (1e18).toString();

    await weatherInsurance.buyInsurance(user1.address, premium);
    const insurance = await weatherInsurance.insurances(0);
    expect(insurance.premium).to.equal(premium);
    expect(insurance.insuree).to.equal(user1.address);

    // cannot have two active insurances
    await expect(
      weatherInsurance.buyInsurance(user1.address, premium)
    ).to.be.revertedWith("Client already has an active policy");
  });
});

// TODO test update temperature (all active insurances have this temperature as the last one)
// TODO test shifting temperatures array (new temperature should be last in the array, other shifted)
// TODO test whether should pay settlement (whether triggers the payment condition)
// TODO test paying settlement (whether the Insuree receives the settlement amount)
// TODO test overall functionality with several accounts
