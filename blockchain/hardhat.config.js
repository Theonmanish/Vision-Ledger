require("@nomicfoundation/hardhat-toolbox");

/**
 * Hardhat configuration for the VisionLedgerVerifier contract.
 *
 * Network credentials are never hardcoded — they are read from the
 * environment (loaded from the repo-root/backend/.env shared file so
 * the Python backend and Hardhat share a single source of truth).
 */
const path = require("path");

// Best-effort .env loader so `npx hardhat run ... --network sepolia`
// works without an extra plugin. Falls back gracefully if dotenv is
// not installed.
try {
  require("dotenv").config({
    path: path.join(__dirname, "..", "backend", ".env"),
  });
} catch (_) {
  /* dotenv optional */
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    sepolia: (() => {
      const pk = process.env.PRIVATE_KEY;
      // Hardhat requires the key to carry a 0x prefix.
      const normalized = pk ? (pk.startsWith("0x") ? pk : "0x" + pk) : "";
      return {
        url: process.env.SEPOLIA_RPC_URL || "",
        accounts: normalized ? [normalized] : [],
      };
    })(),
    hardhat: {
      // Local in-process network used by `npx hardhat test`.
      chainId: 31337,
    },
  },
};
