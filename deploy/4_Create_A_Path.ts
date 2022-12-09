import { BigNumberish, Event } from "ethers";
import { ethers as _ethers } from "hardhat";
import { ERC20TokenLookup, reveelMainLookup } from "./helpers/constants";

/**
 * deploys a complex RevenuePath from a ReveelMain with 5 digits after the decimal
 * - ***good for use on goerli with manual testing in a ui***
 * - swap out the ReveelMain for the appropriate address
 * - swap out the wallets for some you can test withdraws from
 */
async function main() {
  const ReveelMain = await _ethers.getContractFactory("ReveelMainV2");

  // 1. connect to the current ReveelMain
  const reveelMainAddress = reveelMainLookup();
  const reveelMain = await ReveelMain.attach(reveelMainAddress);

  // 2. setting your tier vars, read below for an explanation of each
  const {ETH, WETH, DAI, USDC} = ERC20TokenLookup();
  const tokenList = [ETH, WETH, DAI, USDC];
  const tierOneAddressList = ["0xD6d0c9fC8F1f6cbCa3472052df3678E5b29b2DcA", "0xa8fa3Dd927C938E137b91C3C46EbDF7CC0A86942"];
  const tierOneFeeDistribution = [5000000, 5000000]; // both wallets split the tier 50%

  const tierTwoAddressList = ["0xD6d0c9fC8F1f6cbCa3472052df3678E5b29b2DcA", "0xa8fa3Dd927C938E137b91C3C46EbDF7CC0A86942", "0xfd5D88F326f4F8C497E1AD1E218fCA38F12A3F0D"];
  const tierTwoFeeDistribution = [3300000, 3300000, 3400000]; // each wallet getting 33-34%

  const tierThreeAddressList = ["0xD6d0c9fC8F1f6cbCa3472052df3678E5b29b2DcA"];
  const tierThreeFeeDistribution = [10000000]; // one wallet getting 100%

  // 2.1 - compiling your address list. Each tier's address list should be in sub array
  const addressList = [tierOneAddressList, tierTwoAddressList, tierThreeAddressList];

  // 2.2 - compiling your distribution list. Each tier requires a distribution list sub array. 
  //     - Each distribution list array must be the same length as that tier's address list array
  //     - The elements in each distribution list array must sum to 10000
  const distList = [tierOneFeeDistribution, tierTwoFeeDistribution, tierThreeFeeDistribution];

  // 2.3 - compiling the tier limits. All tiers except the Final Tier require a tier limit.
  //     - the Final tier's limit is infinite by default & should not be included
  const limitSequence: BigNumberish[][] = [
    // tier 1 has 1 ETH limit, tier 2 has a 0.5 ETH limit, tier 3 is infinite (blank)
    [_ethers.utils.parseEther("1"), _ethers.utils.parseEther("0.5")],
    // tier 1 has 1 WETH limit, tier 2 has a 0.5 WETH limit, tier 3 is infinite (blank)
    [_ethers.utils.parseEther("1"), _ethers.utils.parseEther("0.5")],
    // tier 1 has a 10 DAI limit, tier 2 has a 1000 DAI limit, tier 3 is infinite (blank)
    [_ethers.utils.parseUnits("10", 18), _ethers.utils.parseUnits("1000", 18)],
    // tier 1 has a 10 USDC limit, tier 2 has a 1000 USDC limit, tier 3 is infinite (blank)
    [_ethers.utils.parseUnits("10", 6), _ethers.utils.parseUnits("1000", 6)]
  ];

  // 3 - Set your path name
  const pathName = "Super Successful Mega Path"

  // 4 - set your mutability
  const isImmutable = true

  // 5 - create your path & profit
  const tx = await reveelMain.createRevenuePath(
    addressList,
    distList,
    tokenList,
    limitSequence,
    pathName,
    isImmutable,
  )

  const receipt = await tx.wait();

  console.log("tx: ", tx.hash);
  const events = receipt.events as Event[];
  const pathCreatedEvents = events.filter((e) => e.event === "RevenuePathCreated");
  const address = pathCreatedEvents[0].args?.path
  console.log("pathAddress: ", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});