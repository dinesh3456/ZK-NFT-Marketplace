const snarkjs = require("snarkjs");
const fs = require("fs");

async function verifyProof(proof, publicSignals) {
  const vKey = JSON.parse(fs.readFileSync("circuits/verification_key.json"));

  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  console.log("Verification result:", res);
  return res;
}

// Example usage
async function main() {
  // You would typically load these from files or receive them as parameters
  const proofPath = "proof.json";
  const publicSignalsPath = "public.json";

  try {
    const proof = JSON.parse(fs.readFileSync(proofPath));
    const publicSignals = JSON.parse(fs.readFileSync(publicSignalsPath));

    const isValid = await verifyProof(proof, publicSignals);
    console.log("Proof is valid:", isValid);
  } catch (err) {
    console.error("Error verifying proof:", err);
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
  verifyProof,
};
