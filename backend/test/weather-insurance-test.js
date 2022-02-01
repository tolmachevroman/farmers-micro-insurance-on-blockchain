const { expect } = require("chai");
const { ethers } = require("hardhat");

const deployContract = async function (value = ethers.utils.parseEther("0.1")) {
  const WeatherInsurance = await ethers.getContractFactory("WeatherInsurance");
  const weatherInsurance = await WeatherInsurance.deploy({ value: value });
  return await weatherInsurance.deployed();
};

describe("Weather Insurance", function () {
  it("Should have balance used to initialize the contract", async function () {
    const value = ethers.utils.parseEther("1.0");
    const weatherInsurance = await deployContract(value);
    const provider = ethers.provider;
    const initialBalance = await provider.getBalance(weatherInsurance.address);

    expect(initialBalance).to.equal(value);
  });

  it("Should shift temperatures", async function () {
    const weatherInsurance = await deployContract();

    const premium = ethers.utils.parseEther("1.0");
    const [_, alice] = await ethers.getSigners();

    // it's fake because it's just a mock object, not on the chain
    const fakeInsuranceAlice = await weatherInsurance.createInsurance(
      alice.address,
      premium,
      30,
      25,
      30,
      41,
      20
    );

    const updatedFakeInsuranceAlice = await weatherInsurance.shiftTemperatures(
      fakeInsuranceAlice,
      35
    );

    // shifts temperatures from right to left to add the last one
    expect(updatedFakeInsuranceAlice.temperature.day1).to.equal(25);
    expect(updatedFakeInsuranceAlice.temperature.day2).to.equal(30);
    expect(updatedFakeInsuranceAlice.temperature.day3).to.equal(41);
    expect(updatedFakeInsuranceAlice.temperature.day4).to.equal(20);
    expect(updatedFakeInsuranceAlice.temperature.day5).to.equal(35);
  });

  it("Should evaluate possible payments based on last five days temperature", async function () {
    const weatherInsurance = await deployContract();

    const premium = ethers.utils.parseEther("1.0");
    const [_, alice, bob] = await ethers.getSigners();

    // it's fake because it's just a mock object, not on the chain
    const fakeInsuranceAlice = await weatherInsurance.createInsurance(
      alice.address,
      premium,
      30,
      25,
      30,
      41,
      20
    );

    // have not seen extreme temperatures, do not trigger
    expect(
      await weatherInsurance.shouldPaySettlement(fakeInsuranceAlice)
    ).be.equal(false);

    // it's fake because it's just a mock object, not on the chain
    const fakeInsuranceBob = await weatherInsurance.createInsurance(
      bob.address,
      premium,
      40,
      41,
      40,
      41,
      42
    );

    // have seen extreme temperatures, do trigger
    expect(
      await weatherInsurance.shouldPaySettlement(fakeInsuranceBob)
    ).be.equal(true);
  });

  it("Should pay settlement", async function () {
    const value = ethers.utils.parseUnits("10.0", "ether"); //10 eth as initial value
    const weatherInsurance = await deployContract(value);

    const premium = ethers.utils.parseEther("1.0");
    const [_, alice] = await ethers.getSigners();

    const initialBalance = await ethers.provider.getBalance(alice.address);
    expect(initialBalance).be.equal(ethers.utils.parseUnits("100.0", "ether"));

    const optionsAlice = { from: alice.address, value: premium };
    const aliceConnectedToWeatherContract = weatherInsurance.connect(alice);
    await aliceConnectedToWeatherContract.buyInsurance(optionsAlice);

    // we had 100 eth, bought insurance for 1 eth + some gas fees
    const afterInsuranceBalance = await ethers.provider.getBalance(
      alice.address
    );
    expect(afterInsuranceBalance).to.be.within(
      ethers.utils.parseUnits("98.0", "ether"),
      ethers.utils.parseUnits("99.0", "ether")
    );
    console.log(
      "Alice's balance after buying an insurance is %s",
      afterInsuranceBalance
    );

    // we had something close to 99 eth, now we should have 99 eth + settlement
    const insuranceAlice = await weatherInsurance.insurances(0);
    await weatherInsurance.paySettlement(insuranceAlice);
    const balanceAfterPayment = await ethers.provider.getBalance(alice.address);
    console.log(
      "New Alice's balance is %s",
      ethers.utils.formatEther(balanceAfterPayment)
    );

    const multiplier = await weatherInsurance.SETTLEMENT_MULTIPLIER();
    const settlement = ethers.utils.parseUnits(
      (multiplier * premium).toString(),
      "wei"
    );
    console.log("Expected settlement is %s", settlement);
    const difference = ethers.utils.parseUnits(
      (balanceAfterPayment - afterInsuranceBalance).toString(),
      "wei"
    );
    expect(difference).to.equal(settlement);
  });

  it("Should update temperature for all insurances", async function () {
    const weatherInsurance = await deployContract();

    const premium = ethers.utils.parseEther("1.0");
    const [_, alice, bob] = await ethers.getSigners();

    const optionsAlice = { from: alice.address, value: premium };
    const aliceConnectedToWeatherContract = weatherInsurance.connect(alice);
    await aliceConnectedToWeatherContract.buyInsurance(optionsAlice);

    const optionsBob = { from: bob.address, value: premium };
    const bobConnectedToWeatherContract = weatherInsurance.connect(bob);
    await bobConnectedToWeatherContract.buyInsurance(optionsBob);

    await weatherInsurance.updateTemperature(25);

    const insuranceAlice = await weatherInsurance.insurances(0);
    const insuranceBob = await weatherInsurance.insurances(1);

    // in both insurances, new temperature should be the last
    // in the list of temperatures, other shifted
    expect(insuranceAlice.temperature.day5).to.equal(25);
    expect(insuranceBob.temperature.day5).to.equal(25);
  });
});

describe("Weather Insurance contract user", function () {
  it("Should be able to buy an insurance", async function () {
    const weatherInsurance = await deployContract();

    const [_, alice] = await ethers.getSigners();

    // minimum premium value for insurance
    const lowPremium = ethers.utils.parseEther("0.000001");
    const lowOptions = { from: alice.address, value: lowPremium };
    const aliceConnectedToWeatherContract = weatherInsurance.connect(alice);
    await expect(
      aliceConnectedToWeatherContract.buyInsurance(lowOptions)
    ).to.be.revertedWith("Premium value is too low");

    const premium = ethers.utils.parseEther("1.0");
    const options = { from: alice.address, value: premium };
    await aliceConnectedToWeatherContract.buyInsurance(options);
    const insurance = await weatherInsurance.insurances(0);

    // insurance can be successfully created
    expect(insurance.premium).to.equal(premium);
    expect(insurance.insuree).to.equal(alice.address);

    // cannot have two active insurances
    await expect(
      aliceConnectedToWeatherContract.buyInsurance(options)
    ).to.be.revertedWith("Client already has an active policy");
  });
});

// TODO test overall functionality with several accounts
