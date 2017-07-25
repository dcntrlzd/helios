pragma solidity ^0.4.8;

contract Owned {
    mapping (address => bool) public owners;

    function Owned() {
        owners[msg.sender] = true;
    }

    modifier onlyOwner {
        if (owners[msg.sender] != true) revert();
        _;
    }

    function addOwner(address ownerToAdd) onlyOwner {
        owners[ownerToAdd] = true;
    }

    function removeOwner(address ownerToRemove) onlyOwner {
        owners[ownerToRemove] = false;
    }
}
