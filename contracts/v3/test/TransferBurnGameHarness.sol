// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {NEARlyHumanV3} from "../NEARlyHumanV3.sol";

/// @dev Local integration only. Never deploy this artifact as a public game.
contract TransferBurnGameHarness is NEARlyHumanV3 {
    constructor(address verifier_,address relayer_,address signer_,address payable treasury_,uint256 price_)
        NEARlyHumanV3(verifier_,relayer_,signer_,treasury_,price_) {}
    function creditForTest(uint256 id,uint256 amount) external onlyOwner {
        ownerOf(id);purse[id]+=amount;totalAllocated+=amount;issued+=amount;token.mintVault(amount);
    }
}
