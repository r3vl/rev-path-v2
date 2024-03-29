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
    platformFeePercentage = 100000;

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

    await expect(revenuePath.addRevenueTiers(tier, distributionList)).to.be.revertedWithCustomError(
      revenuePath,
      "RevenuePathNotMutable",
    );
  });
});

describe("RevenuePathV2 - mutable", () => {

  beforeEach(async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
    platformFeePercentage = 100000;

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

  it("Did create RevenuePath", async () => {
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
    const receipt = await revenuePath.addRevenueTiers(tier, distributionList);
    await receipt.wait();
    expect(await revenuePath.getTotalRevenueTiers()).to.equal(existingTierCount.add(1));
  });

  it("should emit when adding tier to revenue path ", async () => {
    const tier = [[alex.address, bob.address, tracy.address, tirtha.address, kim.address]];
    const distributionList = [[2000000, 2000000, 2000000, 2000000, 2000000]];

    const receipt = await revenuePath.addRevenueTiers(tier, distributionList);
    await receipt.wait();
    await expect(receipt)
        .to.emit(revenuePath, "RevenueTierAdded")
        // .withArgs(tier, distributionList) // array matching issues: https://github.com/NomicFoundation/hardhat/issues/3080
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
    const receipt = await revenuePath.addRevenueTiers(tiers, distributionLists);
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

    await expect(revenuePath.addRevenueTiers(tier, distributionList)).to.be.revertedWithCustomError(
      revenuePath,
      "WalletAndDistrbutionCtMismatch",
    );
  });

  it("Reverts adding tiers if total tiers address list is not equal to total distributions list ", async () => {
    const tiers = [
      [bob.address, tracy.address, kim.address],
      [tirtha.address, kim.address],
    ];
    const distributionLists = [[26000, 44000, 30000]];

    await expect(revenuePath.addRevenueTiers(tiers, distributionLists)).to.be.revertedWithCustomError(
      revenuePath,
      "WalletAndDistrbutionCtMismatch",
    );
  });

  it("Reverts adding tiers if total share is not 100% ", async () => {
    const tier = [[alex.address, bob.address, tracy.address, tirtha.address]];
    const distributionList = [[2000000, 2000000, 2000000, 2000000]];

    await expect(revenuePath.addRevenueTiers(tier, distributionList)).to.be.revertedWithCustomError(
      revenuePath,
      "TotalShareNot100",
    );
  });
});

describe("RevenuePathV2 - single tier paths", () => {

  beforeEach(async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
    platformFeePercentage = 100000;

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
    await revenuePath.addRevenueTiers(tier, distributionList);

    expect(await revenuePath.getFeeRequirementStatus()).to.be.equal(true);
  });

  it("Should release monies on a Single Tier path", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);

    const pending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    expect(balance).to.equal(pending);
    await revenuePath.release(constants.AddressZero, bob.address);
    const newPending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    expect(newPending).to.be.lessThan(pending);
  });
});

