// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AuthBluePrint, ICircuitVerifier} from "./AuthBluePrint.sol";

contract RandomDApp is AuthBluePrint {
    mapping(address => bool) userStatus;

    constructor(
        address _circuitVerifierAddress,
        string memory _siteName,
        string memory _circuitName,
        string memory _requiredAge
    )
        AuthBluePrint(
            _circuitVerifierAddress,
            _siteName,
            _circuitName,
            _requiredAge
        )
    {}

    // Must implement this abstract function
    function validateProof(
        ICircuitVerifier.Proof memory proof,
        uint256[2] memory input,
        address user
    ) public override {
        // Call the parent implementation first
        super.validateProof(proof, input, user);

        // custom conditions
        if (userAuthState[user] == AuthState.VERIFIED) {
            userStatus[user] = true;
        }
    }

    // Custom functions specific to this DApp

    function getUserStatus() external view returns (bool) {
        return userStatus[msg.sender];
    }
}
