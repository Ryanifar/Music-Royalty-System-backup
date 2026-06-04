const hre = require("hardhat");

async function main() {
  const MusicRoyalty = await hre.ethers.getContractFactory("MusicRoyalty");
  const musicRoyalty = await MusicRoyalty.deploy();

  await musicRoyalty.waitForDeployment();

  console.log("MusicRoyalty deployed to:", await musicRoyalty.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});