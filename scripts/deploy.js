const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying contracts...");

  // Deploy Verifier
  const Verifier = await ethers.getContractFactory("NFTMarketplaceVerifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  // Deploy NFT Marketplace
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(verifier.address);
  await marketplace.deployed();
  console.log("NFTMarketplace deployed to:", marketplace.address);

  // Save deployment info
  const deploymentInfo = {
    verifier: verifier.address,
    marketplace: marketplace.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  const deployDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deployDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Verify contracts if on testnet/mainnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contracts...");
    await hre.run("verify:verify", {
      address: verifier.address,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: marketplace.address,
      constructorArguments: [verifier.address],
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deploy: main };
