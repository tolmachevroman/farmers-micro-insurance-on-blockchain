import { useEffect, useState } from "react";
import {
  weatherInsuranceContract,
  connectWallet,
  buyInsurance,
  updateTemperature,
} from "./util/interact.js";

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
    weatherInsuranceContract.on("SettlementPaid", (amount, to, data, _) => {
      const value = ethers.utils.formatEther(amount);
      const message =
        "💰 Settlement paid: " +
        value +
        " ETH to " +
        to +
        "\n  You can buy another insurance again!";
      console.log("Settlement paid: %s ETH to ", value, to);
      setStatus(message);
    });
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
        setStatus("⛔ " + err.message);
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

      <h1 style={{ marginTop: "50px" }}>Weather-Based Micro Insurance 🌤️</h1>
      <h2>How does it work?</h2>
      <p>
        You buy an insurance with the premium you specify, minimum value of 0.1
        ETH. System updates temperature. It could be an external provider like
        an Oracle updating in every day or we can manually send temperature
        updates.
      </p>
      <p>
        Smart contract will automatically trigger settlement payments when there
        are 5 temperature values of 41 degree Celcius or more in a row.
      </p>

      <div className="flexbox-container">
        <div className="input-button">
          <h2>Buy an Insurance</h2>
          <h3>Specify premium of the insurance in ETH:</h3>
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
        </div>

        <div className="input-button">
          <h2>Update Temperature</h2>
          <h3>Specify new temperature in degrees Celsius:</h3>
          <div>
            <input
              type="text"
              placeholder="Temperature in degrees Celsius"
              onChange={(e) => setTemperature(e.target.value)}
              value={temperature}
            />

            <button id="updateTemperature" onClick={onUpdateTemperaturePressed}>
              Update temperature
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Status:</h2>
        <div id="status">{status}</div>
      </div>
    </div>
  );
};

export default WeatherInsurance;
