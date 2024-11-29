const { execSync } = require("child_process");
const path = require("path");

async function main() {
  // Export verifier
  const zkeyPath = path.join(
    __dirname,
    "../build/circuit/marketplace_final.zkey"
  );
  const verifierPath = path.join(
    __dirname,
    "../contracts/NFTMarketplaceVerifier.sol"
  );
  execSync(`snarkjs zkey export solidityverifier ${zkeyPath} ${verifierPath}`);

  // Compile contracts
  execSync("npx hardhat clean");
  execSync("npx hardhat compile");
}

main().catch(console.error);
