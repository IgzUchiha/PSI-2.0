// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    // string public imageURI;
    uint256 public decimals = 18;
    uint256 public totalSupply;
    
    address public bridge;
    bool private initialized;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event BridgeUpdated(address indexed newBridge);

    modifier onlyBridge() {
        require(msg.sender == bridge, "Unauthorized: Bridge only");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalsupply
        // string memory _imageURI
    ) {
        name = _name;
        symbol = _symbol;
        // imageURI = _imageURI;
        totalSupply = _totalsupply * (10**decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function initializeBridge(address _bridge) external {
        require(!initialized, "Already initialized");
        require(_bridge != address(0), "Invalid bridge address");
        bridge = _bridge;
        initialized = true;
        emit BridgeUpdated(_bridge);
    }

   
    // Standard ERC-20 functions
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0), "Invalid spender");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool) {
        require(_value <= balanceOf[_from], "Insufficient balance");
        require(_value <= allowance[_from][msg.sender], "Allowance exceeded");
        allowance[_from][msg.sender] -= _value;
        _transfer(_from, _to, _value);
        return true;
    }

    // Bridge-specific functions
    function bridgeMint(address to, uint256 amount) external onlyBridge {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function bridgeBurn(address from, uint256 amount) external onlyBridge {
        require(balanceOf[from] >= amount, "Insufficient balance");
        totalSupply -= amount;
        balanceOf[from] -= amount;
        emit Transfer(from, address(0), amount);
    }

    // Internal transfer function
    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        require(_to != address(0), "Invalid recipient");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
    }

    // Additional view function
    function getChainId() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }
}