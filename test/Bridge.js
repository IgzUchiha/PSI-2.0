// test/Bridge.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bridge", function () {
  let token, bridge;
  let owner, user;
  const INITIAL_SUPPLY = 1000000; // Raw number

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("PSIZK Token", "PSIZK", INITIAL_SUPPLY);
    
    const Bridge = await ethers.getContractFactory("L2Bridge");
    bridge = await Bridge.deploy(token.address);
    
    await token.initializeBridge(bridge.address);
  });

  describe("Deposit Functionality", () => {
    it("Should burn tokens on deposit", async () => {
      const amount = ethers.utils.parseUnits("1000", 18);
      const expectedSupply = ethers.utils.parseUnits("999000", 18);
      
      await token.connect(owner).transfer(user.address, amount);
      await token.connect(user).approve(bridge.address, amount);
      await bridge.connect(user).deposit(amount);

      expect(await token.totalSupply()).to.equal(expectedSupply);
    });
  });
});