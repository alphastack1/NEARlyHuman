// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice Future NHC implementation. Not the token used by the current deployments.
/// @dev Deploy from the next game controller. Its owner-only forwarding method
/// controls the on/off switch; the rate is fixed and no address is tax-exempt.
contract NHCTransferBurn is ERC20 {
    uint256 public constant TRANSFER_BURN_BPS = 50;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    address public immutable controller;
    bool public transferBurnEnabled;
    uint256 public totalTransferBurned;

    error ControllerOnly(address caller);
    event TransferBurnEnabled(bool enabled);
    event TransferBurn(address indexed from, address indexed to, uint256 gross, uint256 burned);

    constructor(bool initiallyEnabled) ERC20("NEARlyHuman Coin", "NHC") {
        controller = msg.sender;
        transferBurnEnabled = initiallyEnabled;
        emit TransferBurnEnabled(initiallyEnabled);
    }

    modifier onlyController() {
        if (msg.sender != controller) revert ControllerOnly(msg.sender);
        _;
    }

    function decimals() public pure override returns (uint8) { return 6; }

    /// @dev The next game must expose this through its existing onlyOwner gate.
    function setTransferBurnEnabled(bool enabled) external onlyController {
        transferBurnEnabled = enabled;
        emit TransferBurnEnabled(enabled);
    }

    function mintVault(uint256 amount) external onlyController { _mint(controller, amount); }
    function burnVault(uint256 amount) external onlyController { _burn(controller, amount); }

    /// @notice Burn the wallet's approved birth price directly. No transfer occurs.
    /// @dev The caller must be the game, and the wallet must approve that game.
    /// This avoids taking a taxed 250-NHC deposit and burning other purses' backing.
    function burnWalletForBirth(address account, uint256 amount) external onlyController {
        _spendAllowance(account, controller, amount);
        _burn(account, amount);
    }

    /// @notice Quote an address-to-address transfer at the current toggle state.
    function previewTransfer(uint256 gross) public view returns (uint256 received, uint256 burned) {
        burned = transferBurnEnabled ? Math.mulDiv(gross, TRANSFER_BURN_BPS, BPS_DENOMINATOR) : 0;
        received = gross - burned;
    }

    function _update(address from, address to, uint256 gross) internal override {
        // Mint and explicit burn are not address-to-address transfers. Calling
        // the base implementation also prevents recursively taxing the fee burn.
        if (from == address(0) || to == address(0) || !transferBurnEnabled) {
            super._update(from, to, gross);
            return;
        }
        // Check the gross amount even on self-transfers. A self-transfer only
        // decreases the final balance by its fee, but must still be funded.
        uint256 balance = balanceOf(from);
        if (balance < gross) revert ERC20InsufficientBalance(from, balance, gross);
        (uint256 received, uint256 burned) = previewTransfer(gross);
        if (burned != 0) {
            super._update(from, address(0), burned);
            totalTransferBurned += burned;
            emit TransferBurn(from, to, gross, burned);
        }
        super._update(from, to, received);
    }
}
