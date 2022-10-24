const hre = require("hardhat");

async function main() {

  const RevenuePathV2 = await hre.ethers.getContractFactory("RevenuePathV2");
  const revenuePathV2 = await RevenuePathV2.deploy();

  await revenuePathV2.deployed();

  console.log(
    `RevenuePath deployed to: ${revenuePathV2.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
