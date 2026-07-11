const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Local in-process tests for VisionLedgerVerifier.
 * These run against the Hardhat default network (no gas spent).
 */
describe("VisionLedgerVerifier", function () {
  let contract;
  let verifier;
  const SAMPLE_HASH =
    "0x" + "ab".repeat(32); // bytes32 all-0xab

  beforeEach(async () => {
    [verifier] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("VisionLedgerVerifier");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("stores a verification hash and emits VerificationStored", async () => {
    const tx = await contract.storeVerification(SAMPLE_HASH);
    const receipt = await tx.wait();

    // Exactly one event, matching the expected shape.
    const events = receipt.logs.filter(
      (log) => log.fragment && log.fragment.name === "VerificationStored"
    );
    expect(events.length).to.equal(1);

    const evt = events[0];
    expect(evt.args.verificationHash).to.equal(SAMPLE_HASH);
    expect(evt.args.verifier).to.equal(await verifier.getAddress());
    expect(evt.args.timestamp).to.be.a("bigint");
    expect(evt.args.timestamp).to.be.greaterThan(0);
  });

  it("returns the block timestamp", async () => {
    const block = await ethers.provider.getBlock("latest");
    const tx = await contract.storeVerification(SAMPLE_HASH);
    const receipt = await tx.wait();
    const evt = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "VerificationStored"
    );
    // Emitted timestamp is within a few seconds of the pre-call block.
    expect(Number(evt.args.timestamp)).to.be.gte(Number(block.timestamp));
  });

  it("allows the same hash to be stored multiple times (idempotent writes)", async () => {
    await contract.storeVerification(SAMPLE_HASH);
    await expect(contract.storeVerification(SAMPLE_HASH)).to.not.be.reverted;
  });
});
