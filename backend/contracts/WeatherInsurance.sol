// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract WeatherInsurance is Ownable {
    // settlement amount is set to premium times multiplier
    // for example, if client (insuree) paid 1 eth in premium,
    // he/she will receive 3 eth as a settlement payment
    uint256 public constant SETTLEMENT_MULTIPLIER = 3;

    // minimum required premium is 0.1 Eth or approximately
    // 235 USD on Jan 24 2022
    uint256 public constant MINIMUM_PREMIUM = 1e17;

    // 40 degrees Celcius or more during 5 days in a row triggers settlement payment
    uint256 public constant TEMPERATURE_THRESHOLD = 40;

    mapping(address => bool) public activeInsurances; //TODO make private after testing
    Insurance[] public insurances; //TODO make private after testing

    struct Insurance {
        address insuree;
        uint256[5] temperatureInThelastFiveDays;
        uint256 premium;
    }

    event SettlementPaid(uint256 _amount, address _to);

    constructor() payable {
        console.log(
            "Deploying a WeatherInsurance contract with initial balance of:",
            msg.value
        );
    }

    function buyInsurance() public payable {
        require(
            activeInsurances[msg.sender] == false,
            "Client already has an active policy"
        );
        require(msg.value >= MINIMUM_PREMIUM, "Premium value is too low");

        Insurance memory newInsurance;
        newInsurance.insuree = msg.sender;
        newInsurance.premium = msg.value;

        activeInsurances[msg.sender] = true;
        insurances.push(newInsurance);
        console.log(
            "Adding a new insurance: %s with premium of: %s",
            newInsurance.insuree,
            newInsurance.premium
        );

    }

    function updateTemperature(uint256 _newTemperature)
        public
        payable
        onlyOwner
    {
        // update last temperature in all insurances
        for (uint256 i = 0; i < insurances.length; i++) {
            Insurance memory insurance = insurances[i];

            //shift the array and add new temperature to the end
            shiftTemperatureArray(insurance, _newTemperature);

            //check whether new temperature triggers settlement payment for this insurance
            if (shouldPaySettlement(insurance)) {
                paySettlement(insurance);

                // remove this insurance from array
                activeInsurances[insurance.insuree] = false;
                remove(i);
            }
        }
    }

    //TODO make private after testing
    function shiftTemperatureArray(
        Insurance memory _insurance,
        uint256 _newTemperature
    ) public pure {
        _insurance.temperatureInThelastFiveDays[0] = _insurance
            .temperatureInThelastFiveDays[1];
        _insurance.temperatureInThelastFiveDays[1] = _insurance
            .temperatureInThelastFiveDays[2];
        _insurance.temperatureInThelastFiveDays[2] = _insurance
            .temperatureInThelastFiveDays[3];
        _insurance.temperatureInThelastFiveDays[3] = _insurance
            .temperatureInThelastFiveDays[4];
        _insurance.temperatureInThelastFiveDays[4] = _newTemperature;
    }

    //TODO make private after testing
    function shouldPaySettlement(Insurance memory _insurance)
        public
        pure
        returns (bool)
    {
        bool isMoreThanThreshold = true;
        for (
            uint256 i = 0;
            i < _insurance.temperatureInThelastFiveDays.length;
            i++
        ) {
            isMoreThanThreshold =
                isMoreThanThreshold &&
                _insurance.temperatureInThelastFiveDays[i] >=
                TEMPERATURE_THRESHOLD;
        }
        return isMoreThanThreshold;
    }

    function paySettlement(Insurance memory _insurance)
        public
        payable
        onlyOwner
    {
        uint256 settlementToPay = SETTLEMENT_MULTIPLIER * _insurance.premium;
        address addressToPay = _insurance.insuree;

        (bool sent, ) = addressToPay.call{value: settlementToPay}("");
        require(sent, "Failed to send Ether");

        emit SettlementPaid(settlementToPay, addressToPay);
    }

    // removes item from array and shifts from right to left
    function remove(uint256 _index) private {
        require(_index < insurances.length, "index out of bound");

        for (uint256 i = _index; i < insurances.length - 1; i++) {
            insurances[i] = insurances[i + 1];
        }
        insurances.pop();
    }
}
