import { ethers } from "hardhat";
import { expect } from "chai";
import { ReveelMainV2, ReveelMainV2__factory, RevenuePathV2, RevenuePathV2__factory, SimpleToken, SimpleToken__factory } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish, constants, Event } from "ethers";

// Path Members
let owner: SignerWithAddress;
let alex: SignerWithAddress;
let bob: SignerWithAddress;
let tracy: SignerWithAddress;
let kim: SignerWithAddress;
let tirtha: SignerWithAddress;
let forwarder: SignerWithAddress;

let platformWallet: SignerWithAddress;
let platformWallet1: SignerWithAddress;
let platformFeePercentage: number;

let isImmutable: boolean;
let reveelMain: ReveelMainV2;
let revenuePath: RevenuePathV2;
let library: RevenuePathV2;
let simpleToken: SimpleToken;
const provider = ethers.provider;

let deployedAddress: string;

function pathInitializerFixture() {
  const tierOneAddressList = [bob.address, tracy.address, alex.address, kim.address];
  const tierOneFeeDistribution = [2000000, 3000000, 3000000, 2000000];
  const tierOneLimit = ethers.utils.parseEther("0.8");

  const tierTwoAddressList = [tracy.address, kim.address, alex.address];
  const tierTwoFeeDistribution = [3300000, 3300000, 3400000];
  const tierTwoLimit = ethers.utils.parseEther("1.2");

  const tierThreeAddressList = [kim.address, bob.address];
  const tierThreeFeeDistribution = [5000000, 5000000];

  const tiers = [tierOneAddressList, tierTwoAddressList, tierThreeAddressList];
  const distributionLists = [tierOneFeeDistribution, tierTwoFeeDistribution, tierThreeFeeDistribution];
  const tokenList = [constants.AddressZero];
  const limitSequence: BigNumberish[][] = [[tierOneLimit, tierTwoLimit]];

  return { tiers, distributionLists, tokenList, limitSequence };
}

describe("RevenuePathV2 - immutable", () => {

  it("Reverts if adding tier to immutable RevenuePath ", async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
    platformFeePercentage = 100;

    library = await (new RevenuePathV2__factory(owner)).deploy();
    reveelMain = await (new ReveelMainV2__factory(owner)).deploy(
      library.address,
      platformFeePercentage,
      platformWallet.address,
      forwarder.address,
    );
    simpleToken = await (new SimpleToken__factory(owner)).deploy();

    const { tiers, distributionLists, tokenList, limitSequence } = pathInitializerFixture();
    isImmutable = true;
    const revPath = await reveelMain.createRevenuePath(
      tiers,
      distributionLists,
      tokenList,
      limitSequence,
      "Immutable Path",
      isImmutable,
    );
    await revPath.wait();
    // get the deployed RevPath & check it
    const deployed = await revPath.wait();
    const events = deployed.events as Event[];
    const filteredEvents = events.filter((e) => e.event === "RevenuePathCreated");
    deployedAddress = filteredEvents[0].args?.path;
    revenuePath = await RevenuePathV2__factory.connect(deployedAddress, owner);

    const tier = [[alex.address]];
    const distributionList = [[10000000]];

    await expect(revenuePath.addRevenueTier(tier, distributionList)).to.be.revertedWithCustomError(
      revenuePath,
      "RevenuePathNotMutable",
    );
  });
});

