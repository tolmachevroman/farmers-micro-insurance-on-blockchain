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

  it("Should shift temperatures", async function () {
    const weatherInsurance = await deployContract();

    const premium = (1e18).toString();
    const [user1] = await ethers.getSigners();

    const insurance1 = await weatherInsurance.createInsurance(
      user1.address,
      premium,
      30,
      25,
      30,
      41,
      20
    );

    const updatedInsurance = await weatherInsurance.shiftTemperatures(
      insurance1,
      35
    );

    // shifts temperatures from right to left to add the last one
    expect(updatedInsurance.temperature.day1).to.equal(25);
    expect(updatedInsurance.temperature.day2).to.equal(30);
    expect(updatedInsurance.temperature.day3).to.equal(41);
    expect(updatedInsurance.temperature.day4).to.equal(20);
    expect(updatedInsurance.temperature.day5).to.equal(35);
  });

  it("Should evaluate possible payments based on last five days temperature", async function () {
    const weatherInsurance = await deployContract();

    const premium = (1e18).toString();
    const [user1] = await ethers.getSigners();

    const insurance1 = await weatherInsurance.createInsurance(
      user1.address,
      premium,
      30,
      25,
      30,
      41,
      20
    );

    // have not seen extreme temperatures, do not trigger
    expect(await weatherInsurance.shouldPaySettlement(insurance1)).be.equal(
      false
    );

    const insurance2 = await weatherInsurance.createInsurance(
      user1.address,
      premium,
      40,
      41,
      40,
      41,
      42
    );

    // have seen extreme temperatures, do trigger
    expect(await weatherInsurance.shouldPaySettlement(insurance2)).be.equal(
      true
    );
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

    // new temperature should be the last in the list of temperatures, other shifted
    expect(insurance1.temperature.day5).to.equal(25);
    expect(insurance2.temperature.day5).to.equal(25);
  });
});

describe("Weather Insurance contract user", function () {
  it("Should be able to buy an insurance", async function () {
    const weatherInsurance = await deployContract();

    const premium = (1e18).toString();
    const [user1] = await ethers.getSigners();

    // minimum premium value for insurance
    await expect(
      weatherInsurance.buyInsurance(user1.address, 1000)
    ).to.be.revertedWith("Premium value is too low");

    await weatherInsurance.buyInsurance(user1.address, premium);
    const insurance = await weatherInsurance.insurances(0);

    // insurance can be successfully created
    expect(insurance.premium).to.equal(premium);
    expect(insurance.insuree).to.equal(user1.address);

    // cannot have two active insurances
    await expect(
      weatherInsurance.buyInsurance(user1.address, premium)
    ).to.be.revertedWith("Client already has an active policy");
  });
});

// TODO test paying settlement (whether the Insuree receives the settlement amount)
// TODO test overall functionality with several accounts
