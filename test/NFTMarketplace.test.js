const { expect } = require("chai");
const { ethers } = require("hardhat");
const { generateProof } = require("../scripts/generate-proof");

describe("NFTMarketplace", function () {
  let NFTMarketplace, marketplace, MockNFT, mockNFT;
  let Verifier, verifier;
  let owner, seller, buyer, addrs;

  before(async function () {
    // Deploy the verifier contract first
    Verifier = await ethers.getContractFactory("Verifier");
    verifier = await Verifier.deploy();
    await verifier.deployed();

    // Deploy the marketplace contract
    NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy(verifier.address);
    await marketplace.deployed();

    // Deploy a mock NFT contract for testing
    MockNFT = await ethers.getContractFactory("MockNFT");
    mockNFT = await MockNFT.deploy();
    await mockNFT.deployed();
  });

  beforeEach(async function () {
    [owner, seller, buyer, ...addrs] = await ethers.getSigners();

    // Mint a test NFT to seller
    await mockNFT.connect(seller).mint(1);
    // Approve marketplace to transfer NFT
    await mockNFT.connect(seller).approve(marketplace.address, 1);
  });

  describe("Listing Creation", function () {
    it("Should create a new listing", async function () {
      const price = ethers.utils.parseEther("1.0");

      await expect(
        marketplace.connect(seller).createListing(mockNFT.address, 1, price)
      )
        .to.emit(marketplace, "Listed")
        .withArgs(1, mockNFT.address, 1, price);

      const listing = await marketplace.listings(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
      expect(listing.active).to.be.true;
    });

    it("Should fail if price is zero", async function () {
      await expect(
        marketplace.connect(seller).createListing(mockNFT.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Purchase with ZK Proof", function () {
    let listingId, price;

    beforeEach(async function () {
      price = ethers.utils.parseEther("1.0");
      await marketplace
        .connect(seller)
        .createListing(mockNFT.address, 1, price);
      listingId = 1;
    });

    it("Should complete purchase with valid proof", async function () {
      const inputs = {
        nftTokenId: "1",
        listingPrice: price.toString(),
        currentOwner: seller.address,
        buyerBalance: ethers.utils.parseEther("2.0").toString(),
        buyerAddress: buyer.address,
        actualPrice: price.toString(),
        timestamp: Math.floor(Date.now() / 1000),
      };

      const { proof, publicSignals, proofFormatted } = await generateProof(
        inputs
      );

      await expect(
        marketplace
          .connect(buyer)
          .purchaseWithProof(listingId, proofFormatted[0], proofFormatted[1], {
            value: price,
          })
      )
        .to.emit(marketplace, "Sale")
        .withArgs(listingId, buyer.address, price);

      expect(await mockNFT.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should fail with invalid proof", async function () {
      const invalidProof = "0x1234";
      const invalidInputs = [0, 0, 0, 0];

      await expect(
        marketplace
          .connect(buyer)
          .purchaseWithProof(listingId, invalidProof, invalidInputs, {
            value: price,
          })
      ).to.be.revertedWith("Invalid zero-knowledge proof");
    });
  });

  describe("Listing Cancellation", function () {
    let listingId;

    beforeEach(async function () {
      const price = ethers.utils.parseEther("1.0");
      await marketplace
        .connect(seller)
        .createListing(mockNFT.address, 1, price);
      listingId = 1;
    });

    it("Should allow seller to cancel listing", async function () {
      await expect(marketplace.connect(seller).cancelListing(listingId))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(listingId);

      const listing = await marketplace.listings(listingId);
      expect(listing.active).to.be.false;
      expect(await mockNFT.ownerOf(1)).to.equal(seller.address);
    });

    it("Should not allow non-seller to cancel listing", async function () {
      await expect(
        marketplace.connect(buyer).cancelListing(listingId)
      ).to.be.revertedWith("Not the seller");
    });
  });
});