describe("RevenuePathV2 - mutable", () => {

  beforeEach(async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
    platformFeePercentage = 100;

    library = await (new RevenuePathV2__factory(owner)).deploy();
    reveelMain = await (new ReveelMainV2__factory(owner)).deploy(
      library.address,
      platformFeePercentage,
      platformWallet.address,
      forwarder.address,
    );
    simpleToken = await (new SimpleToken__factory(owner)).deploy();

    const { tiers, distributionLists, tokenList, limitSequence } = pathInitializerFixture();
    isImmutable = false;
    const revPath = await reveelMain.createRevenuePath(
      tiers,
      distributionLists,
      tokenList,
      limitSequence,
      "Mutable Path",
      isImmutable,
    );
    await revPath.wait();
    // get the deployed RevPath & check it
    const deployed = await revPath.wait();
    const events = deployed.events as Event[];
    const filteredEvents = events.filter((e) => e.event === "RevenuePathCreated");
    deployedAddress = filteredEvents[0].args?.path;
    revenuePath = await RevenuePathV2__factory.connect(deployedAddress, owner);
  });

  it("did create RevenuePath", async () => {
    const { tiers } = pathInitializerFixture();
    expect(await revenuePath.getImmutabilityStatus()).to.equal(isImmutable);
    expect(await revenuePath.getTotalRevenueTiers()).to.equal(tiers.length);
    expect(await revenuePath.getCurrentTier(constants.AddressZero)).to.equal(0);
  });

  it("Add 1 tier to existing revenue path ", async () => {
    const tier = [[alex.address, bob.address, tracy.address, tirtha.address, kim.address]];
    const distributionList = [[2000000, 2000000, 2000000, 2000000, 2000000]];
    // const previousTierLimit = [ethers.utils.parseEther("1.3")];

    const existingTierCount = await revenuePath.getTotalRevenueTiers();
    const receipt = await revenuePath.addRevenueTier(tier, distributionList);
    await receipt.wait();
    expect(await revenuePath.getTotalRevenueTiers()).to.equal(existingTierCount.add(1));
  });

  it("Add multiple tiers to existing revenue path ", async () => {
    const tiers = [
      [bob.address, tracy.address, kim.address],
      [tirtha.address, kim.address],
    ];
    const distributionLists = [
      [2600000, 4400000, 3000000],
      [5000000, 5000000],
    ];
    const existingTierCount = await revenuePath.getTotalRevenueTiers();
    const receipt = await revenuePath.addRevenueTier(tiers, distributionLists);
    await receipt.wait();
    const revisedTierCount = await revenuePath.getTotalRevenueTiers();
    expect(revisedTierCount).to.equal(existingTierCount.add(2));
    const finalTierWalletsArray = await revenuePath.getRevenueTier(revisedTierCount.sub(1));
    // expect wallets to match
    expect(finalTierWalletsArray[0]).to.equal(tiers[1][0]);
    expect(finalTierWalletsArray[1]).to.equal(tiers[1][1]);
  });

  it("Reverts adding tiers if tier address list is not equal to distribution list length ", async () => {
    const tier = [[alex.address, bob.address, tracy.address, tirtha.address]];
    const distributionList = [[2000000, 2000000, 2000000, 2000000, 2000000]];

    await expect(revenuePath.addRevenueTier(tier, distributionList)).to.be.revertedWithCustomError(
      revenuePath,
      "WalletAndDistrbtionCtMismatch",
    );
  });

  it("Reverts adding tiers if total tiers address list is not equal to total distributions list ", async () => {
    const tiers = [
      [bob.address, tracy.address, kim.address],
      [tirtha.address, kim.address],
    ];
    const distributionLists = [[26000, 44000, 30000]];

    await expect(revenuePath.addRevenueTier(tiers, distributionLists)).to.be.revertedWithCustomError(
      revenuePath,
      "WalletAndDistrbtionCtMismatch",
    );
  });

  it("Reverts adding tiers if total share is not 100% ", async () => {
    const tier = [[alex.address, bob.address, tracy.address, tirtha.address]];
    const distributionList = [[2000000, 2000000, 2000000, 2000000]];

    await expect(revenuePath.addRevenueTier(tier, distributionList)).to.be.revertedWithCustomError(
      revenuePath,
      "TotalShareNot100",
    );
  });
});

describe("RevenuePathV2 - platform fee", () => {

  beforeEach(async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
    platformFeePercentage = 100;

    library = await (new RevenuePathV2__factory(owner)).deploy();
    reveelMain = await (new ReveelMainV2__factory(owner)).deploy(
      library.address,
      platformFeePercentage,
      platformWallet.address,
      forwarder.address,
    );
    simpleToken = await (new SimpleToken__factory(owner)).deploy();

    const { tiers, distributionLists, tokenList } = pathInitializerFixture();
    isImmutable = false;
    const revPath = await reveelMain.createRevenuePath(
      tiers.slice(0, 1),
      distributionLists.slice(0, 1),
      tokenList.slice(0, 1),
      [[]],
      "Mutable Path",
      isImmutable,
    );
    await revPath.wait();
    // get the deployed RevPath & check it
    const deployed = await revPath.wait();
    const events = deployed.events as Event[];
    const filteredEvents = events.filter((e) => e.event === "RevenuePathCreated");
    deployedAddress = filteredEvents[0].args?.path;
    revenuePath = await RevenuePathV2__factory.connect(deployedAddress, owner);
  });

  it("Fee is introduced if revenue path has greater than one tier ", async () => {
    const tier = [[alex.address, bob.address, tracy.address, tirtha.address]];
    const distributionList = [[2000000, 2000000, 3000000, 3000000]];

    expect(await revenuePath.getFeeRequirementStatus()).to.be.equal(false);
    await revenuePath.addRevenueTier(tier, distributionList);

    expect(await revenuePath.getFeeRequirementStatus()).to.be.equal(true);
  });
});

