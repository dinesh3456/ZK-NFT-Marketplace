const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  // Deploy Verifier first
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  console.log("Deploying Verifier...");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  // Deploy NFTMarketplace
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  console.log("Deploying NFTMarketplace...");
  const marketplace = await NFTMarketplace.deploy(verifier.address);
  await marketplace.deployed();
  console.log("NFTMarketplace deployed to:", marketplace.address);

  // Save deployment addresses
  const deploymentInfo = {
    verifier: verifier.address,
    marketplace: marketplace.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);

  // Verify contracts on Etherscan if not on localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await verifier.deployTransaction.wait(6);
    await marketplace.deployTransaction.wait(6);

    console.log("Verifying contracts on Etherscan...");

    await hre.run("verify:verify", {
      address: verifier.address,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: marketplace.address,
      constructorArguments: [verifier.address],
    });
  }

  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
