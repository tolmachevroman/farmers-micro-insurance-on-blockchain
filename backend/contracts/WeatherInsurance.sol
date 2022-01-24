// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract WeatherInsurance {
    uint256 public constant SETTLEMENT_MULTIPLIER = 5;

    // 38 degrees Celcius or more during 5 days triggers settlement payment
    uint256 public constant TEMPERATURE_THRESHOLD = 38;

    mapping(address => bool) private activeInsurances;
    Insurance[] private insurances;

    struct Insurance {
        uint256[5] temperatureInThelastFiveDays; //TODO maybe use uint mediumTemperature?
        uint256 premium;
    }

    function buyInsurance() public payable {
        require(
            activeInsurances[msg.sender] == false,
            "Client already has an active policy"
        );
        Insurance memory newInsurance;
        newInsurance.premium = msg.value;

        activeInsurances[msg.sender] = true;
    }

    function updateTemperature(uint256 _temperature) public view {
        // update last temperature in all insurances
        for (uint256 i = 0; i < insurances.length; i++) {
            Insurance memory insurance = insurances[i];

            //shift the array and add new temperature to the end
            insurance.temperatureInThelastFiveDays[0] = insurance
                .temperatureInThelastFiveDays[1];
            insurance.temperatureInThelastFiveDays[1] = insurance
                .temperatureInThelastFiveDays[2];
            insurance.temperatureInThelastFiveDays[2] = insurance
                .temperatureInThelastFiveDays[3];
            insurance.temperatureInThelastFiveDays[3] = insurance
                .temperatureInThelastFiveDays[4];
            insurance.temperatureInThelastFiveDays[4] = _temperature;
        }
    }

    function isTemperatureMoreThanThreshold(Insurance memory insurance)
        private
        pure
        returns (bool)
    {
        bool moreThanThreshold = true;
        for (
            uint256 i = 0;
            i < insurance.temperatureInThelastFiveDays.length;
            i++
        ) {
            moreThanThreshold =
                moreThanThreshold &&
                insurance.temperatureInThelastFiveDays[i] >=
                TEMPERATURE_THRESHOLD;
        }
        return moreThanThreshold;
    }
}
