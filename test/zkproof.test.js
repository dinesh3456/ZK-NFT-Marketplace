const { expect } = require("chai");
const path = require("path");
const { generateProof } = require("../scripts/generate-proof");
const { verifyProof } = require("../scripts/verify-proof");
const { ethers } = require("hardhat");

describe("ZK Proof Generation and Verification", function () {
  let validInputs;

  before(async function () {
    // Set up test inputs
    validInputs = {
      nftTokenId: "1",
      listingPrice: ethers.utils.parseEther("1.0").toString(),
      currentOwner: "123456789",
      buyerBalance: ethers.utils.parseEther("2.0").toString(),
      buyerAddress: "987654321",
      actualPrice: ethers.utils.parseEther("1.0").toString(),
      timestamp: Math.floor(Date.now() / 1000),
    };
  });

  it("should generate valid proof for correct inputs", async function () {
    const { proof, publicSignals } = await generateProof(validInputs);
    expect(proof).to.have.property("pi_a");
    expect(proof).to.have.property("pi_b");
    expect(proof).to.have.property("pi_c");
    expect(publicSignals).to.be.an("array");
  });

  it("should verify valid proof", async function () {
    const { proof, publicSignals } = await generateProof(validInputs);
    const isValid = await verifyProof(proof, publicSignals);
    expect(isValid).to.be.true;
  });

  it("should reject proof with modified public inputs", async function () {
    const { proof, publicSignals } = await generateProof(validInputs);
    const modifiedSignals = [...publicSignals];
    modifiedSignals[0] = "123456"; // Modify the first public input
    const isValid = await verifyProof(proof, modifiedSignals);
    expect(isValid).to.be.false;
  });

  it("should validate constraints for insufficient balance", async function () {
    const invalidInputs = {
      ...validInputs,
      buyerBalance: ethers.utils.parseEther("0.5").toString(), // Less than listing price
    };

    try {
      await generateProof(invalidInputs);
      expect.fail("Should have thrown error for insufficient balance");
    } catch (error) {
      expect(error.message).to.include("Constraint doesn't match");
    }
  });

  it("should validate constraints for price mismatch", async function () {
    const invalidInputs = {
      ...validInputs,
      actualPrice: ethers.utils.parseEther("1.5").toString(), // Different from listing price
    };

    try {
      await generateProof(invalidInputs);
      expect.fail("Should have thrown error for price mismatch");
    } catch (error) {
      expect(error.message).to.include("Constraint doesn't match");
    }
  });
});
