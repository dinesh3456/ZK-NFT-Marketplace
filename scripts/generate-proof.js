const snarkjs = require("snarkjs");
const fs = require("fs");

async function generateProof(inputs) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    "circuits/marketplace_js/marketplace.wasm",
    "circuits/marketplace_final.zkey"
  );

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));

  const proofFormatted = await formatProofForContract(proof);
  console.log("\nProof (formatted for contract): ", proofFormatted);
  console.log("\nPublic Signals: ", publicSignals);

  return { proof, publicSignals, proofFormatted };
}

async function formatProofForContract(proof) {
  const rawCalldata = await snarkjs.groth16.exportSolidityCallData(proof);
  const JSONCalldata = JSON.parse(`[${rawCalldata}]`);
  return JSONCalldata;
}

// Example usage
async function main() {
  const inputs = {
    nftTokenId: "1",
    listingPrice: "1000000000000000000", // 1 ETH
    currentOwner: "123456789", // Example address as number
    buyerBalance: "2000000000000000000", // 2 ETH
    buyerAddress: "987654321", // Example address as number
    actualPrice: "1000000000000000000", // 1 ETH
    timestamp: Math.floor(Date.now() / 1000),
  };

  try {
    await generateProof(inputs);
  } catch (err) {
    console.error("Error generating proof:", err);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  generateProof,
  formatProofForContract,
};
