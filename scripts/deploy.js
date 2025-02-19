// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const IMAGE_URI = "https://green-defiant-crayfish-409.mypinata.cloud/ipfs/bafkreidfj3htoibxsdekmvwelv4g72y7vk4ffaomtgzl2wcab7q5xhpyqm";
async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Token
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy("Psichedelic", "PSI", "1000000", IMAGE_URI);
  await token.waitForDeployment();
  console.log("Token deployed to:", token.target);

  // Deploy Bridge
  const L2Bridge = await hre.ethers.getContractFactory("L2Bridge");
  const bridge = await L2Bridge.deploy(token.target);
  await bridge.waitForDeployment();
  console.log("Bridge deployed to:", bridge.target);

  // Initialize bridge in Token contract
  const initializeTx = await token.initializeBridge(bridge.target);
  await initializeTx.wait();
  console.log("Bridge initialized in Token contract");

  // Verification info
  console.log("\nDeployment completed successfully!");
  console.log("Token address:", token.target);
  console.log("Bridge address:", bridge.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});