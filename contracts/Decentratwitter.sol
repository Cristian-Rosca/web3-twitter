//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Decentratwitter is ERC721URIStorage {
    uint256 public tokenCount;
    uint256 public postCount;

    mapping(uint256 => Post) public posts;
    // address -> NFT id
    mapping(address => uint256) public profiles;

    struct Post {
        uint256 id; 
        string hash;
        uint256 tipAmount;
        address payable author;
    }
    constructor() ERC721("Decentratwitter", "DAPP") {}
}
