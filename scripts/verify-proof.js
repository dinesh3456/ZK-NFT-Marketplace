const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function formatProof(proof) {
  return [
    [proof.pi_a[0], proof.pi_a[1]],
    [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    [proof.pi_c[0], proof.pi_c[1]],
  ];
}

async function main() {
  console.log("Setting up verifier...");
  const zkeyPath = path.join(
    __dirname,
    "../build/circuit/marketplace_final.zkey"
  );
  const verifierPath = path.join(
    __dirname,
    "../contracts/NFTMarketplaceVerifier.sol"
  );
  const verificationKeyPath = path.join(
    __dirname,
    "../build/verification_key/verification_key.json"
  );

  if (!fs.existsSync(verifierPath)) {
    execSync(
      `snarkjs zkey export solidityverifier ${zkeyPath} ${verifierPath}`
    );
    execSync("npx hardhat compile");
  }

  const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath));
  const inputs = {
    nftTokenId: "1",
    listingPrice: "1000000000000000000",
    currentOwner: "123456789",
    buyerBalance: "2000000000000000000",
    buyerAddress: "987654321",
    actualPrice: "1000000000000000000",
    timestamp: Math.floor(Date.now() / 1000),
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    path.join(__dirname, "../build/circuit/marketplace_js/marketplace.wasm"),
    zkeyPath
  );

  const verified = await snarkjs.groth16.verify(
    verificationKey,
    publicSignals,
    proof
  );
  console.log("snarkjs verification result:", verified);

  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  const formattedProof = await formatProof(proof);
  const result = await verifier.verifyProof(
    formattedProof[0],
    formattedProof[1],
    formattedProof[2],
    publicSignals,
    { gasLimit: 3000000 }
  );

  console.log("Verification result:", result);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
