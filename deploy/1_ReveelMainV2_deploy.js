const hre = require("hardhat");

async function main() {

  const libraryAddress = "0xf0e3FB69B3F2c62476c882CEB9E084E37252663c";
  const feePercentage = 100000; //1%
  const platformWallet = "0xfd5D88F326f4F8C497E1AD1E218fCA38F12A3F0D";
  const trustedForwarderAddress = "0x0000000000000000000000000000000000000000";

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
