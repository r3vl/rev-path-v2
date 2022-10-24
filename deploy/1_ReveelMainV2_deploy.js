const hre = require("hardhat");

async function main() {

  const libraryAddress = "0x0176d0CB0BDD0740928255720C22e4D8bCd19120";
  const feePercentage = 100000; //1%
  const platformWallet = "0xcAa029e5ba2b233ce50467cf01Fc727b45925A23";
  const trustedForwarderAddress = "0xE041608922d06a4F26C0d4c27d8bCD01daf1f792";

  const ReveelMainV2 = await hre.ethers.getContractFactory("ReveelMainV2");
  const reveelMainV2 = await ReveelMainV2.deploy(libraryAddress, feePercentage, platformWallet,trustedForwarderAddress);

  await reveelMainV2.deployed();

  console.log(
    `Reveel main deployed to: ${reveelMainV2.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
