import { useEffect, useState } from "react";
import {
  weatherInsuranceContract,
  connectWallet,
  buyInsurance,
  updateTemperature,
} from "./util/interact.js";

// Expected functionality:
// 1. Connect to the web using Metamask and a fake hardhat account
// 2. Buy an insurance
// 3. Show all insurances on the web
// 4. Have a button to update temperature, or maybe a script
// 5. Repeat 1 and 2 for several accounts
// 6. Have 8 insurances, created in different time regarding temperature update
// 7. Show all the temperatures on the web
// 8. Show when settlement is paid and insurane is closed

import alchemylogo from "./logo.svg";

const { ethers } = require("ethers");

const WeatherInsurance = () => {
  //state variables
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [temperature, setTemperature] = useState("25"); //default message
  const [premiumInEthers, setPremiumInEthers] = useState("0.2");

  //called only once
  useEffect(() => {
    addSmartContractListener();
    getCurrentWalletConnected();
    addWalletListener();
  }, []);

  async function addSmartContractListener() {
    weatherInsuranceContract.on("SettlementPaid", (from, to, amount, event) => {
      console.log(`${from} sent ${ethers.formatEther(amount)} to ${to}`);
    });

    // weatherInsuranceContract.events.UpdatedMessages({}, (error, data) => {
    //   if (error) {
    //     setStatus("😥 " + error.message);
    //   } else {
    //     // setMessage(data.returnValues[1]);
    //     // setNewMessage("");
    //     setStatus("🎉 Your message has been updated!");
    //   }
    // });
  }

  async function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("🌡️ Set new temperature in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }

  async function getCurrentWalletConnected() {
    if (window.ethereum) {
      try {
        const addressArray = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (addressArray.length > 0) {
          setWallet(addressArray[0]);
          setStatus("🌡️ Set new temperature in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button..");
        }
      } catch (err) {
        setWallet("");
        setStatus("😥 " + err.message);
      }
    } else {
      setWallet("");
      setStatus(
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
      );
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const onBuyInsurancePressed = async () => {
    const { status } = await buyInsurance(walletAddress, premiumInEthers);
    setStatus(status);
  };

  const onUpdateTemperaturePressed = async () => {
    const { status } = await updateTemperature(walletAddress, temperature);
    setStatus(status);
  };

  //the UI of our component
  return (
    <div id="container">
      <img id="logo" src={alchemylogo}></img>
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      <h2 style={{ paddingTop: "18px" }}>Buy an Insurance:</h2>
      <div>
        <input
          type="text"
          placeholder="Value in Ethers"
          onChange={(e) => setPremiumInEthers(e.target.value)}
          value={premiumInEthers}
        />

        <button id="buyInsurance" onClick={onBuyInsurancePressed}>
          Buy Insurance
        </button>
      </div>

      <h2 style={{ paddingTop: "18px" }}>Send new temperature:</h2>
      <div>
        <input
          type="text"
          onChange={(e) => setTemperature(e.target.value)}
          value={temperature}
        />

        <button id="updateTemperature" onClick={onUpdateTemperaturePressed}>
          Update temperature
        </button>
      </div>

      <div>
        <h2>Status:</h2>
        <div id="status">{status}</div>
      </div>
    </div>
  );
};

export default WeatherInsurance;
