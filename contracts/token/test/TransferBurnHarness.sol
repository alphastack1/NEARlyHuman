// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NHCTransferBurn} from "../NHCTransferBurn.sol";

/// @dev Local verification harness only. This is not a deployable game release.
contract TransferBurnHarness {
    address public immutable owner;
    NHCTransferBurn public immutable token;
    uint256 public totalAllocated;
    uint256 public birthBurns;
    mapping(uint256 => uint256) public purse;

    error OwnerOnly();
    modifier onlyOwner() { if (msg.sender != owner) revert OwnerOnly(); _; }

    constructor(bool enabled) {
        owner = msg.sender;
        token = new NHCTransferBurn(enabled);
    }
    function setTransferBurnEnabled(bool enabled) external onlyOwner { token.setTransferBurnEnabled(enabled); }
    function credit(uint256 id, uint256 amount) external onlyOwner {
        purse[id] += amount;
        totalAllocated += amount;
        token.mintVault(amount);
        _backed();
    }
    function withdraw(uint256 id, address receiver, uint256 gross) external onlyOwner {
        require(purse[id] >= gross, "purse funds");
        purse[id] -= gross;
        totalAllocated -= gross;
        require(token.transfer(receiver, gross), "transfer");
        _backed();
    }
    function walletBirth() external {
        uint256 price = 250_000_000;
        token.burnWalletForBirth(msg.sender, price);
        birthBurns += price;
        _backed();
    }
    function purseBirth(uint256 id) external onlyOwner {
        uint256 price = 250_000_000;
        require(purse[id] >= price, "purse funds");
        purse[id] -= price;
        totalAllocated -= price;
        token.burnVault(price);
        birthBurns += price;
        _backed();
    }
    function _backed() private view { require(token.balanceOf(address(this)) >= totalAllocated, "backed purses"); }
}
