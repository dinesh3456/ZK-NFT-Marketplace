const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

async function generateProof(inputs) {
  const wasmFile = path.join(
    __dirname,
    "../build/circuit/marketplace_js/marketplace.wasm"
  );
  const zkeyFile = path.join(
    __dirname,
    "../build/circuit/marketplace_final.zkey"
  );

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    wasmFile,
    zkeyFile
  );

  // Format proof for smart contract
  const calldata = await snarkjs.groth16.exportSolidityCallData(
    proof,
    publicSignals
  );
  const proofData = JSON.parse(`[${calldata}]`);

  return { proof, publicSignals, proofData };
}

async function main() {
  const inputs = {
    nftTokenId: "1",
    listingPrice: "1000000000000000000",
    currentOwner: "123456789",
    buyerBalance: "2000000000000000000",
    buyerAddress: "987654321",
    actualPrice: "1000000000000000000",
    timestamp: Math.floor(Date.now() / 1000),
  };

  console.log("Generating proof...");
  const { proof, publicSignals, proofData } = await generateProof(inputs);

  const outputPath = path.join(__dirname, "../build/proofs");
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputPath, "proof.json"),
    JSON.stringify(proof, null, 2)
  );
  fs.writeFileSync(
    path.join(outputPath, "public.json"),
    JSON.stringify(publicSignals, null, 2)
  );

  console.log("Proof generation completed!");
  console.log("Proof and public signals saved in build/proofs/");
  return { proof, publicSignals, proofData };
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateProof };
