require("@nomiclabs/hardhat-waffle");
require("hardhat-abi-exporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: "100000000000000000000", // 100 eth for each account
      },
    },
  },
  abiExporter: {
    path: "./data/abi",
    runOnCompile: true,
    clear: true,
    pretty: false,
  },
};
