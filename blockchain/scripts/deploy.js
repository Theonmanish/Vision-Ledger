/**
 * Deploys VisionLedgerVerifier to Ethereum Sepolia.
 *
 * Configuration is read exclusively from environment variables:
 *   SEPOLIA_RPC_URL  Alchemy/Infura HTTPS endpoint for Sepolia
 *   PRIVATE_KEY      Deployer wallet private key (with or without 0x)
 *
 * After a successful deployment the contract address is written to
 * `blockchain/.deployed.json` so the backend can pick it up without
 * hardcoding. The address is also echoed to stdout.
 *
 * Run with:  npx hardhat run scripts/deploy.js --network sepolia
 */
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is not set in the environment.");
  }
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set in the environment.");
  }

  // Normalize the private key and bind a signer directly to the
  // network provider. This avoids relying on Hardhat's account
  // auto-discovery, which can return a null address on some setups.
  const pk = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;
  const deployer = new ethers.Wallet(pk, ethers.provider);
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Deploying VisionLedgerVerifier to Sepolia...");
  console.log("   Deployer :", deployerAddress);
  console.log("   Balance  :", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 ETH. Fund it from a Sepolia faucet before deploying."
    );
  }

  const Factory = await ethers.getContractFactory(
    "VisionLedgerVerifier",
    deployer
  );
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log("");
  console.log("Deployment complete.");
  console.log("   Contract address     :", address);
  console.log("   Deployment tx hash   :", deployTx.hash);
  console.log("   Deployer (verifier)  :", deployerAddress);

  // Persist address + ABI for the backend to consume.
  const outDir = path.join(__dirname, "..");
  const artifact = await hre.artifacts.readArtifact("VisionLedgerVerifier");
  fs.writeFileSync(
    path.join(outDir, ".deployed.json"),
    JSON.stringify(
      {
        address,
        deploymentTxHash: deployTx.hash,
        deployer: deployerAddress,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        abi: artifact.abi,
      },
      null,
      2
    )
  );
  console.log("   Written              : blockchain/.deployed.json");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
