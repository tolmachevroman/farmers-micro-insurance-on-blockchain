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
    uint8 public constant TEMPERATURE_THRESHOLD = 40;

    mapping(address => bool) public activeInsurances; //TODO make private after testing
    Insurance[] public insurances; //TODO make private after testing

    struct Insurance {
        address insuree;
        Temperature temperature;
        uint256 premium;
    }

    struct Temperature {
        uint8 day1;
        uint8 day2;
        uint8 day3;
        uint8 day4;
        uint8 day5;
    }

    event SettlementPaid(uint256 _amount, address _to);

    constructor() payable {
        console.log(
            "Deploying a WeatherInsurance contract with initial balance of %s and owned by %s",
            msg.value,
            msg.sender
        );
    }

    //TODO make private after testing
    function createInsurance(
        address _insuree,
        uint256 _premium,
        uint8 _day1,
        uint8 _day2,
        uint8 _day3,
        uint8 _day4,
        uint8 _day5
    ) public pure returns (Insurance memory) {
        Temperature memory temperature;
        temperature.day1 = _day1;
        temperature.day2 = _day2;
        temperature.day3 = _day3;
        temperature.day4 = _day4;
        temperature.day5 = _day5;

        Insurance memory newInsurance;
        newInsurance.insuree = _insuree;
        newInsurance.premium = _premium;
        newInsurance.temperature = temperature;

        return newInsurance;
    }

    function buyInsurance() public payable {
        address payable _insuree = payable(msg.sender);
        require(
            activeInsurances[_insuree] == false,
            "Client already has an active policy"
        );
        require(msg.value >= MINIMUM_PREMIUM, "Premium value is too low");

        Insurance memory newInsurance = createInsurance(
            _insuree,
            msg.value,
            0,
            0,
            0,
            0,
            0
        );

        activeInsurances[_insuree] = true;
        insurances.push(newInsurance);
        console.log(
            "Adding a new insurance: %s with premium of: %s",
            newInsurance.insuree,
            newInsurance.premium
        );
    }

    function updateTemperature(uint8 _newTemperature) public payable onlyOwner {
        // update last temperature in all insurances
        for (uint256 i = 0; i < insurances.length; i++) {
            //shift the temperatures and add new temperature to the end
            Insurance memory insurance = shiftTemperatures(
                insurances[i],
                _newTemperature
            );

            //check whether new temperature triggers settlement payment for this insurance
            if (shouldPaySettlement(insurance)) {
                paySettlement(insurance);

                // remove this insurance from array
                activeInsurances[insurance.insuree] = false;
                remove(i);
            } else {
                insurances[i] = insurance;
            }
        }
    }

    //TODO make private after testing
    function shiftTemperatures(
        Insurance memory _insurance,
        uint8 _newTemperature
    ) public pure returns (Insurance memory) {
        _insurance.temperature.day1 = _insurance.temperature.day2;
        _insurance.temperature.day2 = _insurance.temperature.day3;
        _insurance.temperature.day3 = _insurance.temperature.day4;
        _insurance.temperature.day4 = _insurance.temperature.day5;
        _insurance.temperature.day5 = _newTemperature;
        return _insurance;
    }

    //TODO make private after testing
    function shouldPaySettlement(Insurance memory _insurance)
        public
        pure
        returns (bool)
    {
        bool isMoreThanThreshold = _insurance.temperature.day1 >=
            TEMPERATURE_THRESHOLD &&
            _insurance.temperature.day2 >= TEMPERATURE_THRESHOLD &&
            _insurance.temperature.day3 >= TEMPERATURE_THRESHOLD &&
            _insurance.temperature.day4 >= TEMPERATURE_THRESHOLD &&
            _insurance.temperature.day5 >= TEMPERATURE_THRESHOLD;

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
        console.log("Sent %s wei to %s", settlementToPay, addressToPay);

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
