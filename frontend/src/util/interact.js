// require("dotenv").config();
const { ethers } = require("ethers");

const provider = new ethers.providers.Web3Provider(window.ethereum);

const contractABI = require("../contract-abi.json");
const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const weatherInsuranceContract = new ethers.Contract(
  contractAddress,
  contractABI,
  provider
);

export const buyInsurance = async (address, premiumInEthers) => {
  //input error handling
  if (!window.ethereum || address === null) {
    return {
      status:
        "💡 Connect your Metamask wallet to update the message on the blockchain.",
    };
  }

  //sign the transaction
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const premium = ethers.utils.parseUnits(premiumInEthers, "ether");

    const signer = provider.getSigner();
    const contractAlice = weatherInsuranceContract.connect(signer);
    const tx = await contractAlice.buyInsurance({ value: premium });
    const result = await tx.wait();

    console.log(result);

    return {
      status: (
        <span>
          ✅ Sent successfully!
          <p>Transaction hash: {result.transactionHash}</p>
        </span>
      ),
    };
  } catch (error) {
    return {
      status: "⛔ " + error.data.message,
    };
  }
};

export const updateTemperature = async (address, newTemperature) => {
  //input error handling
  if (!window.ethereum || address === null) {
    return {
      status:
        "💡 Connect your Metamask wallet to update the message on the blockchain.",
    };
  }

  if (newTemperature.trim() === "") {
    return {
      status: "❌ Your temperature cannot be an empty string.",
    };
  }

  //sign the transaction
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const signer = provider.getSigner();
    const contractAlice = weatherInsuranceContract.connect(signer);
    const tx = await contractAlice.updateTemperature(newTemperature);
    const result = await tx.wait();

    console.log(result);

    return {
      status: (
        <span>
          ✅ Sent successfully!
          <p>Transaction hash: {result.transactionHash}</p>
        </span>
      ),
    };
  } catch (error) {
    return {
      status: "⛔ " + error.data.message,
    };
  }
};

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const obj = {
        status: "👆🏽 Write a message in the text-field above.",
        address: addressArray[0],
      };
      return obj;
    } catch (err) {
      return {
        address: "",
        status: "⛔ " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};
