import { ethers } from "hardhat";
import { expect } from "chai";
import { ReveelMainV2, ReveelMainV2__factory, RevenuePathV2, RevenuePathV2__factory } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { platform } from "os";
import { BigNumberish, constants, Event } from "ethers";

describe("ReveelMainV2", () => {
  let reveelMain: ReveelMainV2;
  let revenuePath: RevenuePathV2;
  let library: RevenuePathV2;

  let owner: SignerWithAddress;
  let alex: SignerWithAddress;
  let bob: SignerWithAddress;
  let tracy: SignerWithAddress;
  let kim: SignerWithAddress;
  let tirtha: SignerWithAddress;
  let platformWallet: SignerWithAddress;
  let forwarder: SignerWithAddress;

  let platformFeePercentage: number;

  before(async () => {
    [owner, alex, bob, tracy, kim, tirtha, platformWallet, forwarder] = await ethers.getSigners();
  
    // ReveelMainV2 = await ethers.getContractFactory("ReveelMainV2");
    // RevenuePathV2 = await ethers.getContractFactory("RevenuePathV2");
  
    platformFeePercentage = 100;
  });

  describe("constructor", () => {
    beforeEach(async () => {
      library = await (new RevenuePathV2__factory(owner)).deploy();
      reveelMain = await (new ReveelMainV2__factory(owner)).deploy(
        library.address,
        platformFeePercentage,
        platformWallet.address,
        forwarder.address,
      );
    });
    it("can be constructed", async () => {
      expect(await reveelMain.getLibraryAddress()).to.equal(library.address);
      expect(await reveelMain.getPlatformWallet()).to.equal(platformWallet.address);
      expect(await reveelMain.getPlatformFee()).to.equal(platformFeePercentage);
      expect(await reveelMain.getTrustedForwarder()).to.equal(forwarder.address);
    });

    // PLATFORM WALLET
    it("Sets new platform wallet", async () => {
      const newPlatformWallet = tirtha.address;
      await reveelMain.setPlatformWallet(newPlatformWallet);
      expect(await reveelMain.getPlatformWallet()).to.equal(newPlatformWallet);
      expect(await reveelMain.getPlatformWallet()).to.not.equal(bob.address);
    });
    it("Emits event for new platform wallet", async () => {
      const newPlatformWallet = tirtha.address;
      await expect(reveelMain.setPlatformWallet(newPlatformWallet))
        .to.emit(reveelMain, "UpdatedPlatformWallet")
        .withArgs(newPlatformWallet);
    });
    it("Reverts other than owner changing platform wallet", async () => {
      const newPlatformWallet = tirtha.address;
      const ownerAddress = await reveelMain.owner();
      expect(ownerAddress).not.to.equal(bob);
      await expect(reveelMain.connect(bob).setPlatformWallet(newPlatformWallet)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      expect(await reveelMain.owner()).to.equal(ownerAddress);
    });
    it("Reverts changing platform wallet address to zero", async () => {
      await expect(reveelMain.setPlatformWallet(constants.AddressZero)).to.be.revertedWithCustomError(
        reveelMain,
        "ZeroAddressProvided",
      );
    });

    // PLATFORM FEE
    it("Sets new platform fee", async () => {
      const newFee = 2000;
      await reveelMain.setPlatformFee(newFee);
      expect(await reveelMain.getPlatformFee()).to.equal(newFee);
      expect(await reveelMain.getPlatformFee()).to.not.equal(platformFeePercentage);
    });
    it("Emits event for new platform fee", async () => {
      const newFee = 2000;
      await expect(reveelMain.setPlatformFee(newFee)).to.emit(reveelMain, "UpdatedPlatformFee").withArgs(newFee);
    });
    it("Reverts other than owner changing platform fee", async () => {
      const newFee = 200;
      const ownerAddress = await reveelMain.owner();
      const existingFee = await reveelMain.getPlatformFee();
      expect(ownerAddress).not.to.equal(tracy);
      expect(existingFee).not.to.equal(newFee);
      await expect(reveelMain.connect(tracy).setPlatformFee(newFee)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      expect(await reveelMain.getPlatformFee()).to.equal(existingFee);
    });
  
    // LIBRARY ADDRESS
    it("Sets new library address", async () => {
      const newlibrary = await (new RevenuePathV2__factory(owner)).deploy();
      await reveelMain.setLibraryAddress(newlibrary.address)
      expect(await reveelMain.getLibraryAddress()).to.equal(newlibrary.address);
      expect(await reveelMain.getLibraryAddress()).to.not.equal(library.address);
    });
    it("Emits event for new library address", async () => {
      const newlibrary = await (new RevenuePathV2__factory(owner)).deploy();
      await expect(reveelMain.setLibraryAddress(newlibrary.address))
        .to.emit(reveelMain, "UpdatedLibraryAddress")
        .withArgs(newlibrary.address);
    });
    it("Reverts other than owner changing library address", async () => {
      const newlibrary = await (new RevenuePathV2__factory(owner)).deploy();
      const ownerAddress = await reveelMain.owner();
      const existingLibrary = await reveelMain.getLibraryAddress();
      expect(ownerAddress).not.to.equal(tirtha);
      expect(existingLibrary).not.to.equal(newlibrary.address);
      await expect(reveelMain.connect(tirtha).setLibraryAddress(newlibrary.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      expect(await reveelMain.getLibraryAddress()).to.equal(existingLibrary);
    });
    it("Reverts changing library address to zero", async () => {
      await expect(reveelMain.setLibraryAddress(constants.AddressZero)).to.be.revertedWithCustomError(
        reveelMain,
        "ZeroAddressProvided",
      );
    });
    
    it("Reverts main deployment with zero library address & platformwallet address", async () => {
      await expect((new ReveelMainV2__factory(owner)).deploy(
        constants.AddressZero,
        platformFeePercentage,
        constants.AddressZero,
        constants.AddressZero,
      )).to.be.revertedWithCustomError(
        reveelMain,
        "ZeroAddressProvided",
      );
    });
  
    it("can pause contract", async () => {
      expect(await reveelMain.paused()).to.be.equal(false);
      await reveelMain.toggleContractState();
      expect(await reveelMain.paused()).to.be.equal(true);
    });
    it("cannot createRevenuePath when paused", async () => {
      await reveelMain.toggleContractState();
      expect(await reveelMain.paused()).to.be.equal(true);
      const walletList = [[bob.address]];
      const distributionList = [[10000000]];
      const tokenList = [constants.AddressZero];
      const limitSequence: BigNumberish[][] = [[]];
      const name = "Sample";
      const isImmutable = true;
      await expect(reveelMain.createRevenuePath(
        walletList,
        distributionList,
        tokenList,
        limitSequence,
        name,
        isImmutable
      )).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("deploy revenuePaths", () => {
    beforeEach(async () => {
      library = await (new RevenuePathV2__factory(owner)).deploy();
      reveelMain = await (new ReveelMainV2__factory(owner)).deploy(
        library.address,
        platformFeePercentage,
        platformWallet.address,
        forwarder.address,
      );
    });
    it("can deploy a single tier RevenuePath", async () => {
      const walletList = [[bob.address]];
      const distributionList = [[10000000]];
      const tokenList = [constants.AddressZero];
      const limitSequence: BigNumberish[][] = [[]];
      const name = "Sample";
      const isImmutable = true;
      const revPath = await reveelMain.createRevenuePath(
        walletList,
        distributionList,
        tokenList,
        limitSequence,
        name,
        isImmutable
      )
      // get the deployed RevPath & check it
      const deployed = await revPath.wait();
      const events = deployed.events as Event[];
      const filteredEvents = events.filter((e) => e.event === "RevenuePathCreated");
      // console.log("events", filteredEvents);
      const deployedAddress = filteredEvents[0].args?.path;
      const deployedName = filteredEvents[0].args?.name;
      expect(deployedAddress).to.be.properAddress;
      expect(deployedName).to.equal(name);
      revenuePath = await RevenuePathV2__factory.connect(deployedAddress, owner);
      expect(deployedAddress).to.equal(revenuePath.address);
      expect(await revenuePath.getPlatformFee()).to.equal(platformFeePercentage);
      expect(await revenuePath.getImmutabilityStatus()).to.equal(isImmutable);
      expect(await revenuePath.getTotalRevenueTiers()).to.equal(1);
      expect(await revenuePath.getCurrentTier(constants.AddressZero)).to.equal(0);
    });

    it("can deploy a multi tier RevenuePath", async () => {
      const walletList = [[bob.address], [bob.address]];
      const distributionList = [[10000000], [10000000]];
      const tokenList = [constants.AddressZero];
      const limitSequence: BigNumberish[][] = [[ethers.utils.parseEther("1")], []];
      const name = "Sample";
      const isImmutable = true;
      const revPath = await reveelMain.createRevenuePath(
        walletList,
        distributionList,
        tokenList,
        limitSequence,
        name,
        isImmutable
      )

      // get the deployed RevPath & check it
      const deployed = await revPath.wait();
      const events = deployed.events as Event[];
      const filteredEvents = events.filter((e) => e.event === "RevenuePathCreated");
      // console.log("events", filteredEvents);
      const deployedAddress = filteredEvents[0].args?.path;
      const deployedName = filteredEvents[0].args?.name;
      expect(deployedAddress).to.be.properAddress;
      expect(deployedName).to.equal(name);
      revenuePath = await RevenuePathV2__factory.connect(deployedAddress, owner);
      expect(deployedAddress).to.equal(revenuePath.address);
      expect(await revenuePath.getPlatformFee()).to.equal(platformFeePercentage);
      expect(await revenuePath.getImmutabilityStatus()).to.equal(isImmutable);
      expect(await revenuePath.getTotalRevenueTiers()).to.equal(2);
      expect(await revenuePath.getCurrentTier(constants.AddressZero)).to.equal(0);
    });
  });

});