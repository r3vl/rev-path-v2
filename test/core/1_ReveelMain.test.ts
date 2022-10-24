import { ethers } from "hardhat";
import { expect } from "chai";
import { ReveelMainV2, ReveelMainV2__factory, RevenuePathV2, RevenuePathV2__factory } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { platform } from "os";

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
    it("can be constructed", async () => {
      library = await (new RevenuePathV2__factory(owner)).deploy();
      reveelMain = await (new ReveelMainV2__factory(owner)).deploy(
        library.address,
        platformFeePercentage,
        platformWallet.address,
        forwarder.address,
      );

      expect(await reveelMain.getLibraryAddress()).to.equal(library.address);
      expect(await reveelMain.getPlatformWallet()).to.equal(platformWallet.address);
      expect(await reveelMain.getPlatformFee()).to.equal(platformFeePercentage);
      expect(await reveelMain.getTrustedForwarder()).to.equal(forwarder.address);
    });
  });

});