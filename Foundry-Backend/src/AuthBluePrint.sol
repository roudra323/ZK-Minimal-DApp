// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @notice Interface for the Verifier contract
interface ICircuitVerifier {
    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    struct Proof {
        G1Point a;
        G2Point b;
        G1Point c;
    }

    /// @notice Function from the Verifier contract
    function verifyTx(
        Proof memory proof,
        uint256[2] memory input
    ) external view returns (bool);
}

abstract contract AuthBluePrint {
    // Required events
    event AuthenticationRequested(
        address indexed requestor,
        string circuitName,
        uint256 timestamp
    );
    event AuthenticationVerified(
        address indexed user,
        string circuitName,
        bool success
    );
    event QRCodeDataRequested(address indexed user, string jsonInfo);

    enum AuthState {
        NONE,
        REQUESTED,
        PENDING,
        VERIFIED,
        FAILED
    }
    mapping(address => AuthState) public userAuthState;

    // Required state variables
    ICircuitVerifier public verifier;
    address public immutable owner;
    string siteName;
    string circuitName;
    string requiredAge;

    constructor(
        address _circuitVerifierAddress,
        string memory _siteName,
        string memory _circuitName,
        string memory _requiredAge
    ) {
        owner = msg.sender;
        siteName = _siteName;
        circuitName = _circuitName;
        requiredAge = _requiredAge;
        verifier = ICircuitVerifier(_circuitVerifierAddress);
    }

    modifier AuthValidator(address user) {
        require(msg.sender == owner, "Not Authorized!");
        require(userAuthState[user] != AuthState.NONE, "User is not Valid");
        _;
    }

    function validateProof(
        ICircuitVerifier.Proof memory proof,
        uint256[2] memory input,
        address user
    ) public virtual AuthValidator(user) {
        userAuthState[user] = AuthState.PENDING;
        // Call the verifier contract
        bool isValidated = verifier.verifyTx(proof, input);
        if (isValidated == true) {
            userAuthState[user] = AuthState.VERIFIED;
        } else {
            userAuthState[user] = AuthState.FAILED;
        }
        emit AuthenticationVerified(user, circuitName, isValidated);
    }

    // Updated function to use actual requiredAge
    function genQRCodeInfo() public {
        uint256 nonce = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.number, msg.sender)
            )
        ) % 1000000;
        string memory nonceStr = uintToString(nonce);

        userAuthState[msg.sender] = AuthState.REQUESTED;
        // Now using the actual requiredAge variable
        string memory jsonInfo = string(
            abi.encodePacked(
                '{"s":"',
                siteName,
                '","c":"',
                circuitName,
                '","p":{"a":"',
                requiredAge,
                '","m":true},',
                '"n":"',
                nonceStr,
                '","u":"',
                addressToString(msg.sender),
                '"}'
            )
        );
        emit QRCodeDataRequested(msg.sender, jsonInfo);
    }

    // Helper function to convert uint to string
    function uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";

        uint256 maxlength = 100;
        bytes memory reversed = new bytes(maxlength);
        uint256 i = 0;
        while (v != 0) {
            uint256 remainder = v % 10;
            v = v / 10;
            reversed[i++] = bytes1(uint8(48 + remainder));
        }

        bytes memory s = new bytes(i);
        for (uint256 j = 0; j < i; j++) {
            s[j] = reversed[i - 1 - j];
        }

        return string(s);
    }

    // Helper function to convert address to string
    function addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes memory addressBytes = abi.encodePacked(_addr);
        bytes memory stringBytes = new bytes(42);

        stringBytes[0] = "0";
        stringBytes[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            uint8 leftNibble = uint8(addressBytes[i]) >> 4;
            uint8 rightNibble = uint8(addressBytes[i]) & 0xf;

            stringBytes[2 + i * 2] = toHexCharacter(leftNibble);
            stringBytes[2 + i * 2 + 1] = toHexCharacter(rightNibble);
        }

        return string(stringBytes);
    }

    function toHexCharacter(uint8 nibble) internal pure returns (bytes1) {
        if (nibble < 10) {
            return bytes1(uint8(nibble) + 48); // 0-9
        } else {
            return bytes1(uint8(nibble) + 87); // a-f
        }
    }
}
