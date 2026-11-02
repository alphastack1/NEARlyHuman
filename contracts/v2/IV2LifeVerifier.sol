// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IV2LifeVerifier {
    function initialize(bytes32 seed, uint8[3] calldata stats) external pure returns (bytes memory);
    function transition(bytes calldata saved, bytes calldata trace, bytes calldata certificate, bytes32 daySeed, uint64 kitMask, bool shipping)
        external view returns (bytes memory result, uint16 shipmentDecipoints);
    function validateKit(bytes calldata saved, uint64 kitMask) external pure;
    function maxShipmentPoints(bytes calldata saved) external pure returns (uint16);
    function inspect(bytes calldata saved) external pure returns (uint32 day, uint32 level, bool alive);
    function rulesHash() external pure returns (bytes32);
}
