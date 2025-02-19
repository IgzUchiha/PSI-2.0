// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Token.sol";

contract L2Bridge is Ownable {
    Token public immutable l2Token;
    mapping(bytes32 => bool) public processedWithdrawals;

    event Deposited(address indexed user, uint256 amount);
    event WithdrawalCompleted(address indexed user, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        l2Token = Token(_token);
    }

  // contracts/L2Bridge.sol
function deposit(uint256 amount) external {
    require(
        l2Token.transferFrom(msg.sender, address(this), amount),
        "Transfer failed"
    );
    l2Token.bridgeBurn(address(this), amount);
    emit Deposited(msg.sender, amount);
}

    function completeWithdrawal(address recipient, uint256 amount) external onlyOwner {
        bytes32 withdrawalHash = keccak256(abi.encode(recipient, amount));
        require(processedWithdrawals[withdrawalHash], "Withdrawal not processed");
        
        l2Token.bridgeMint(recipient, amount);
        processedWithdrawals[withdrawalHash] = true;
        emit WithdrawalCompleted(recipient, amount);
    }

    function submitBatch(bytes32[] calldata withdrawalHashes) external onlyOwner {
        for (uint i = 0; i < withdrawalHashes.length; i++) {
            processedWithdrawals[withdrawalHashes[i]] = true;
        }
    }
}