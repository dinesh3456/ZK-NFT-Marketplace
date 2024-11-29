// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTMarketplace is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _listingIds;
    
    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool active;
    }
    
    // Verifier contract interface
    IVerifier public verifier;
    
    mapping(uint256 => Listing) public listings;
    
    event Listed(uint256 listingId, address nftContract, uint256 tokenId, uint256 price);
    event Sale(uint256 listingId, address buyer, uint256 price);
    event ListingCancelled(uint256 listingId);
    
    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }
    
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        listings[listingId] = Listing(
            listingId,
            nftContract,
            tokenId,
            payable(msg.sender),
            price,
            true
        );
        
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        emit Listed(listingId, nftContract, tokenId, price);
    }
    
    function purchaseWithProof(
        uint256 listingId,
        bytes calldata proof,
        uint256[4] calldata inputs
    ) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");
        
        // Verify the zero-knowledge proof
        require(
            verifier.verifyProof(proof, inputs),
            "Invalid zero-knowledge proof"
        );
        
        listing.active = false;
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        listing.seller.transfer(msg.value);
        
        emit Sale(listingId, msg.sender, msg.value);
    }
    
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");
        
        listing.active = false;
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        emit ListingCancelled(listingId);
    }
}

interface IVerifier {
    function verifyProof(bytes calldata proof, uint256[4] calldata inputs) external view returns (bool);
}