describe("RevenuePath: Update paths and receive monies", function () {
  beforeEach(async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
    platformFeePercentage = 100;

    library = await (new RevenuePathV2__factory(owner)).deploy();
    reveelMain = await (new ReveelMainV2__factory(owner)).deploy(
      library.address,
      platformFeePercentage,
      platformWallet.address,
      forwarder.address,
    );
    simpleToken = await (new SimpleToken__factory(owner)).deploy();

    const { tiers, distributionLists, tokenList, limitSequence } = pathInitializerFixture();
    isImmutable = false;
    const revPath = await reveelMain.createRevenuePath(
      tiers,
      distributionLists,
      tokenList,
      limitSequence,
      "Mutable Path",
      isImmutable,
    );
    await revPath.wait();
    // get the deployed RevPath & check it
    const deployed = await revPath.wait();
    const events = deployed.events as Event[];
    const filteredEvents = events.filter((e) => e.event === "RevenuePathCreated");
    deployedAddress = filteredEvents[0].args?.path;
    revenuePath = await RevenuePathV2__factory.connect(deployedAddress, owner);
  });

  it("should calculate correct pendingDistribtution amount BEFORE distribution", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);

    const pending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    expect(balance).to.equal(pending);
  });
  it("should calculate correct pendingDistribtution amount AFTER distribution", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);

    const pending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    expect(balance).to.equal(pending);
    await revenuePath.distrbutePendingTokens(constants.AddressZero);
    const newPending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    console.log("new", newPending);
  });

  it("Update revenue tier for given tier number ", async () => {
    const originalRevTier = await revenuePath.getRevenueTier(0);

    const tier = [owner.address];
    const distributionList = [10000000];

    const updateTx = await revenuePath.updateRevenueTier([tier], [distributionList], [0]);
    await updateTx.wait();

    const updatedRevTier = await revenuePath.getRevenueTier(0);
    expect(updatedRevTier[0]).to.equal(tier[0]);
  });

  it("should update limits for a given tier", async () => {
    const originalLimits = await revenuePath.tokenTierLimits(constants.AddressZero, 0)
    const updateTx = await revenuePath.updateLimits([constants.AddressZero], [ethers.utils.parseEther("11")], 0);
    await updateTx.wait();

    const limits = await revenuePath.tokenTierLimits(constants.AddressZero, 0)
    expect(limits).to.not.equal(originalLimits);
    expect(limits).to.equal(ethers.utils.parseEther("11"));
  });

  it("Allows tier limit updates after receiving tokens but before distribution", async () => {
    const originalLimits = await revenuePath.tokenTierLimits(constants.AddressZero, 0)
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);
    console.log("bal", balance);

    const pending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    console.log(pending);

    const newTierLimit = ethers.utils.parseEther("1.4");
    await revenuePath.updateLimits([constants.AddressZero], [newTierLimit], 0)
    const limits = await revenuePath.tokenTierLimits(constants.AddressZero, 0)
    expect(limits).to.not.equal(originalLimits);
    expect(limits).to.equal(newTierLimit);
  });

  // it("Reverts for tier number lesser than current tier during tier updates if distribution is already greater than new limit", async () => {
  //   const tx = await alex.sendTransaction({
  //     to: revenuePath.address,
  //     value: ethers.utils.parseEther("1"),
  //   });
  //   await tx.wait();
  //   await revenuePath.distrbutePendingTokens(constants.AddressZero);
  //   const newTierLimit = ethers.utils.parseEther("1.4");

  //   await expect(revenuePath.updateLimits([constants.AddressZero], [newTierLimit], 0)).to.be.revertedWithCustomError(
  //     revenuePath,
  //     "TokenLimitNotValid",
  //   );
  // });

  // it("Reverts for tier update if the updated limit amount is less than the amount already received for the tier ",
  //   async () => {
  //     const tx = await alex.sendTransaction({
  //       to: revenuePath.address,
  //       value: ethers.utils.parseEther("1.5"),
  //     });

  //     // Note: After eth transfer tier updated from 0 to 1
  //     //
  //     const tier = [alex.address, bob.address, tracy.address, tirtha.address];
  //     const distributionList = [2000, 2000, 3000, 3000];
  //     const newTierLimit = ethers.utils.parseEther("0.1");

  //     await expect(revenuePath.updateRevenueTier(tier, distributionList, newTierLimit, 1)).to.be.revertedWithCustomError(
  //       RevenuePath,
  //       "LimitLessThanTotalDistributed",
  //     );
  //   });

  //   it("Reverts for tier update if the updated limit is zero ",
  //   async () => {
  //     const tx = await alex.sendTransaction({
  //       to: revenuePath.address,
  //       value: ethers.utils.parseEther("1.5"),
  //     });

  //     // Note: After eth transfer tier updated from 0 to 1
  //     //
  //     const tier = [alex.address, bob.address, tracy.address, tirtha.address];
  //     const distributionList = [2000, 2000, 3000, 3000];
  //     const newTierLimit = ethers.utils.parseEther("0.1");

  //     await expect(revenuePath.updateRevenueTier(tier, distributionList, newTierLimit, 1)).to.be.revertedWithCustomError(
  //       RevenuePath,
  //       "LimitLessThanTotalDistributed",
  //     );
  //   });

  // it("Reverts tier update for tier number not added  ", async () => {
  //   const tier = [alex.address, bob.address, tracy.address, tirtha.address];
  //   const distributionList = [2000, 2000, 3000, 3000];
  //   const newTierLimit = ethers.utils.parseEther("1.4");

  //   await expect(revenuePath.updateRevenueTier(tier, distributionList, newTierLimit, 3)).to.be.revertedWithCustomError(
  //     RevenuePath,
  //     "IneligibileTierUpdate",
  //   );
  // });

  // it("Reverts for tier updates where distribution list and tier address list length are not equal ", async () => {
  //   const tx = await alex.sendTransaction({
  //     to: revenuePath.address,
  //     value: ethers.utils.parseEther("0.9"),
  //   });

  //   // Note: After eth transfer tier updated from 0 to 1
  //   //
  //   const tier = [alex.address, bob.address, tracy.address];
  //   const distributionList = [2000, 2000, 3000, 3000];
  //   const newTierLimit = ethers.utils.parseEther("1.4");

  //   await expect(revenuePath.updateRevenueTier(tier, distributionList, newTierLimit, 2)).to.be.revertedWithCustomError(
  //     RevenuePath,
  //     "WalletAndDistrbtionCtMismatch",
  //   );
  // });

  // it("Reverts for tier updates where distribution total is not 100% ", async () => {
  //   const tier = [alex.address, bob.address, tracy.address];
  //   const distributionList = [2000, 2000, 3000];
  //   const newTierLimit = ethers.utils.parseEther("1.4");

  //   await expect(revenuePath.updateRevenueTier(tier, distributionList, newTierLimit, 2)).to.be.revertedWithCustomError(
  //     RevenuePath,
  //     "TotalShareNot100",
  //   );
  // });

  // it("Reverts for erc20 tier update where distribution totalIs not 100% ", async () => {
  //   const tier = [alex.address, bob.address, tracy.address];
  //   const distributionList = [2000, 2000, 3000];

  //   await expect(revenuePath.updateErc20Distribution(tier, distributionList)).to.be.revertedWithCustomError(
  //     RevenuePath,
  //     "TotalShareNot100",
  //   );
  // });

  // it("Reverts for erc20 tier update where distribution list and tier address list length are not equal ", async () => {
  //   const tier = [alex.address, bob.address, tracy.address];
  //   const distributionList = [2000, 2000, 3000, 3000];

  //   await expect(revenuePath.updateErc20Distribution(tier, distributionList)).to.be.revertedWithCustomError(
  //     RevenuePath,
  //     "WalletAndDistrbtionCtMismatch",
  //   );
  // });
});