describe("RevenuePath: Update paths & receive monies", function () {
  beforeEach(async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
    platformFeePercentage = 100000;

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

  it("Should calculate correct pendingDistribtution amount BEFORE release", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);

    const pending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    expect(balance).to.equal(pending);
  });

  it("Should calculate correct pendingDistribtution amount AFTER distribution", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);
    const token = constants.AddressZero;
    const pending = await revenuePath.getPendingDistributionAmount(token);
    expect(balance).to.equal(pending);

    await revenuePath.distributePendingTokens(constants.AddressZero);
    // await revenuePath.release(constants.AddressZero, bob.address);

    const totalAccounted = await revenuePath.getTotalTokenAccounted(token);
    expect(balance).to.equal(totalAccounted);
    expect(pending).to.equal(totalAccounted);

    const newPending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);

    expect(newPending).to.equal(0);
  });

  it("Should properly calculate correct distributions after back to back deposits", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("0.8"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);
    const token = constants.AddressZero;
    const pending = await revenuePath.getPendingDistributionAmount(token);
    expect(balance).to.equal(pending);

    await revenuePath.distributePendingTokens(constants.AddressZero);
    // await revenuePath.release(constants.AddressZero, bob.address);

    const totalAccounted = await revenuePath.getTotalTokenAccounted(token);
    expect(balance).to.equal(totalAccounted);
    expect(pending).to.equal(totalAccounted);

    const newPending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);

    expect(newPending).to.equal(0);

    // send moar
    const tx2 = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("0.1"),
    });
    await tx2.wait();

    const balance2 = await provider.getBalance(revenuePath.address);
    const pending2 = await revenuePath.getPendingDistributionAmount(token);
    expect(pending2.add(totalAccounted)).to.equal(balance2);

    await revenuePath.distributePendingTokens(constants.AddressZero);
    // // await revenuePath.release(constants.AddressZero, bob.address);

    const totalAccounted2 = await revenuePath.getTotalTokenAccounted(token);
    expect(balance2).to.equal(totalAccounted2);

    const newPending2 = await revenuePath.getPendingDistributionAmount(constants.AddressZero);

    expect(newPending2).to.equal(0);
  });

  it("Should not distribute the same tokens twice", async () => {
    // deposit one set of tokens
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);
    const token = constants.AddressZero;
    const pending = await revenuePath.getPendingDistributionAmount(token);
    expect(balance).to.equal(pending);

    // distribute the set of tokens
    await revenuePath.distributePendingTokens(constants.AddressZero);
    const newPending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);

    const totalAccounted = await revenuePath.getTotalTokenAccounted(token);
    expect(balance).to.equal(totalAccounted);
    expect(pending).to.equal(totalAccounted);
    // distribute again
    await revenuePath.distributePendingTokens(constants.AddressZero);
    const stillPending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);

    expect(newPending).to.equal(stillPending);
  });

  it("Should release the correct amount", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("0.8"),
    });
    await tx.wait();

    const bobBefore = await bob.getBalance();
    await revenuePath.release(constants.AddressZero, bob.address);
    const bobsReleases = await revenuePath.getTokenReleased(constants.AddressZero, bob.address);
    const bobAfter = await bob.getBalance();
    expect(bobBefore.add(bobsReleases)).to.equal(bobAfter);
  });

  it("Should emit DepositETH event", async () => {
    const value = ethers.utils.parseEther("0.8");
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value,
    });
    await tx.wait();

    await expect(tx)
        .to.emit(revenuePath, "DepositETH")
        .withArgs(owner.address, value)
  });

  it("Should revert if there is no ETH to release", async () => {
    await expect(revenuePath.release(simpleToken.address, bob.address)).to.revertedWithCustomError(
      revenuePath,
      "NoDuePayment",
    );
  });

  it.skip("Should calculate everything... this is for local testing only & is skipped", async () => {
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("0.9"),
    });
    await tx.wait();

    const balance = await provider.getBalance(revenuePath.address);
    const token = constants.AddressZero;
    const pending = await revenuePath.getPendingDistributionAmount(token);
    expect(balance).to.equal(pending);
    console.log("old", pending);

    // presentTier
    // const presentTier = currentTokenTier[token];
    const presentTier = await revenuePath.getCurrentTier(token);
    console.log("presentTier", presentTier);
    // currentTierDistribution
    // const currentTierDistribution = getTokenTierLimits[token][presentTier] - totalDistributed[token][presentTier];
    const currentTierLimit = await revenuePath.getTokenTierLimits(token, presentTier);
    const totalDistributedOnTier = await revenuePath.getTierDistributedAmount(token, presentTier);
    console.log("distributed...", currentTierLimit, totalDistributedOnTier);
    const currentTierDistribution = currentTierLimit.sub(totalDistributedOnTier);
    console.log("currentDistribution", currentTierDistribution);
    // feerequired
    const feeRequired = await revenuePath.getFeeRequirementStatus();
    console.log("feeRequired", feeRequired);
    // platformFee
    const platformFee = await revenuePath.getPlatformFee();
    const base = await revenuePath.BASE();
    console.log("platformFee", platformFee, base);

    // feeDeduction = ((currentTierDistribution * platformFee) / BASE);
    const feeDeduction = ((currentTierDistribution.mul(platformFee)).div(base));
    console.log("feeDeduction", feeDeduction);

    // feeAccumulated[token] += feeDeduction;
    const feeAccumulated = await revenuePath.getTotalFeeAccumulated(token);
    console.log("feeAccumulated", feeAccumulated);

    // currentTierDistribution -= feeDeduction;
    const currentDistributionAfterFee = currentTierDistribution.sub(feeDeduction);
    console.log("currentDistributionAfterFee", currentDistributionAfterFee);

    // address[] memory walletMembers = revenueTiers[presentTier].walletList;
    const walletMembers = await revenuePath.getRevenueTier(presentTier);
    const totalWallets = walletMembers.length;
    console.log("walletMembers", walletMembers, totalWallets);
    // uint256 totalWallets = walletMembers.length;

    // tokenWithdrawable[token][walletMembers[i]] +=
    //                 (currentTierDistribution * revenueProportion[presentTier][walletMembers[i]]) /
    //                 BASE;
    const tokenWithdrawable = await revenuePath.getWithdrawableToken(token, walletMembers[0]);
    console.log("tokenWithdrawable", tokenWithdrawable);

    // revenueProportion[presentTier][walletMembers[i]]
    const revenueProportion = await revenuePath.getRevenueProportion(token, walletMembers[0]);
    console.log("revenueProportion", revenueProportion);

    const userShare = currentDistributionAfterFee.mul(revenueProportion).div(base);
    console.log("userShare", userShare);
    const tokenWithdrawableAfter = tokenWithdrawable.add(userShare);
    console.log("tokenWithdrawableAfter", tokenWithdrawableAfter);

    const remainder = currentTierDistribution.sub(currentDistributionAfterFee).sub(feeDeduction);
    console.log("remainder", remainder);

    await revenuePath.distributePendingTokens(constants.AddressZero);
    // await revenuePath.release(constants.AddressZero, bob.address);

    const newPending = await revenuePath.getPendingDistributionAmount(constants.AddressZero);
    console.log("new", newPending);

    const totalAccounted = await revenuePath.getTotalTokenAccounted(token);
    console.log("totalAccounted", totalAccounted);

  });

  it("Update revenue tier for given tier number ", async () => {
    const tier = [bob.address, tracy.address, alex.address, kim.address];
    const distributionList = [2000000,3000000,2000000,3000000];

    const updateTx = await revenuePath.updateRevenueTiers([tier], [distributionList], [0]);
    await updateTx.wait();

    const updatedRevTier = await revenuePath.getRevenueTier(0);
    expect(updatedRevTier[0]).to.equal(tier[0]);
  });

  it("Should emit RevenueTierUpdated event when tier is updated", async () => {
    const tier = [owner.address];
    const distributionList = [10000000];
    const tierNumbers= [0];

    const updateTx = await revenuePath.updateRevenueTiers([tier], [distributionList], tierNumbers);
    await updateTx.wait();

    await expect(updateTx)
        .to.emit(revenuePath, "RevenueTierUpdated")
        // .withArgs(tierNumbers, [tier], [distributionList]) // array matching issues: https://github.com/NomicFoundation/hardhat/issues/3080
  });

  it("Should update limits for a given tier", async () => {
    const originalLimits = await revenuePath.getTokenTierLimits(constants.AddressZero, 0)

    const tier = 0;
    const tokenList = [constants.AddressZero];
    const newLimits = [ethers.utils.parseEther("11")];
    const updateTx = await revenuePath.updateLimits(tokenList, newLimits, tier);
    await updateTx.wait();

    const limits = await revenuePath.getTokenTierLimits(constants.AddressZero, 0)
    expect(limits).to.not.equal(originalLimits);
    expect(limits).to.equal(newLimits[0]);
  });

  it("Should emit TierLimitUpdated event when limit is updated", async () => {
    const tier = 0;
    const tokenList = [constants.AddressZero];
    const newLimits = [ethers.utils.parseEther("11")];
    const updateTx = await revenuePath.updateLimits(tokenList, newLimits, tier);
    await updateTx.wait();

    await expect(updateTx)
        .to.emit(revenuePath, "TierLimitUpdated")
        .withArgs(tier, tokenList, newLimits)
  });

  it("Reverts when final tier limit is attempted for update", async () => {
    const totalTiers:any = await revenuePath.getTotalRevenueTiers();
    

    await expect(revenuePath.updateLimits(
      [constants.AddressZero], 
      [ethers.utils.parseEther("11")], 
      totalTiers - 1)).to.revertedWithCustomError(
      revenuePath,
      "FinalTierLimitNotUpdatable",
    );
       
  });

  it("Allows tier limit updates after receiving tokens but before distribution", async () => {
    const originalLimits = await revenuePath.getTokenTierLimits(constants.AddressZero, 0)
    const tx = await owner.sendTransaction({
      to: revenuePath.address,
      value: ethers.utils.parseEther("1"),
    });
    await tx.wait();

    const newTierLimit = ethers.utils.parseEther("1.4");
    await revenuePath.updateLimits([constants.AddressZero], [newTierLimit], 0)
    const limits = await revenuePath.getTokenTierLimits(constants.AddressZero, 0)
    expect(limits).to.not.equal(originalLimits);
    expect(limits).to.equal(newTierLimit);
  });

  describe("RevenuePath: ERC20 Distribution", function () {
    beforeEach(async () => {
      [owner, alex, bob, tracy, kim, tirtha, platformWallet, platformWallet1, forwarder] = await ethers.getSigners();
      platformFeePercentage = 100000;

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

    it("ERC20 release is successful ", async () => {
      const prevBalance = await simpleToken.balanceOf(bob.address);
      const tx = await simpleToken.transfer(revenuePath.address, ethers.utils.parseEther("1000"));
      await tx.wait();

      const releaseFund = await revenuePath.release(simpleToken.address, bob.address);
      await releaseFund.wait();

      const contractReleased = await revenuePath.getTokenReleased(simpleToken.address, bob.address);
      const currBalance = await simpleToken.balanceOf(bob.address);
      expect(prevBalance.add(contractReleased)).to.be.equal(currBalance);
    });

    it("Reverts ERC20 release if there is no revenue ", async () => {
      const tx = await simpleToken.transfer(revenuePath.address, ethers.utils.parseEther("1000"));
      await tx.wait();

      const releaseFund = await revenuePath.release(simpleToken.address, bob.address);
      await releaseFund.wait();

      await expect(revenuePath.release(simpleToken.address, bob.address)).to.revertedWithCustomError(
        revenuePath,
        "NoDuePayment",
      );
    });
  });
});