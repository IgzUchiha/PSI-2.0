const { ethers } = require("hardhat");
const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Token", () => {
  let token, accounts, deployer, receiver;

  beforeEach(async () => {
    // fetch Token from Blockchain
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Psichedelic", "PSI", "1000000");

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
    exchange = accounts[2];
    bridge = accounts[3];
  });

  describe("Deployment", () => {
    const name = "Psichedelic";
    const symbol = "PSI";
    const decimals = "18";
    const totalSupply = tokens("1000000");
    // const imageURI = "https://green-defiant-crayfish-409.mypinata.cloud/ipfs/bafkreidfj3htoibxsdekmvwelv4g72y7vk4ffaomtgzl2wcab7q5xhpyqm";
    it("has correct name", async () => {
      //check it has correct name
      expect(await token.name()).to.equal(name);
    });
    it("has correct symbol", async () => {
      // check it has correct symbol
      expect(await token.symbol()).to.equal(symbol);
    });
//      it('has correct image URI', async () => {
//     expect(await token.imageURI()).to.equal(imageURI);
//   });

    it("has correct decimals", async () => {
      // check it has correct decimals
      expect(await token.decimals()).to.equal(decimals);
    });

    it("has correct total supply", async () => {
      // check it has correct decimals

      expect(await token.totalSupply()).to.equal(totalSupply);
    });
    it("assigns total supply to deployer", async () => {
      // check it has correct decimals

      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
    });
  });

  describe("Sending Tokens", () => {
    let amount, transaction, result;
    describe("Sucess", () => {
      beforeEach(async () => {
        amount = tokens(100);
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        result = await transaction.wait();
      });

      it("transfers token balances", async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(amount);
        //Ensure that tokens were transfered (balance changed)
      });

      it("emits a Transfer event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Transfer");

        const args = event.args;
        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Failure", () => {
      it("rejects insufficent balances", async () => {
        const invalidAmount = tokens(100000000);
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.be.reverted;
      });
      it("rejects invalid recipent", async () => {
        const amount = tokens(100);
        await expect(
          token
            .connect(deployer)
            .transfer("0x0000000000000000000000000000000000000000", amount)
        ).to.be.reverted;
      });
    });
  });
  describe("Approving Tokens", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("allocates an allowance for delegated token spending", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(amount);
      });
      it("emits an Approval event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Approval");

        const args = event.args;
        expect(args.owner).to.equal(deployer.address);
        expect(args.spender).to.equal(exchange.address);
        expect(args.value).to.equal(amount);
      });
    });
    describe("Failure", () => {
      it("rejects invalid spenders", async () => {
        await expect(
          token
            .connect(deployer)
            .approve("0x0000000000000000000000000000000000000000", amount)
        ).to.be.reverted;
      });
    });
  });

  describe("Delegated Token Transfers", () => {
    let amount, transaction, result;
    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });
    describe("Success", () => {
      beforeEach(async () => {
        transaction = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount);
        result = await transaction.wait();
      });

      it("transfers token balances", async () => {
        expect(await token.balanceOf(deployer.address)).to.be.equal(
          ethers.utils.parseUnits("999900", "ether")
        );
        expect(await token.balanceOf(receiver.address)).to.be.equal(amount);
      });
      it("resets the allowance", async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.be.equal(0);
      });
      it("emits a Transfer event", async () => {
        const event = result.events[0];
        expect(event.event).to.equal("Transfer");

        const args = event.args;
        expect(args.from).to.equal(deployer.address);
        expect(args.to).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });

    describe("Bridge Functions", () => {
      let initialSupply;

      beforeEach(async () => {
        initialSupply = await token.totalSupply();
        await token.connect(deployer).initializeBridge(bridge.address);
      });

      it("initializes bridge correctly", async () => {
        expect(await token.bridge()).to.equal(bridge.address);
      });

      it("prevents re-initialization", async () => {
        await expect(
          token.connect(deployer).initializeBridge(bridge.address)
        ).to.be.revertedWith("Already initialized");
      });

      describe("bridgeMint", () => {
        it("mints tokens by bridge", async () => {
          const amount = tokens(100);
          await expect(
            token.connect(bridge).bridgeMint(receiver.address, amount)
          )
            .to.emit(token, "Transfer")
            .withArgs(ethers.constants.AddressZero, receiver.address, amount);

          expect(await token.balanceOf(receiver.address)).to.equal(amount);
          expect(await token.totalSupply()).to.equal(initialSupply.add(amount));
        });

        it("rejects unauthorized mint", async () => {
          const amount = tokens(100);
          await expect(
            token.connect(deployer).bridgeMint(receiver.address, amount)
          ).to.be.revertedWith("Unauthorized: Bridge only");
        });
      });

      describe("bridgeBurn", () => {
        it("burns tokens by bridge", async () => {
          const amount = tokens(100);
          await expect(
            token.connect(bridge).bridgeBurn(deployer.address, amount)
          )
            .to.emit(token, "Transfer")
            .withArgs(deployer.address, ethers.constants.AddressZero, amount);

          expect(await token.balanceOf(deployer.address)).to.equal(
            initialSupply.sub(amount)
          );
          expect(await token.totalSupply()).to.equal(initialSupply.sub(amount));
        });

        it("rejects unauthorized burn", async () => {
          const amount = tokens(100);
          await expect(
            token.connect(deployer).bridgeBurn(deployer.address, amount)
          ).to.be.revertedWith("Unauthorized: Bridge only");
        });

        it("rejects insufficient balance burn", async () => {
          const invalidAmount = initialSupply.add(1);
          await expect(
            token.connect(bridge).bridgeBurn(deployer.address, invalidAmount)
          ).to.be.revertedWith("Insufficient balance");
        });
      });

      // test/Token.js
      it("emits BridgeUpdated event", async () => {
        // Create new independent instance
        const NewToken = await ethers.getContractFactory("Token");
        const newToken = await NewToken.deploy("Test", "TST", 1000);

        // Deploy new bridge
        const NewBridge = await ethers.getContractFactory("L2Bridge");
        const newBridge = await NewBridge.deploy(newToken.address);

        // Initialize and check event
        const tx = await newToken.initializeBridge(newBridge.address);
        const receipt = await tx.wait();

        const event = receipt.events.find((e) => e.event === "BridgeUpdated");
        expect(event.args.newBridge).to.equal(newBridge.address);
      });
    });

    describe("Failure", async () => {
      //attempt to transfer too many tokens
      const invalidAmount = tokens(100000000);
      await expect(
        token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, invalidAmount)
      ).to.be.reverted;
    });
  });
});
