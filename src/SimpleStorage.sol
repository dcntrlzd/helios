pragma solidity ^0.4.0;

contract MyToken {
  
}

contract SimpleStorage {
    uint storedData;

    function set(uint x) {
        storedData = x;
    }

    function get() constant returns (uint data) {
        return storedData;
    }
}

