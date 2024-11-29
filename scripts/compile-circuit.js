const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const download = require("download");

const circuitName = "marketplace";

async function main() {
  // Create build directories
  const buildDir = path.join(__dirname, "..", "build");
  const circuitDir = path.join(buildDir, "circuit");
  const provingKeyDir = path.join(buildDir, "proving_key");
  const verificationKeyDir = path.join(buildDir, "verification_key");

  [buildDir, circuitDir, provingKeyDir, verificationKeyDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Circuit compilation
  try {
    console.log("Compiling circuit...");
    execSync(
      `circom circuits/${circuitName}.circom --r1cs --wasm --sym --c --output ${circuitDir}`,
      {
        stdio: "inherit",
      }
    );

    // Download Powers of Tau file if needed
    const ptauPath = path.join(__dirname, "..", "pot12_final.ptau");
    if (!fs.existsSync(ptauPath)) {
      console.log("Downloading Powers of Tau file...");
      await download(
        "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau",
        path.dirname(ptauPath)
      );
      fs.renameSync(
        path.join(path.dirname(ptauPath), "powersOfTau28_hez_final_12.ptau"),
        ptauPath
      );
    }

    // Setup proving system
    console.log("Setting up proving system...");
    execSync(
      `snarkjs groth16 setup ${circuitDir}/${circuitName}.r1cs ${ptauPath} ${circuitDir}/${circuitName}_0.zkey`,
      {
        stdio: "inherit",
      }
    );

    execSync(
      `snarkjs zkey contribute ${circuitDir}/${circuitName}_0.zkey ${circuitDir}/${circuitName}_final.zkey --name="First contribution" -v`,
      { stdio: "inherit" }
    );

    // Export verification key
    execSync(
      `snarkjs zkey export verificationkey ${circuitDir}/${circuitName}_final.zkey ${verificationKeyDir}/verification_key.json`,
      { stdio: "inherit" }
    );

    // Generate Solidity verifier
    console.log("Generating Solidity verifier...");
    execSync(
      `snarkjs zkey export solidityverifier ${circuitDir}/${circuitName}_final.zkey contracts/NFTMarketplaceVerifier.sol`,
      { stdio: "inherit" }
    );

    console.log("Circuit compilation and setup completed successfully!");
  } catch (error) {
    console.error("Error during compilation:", error);
    process.exit(1);
  }
}

main().catch(console.error);
