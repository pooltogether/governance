const hardhat = require('hardhat')
const chalk = require("chalk")

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

const { ethers } = hardhat

const merkleDistributorPath = (process.env.PathToMerkleDistributorRepo).toString() + "/merkle-distributor/deployments/fork/MerkleDistributor.json"
const merkleDistributor = require(merkleDistributorPath).address


async function run() {
  const { getNamedAccounts } = hardhat
  const { MultiSig } = await getNamedAccounts()

  const gnosisSafe = await ethers.provider.getUncheckedSigner(MultiSig)
  const poolToken = await ethers.getContract('Pool', gnosisSafe)
  dim(`Pool balance of gnosisSafe before disbursal ${await poolToken.balanceOf(MultiSig)}`)

  const treasuryVesting = (await ethers.getContract("TreasuryVesterForTreasury")).address


  dim(`Disbursing ${ethers.utils.parseEther('6000000')} to treasury contract at ${treasuryVesting}`)
  await poolToken.transfer(treasuryVesting, ethers.utils.parseEther('6000000'))

  dim(`Disbursing to merkle distributor to merkle distributor at ${merkleDistributor}`)
  await poolToken.transfer(merkleDistributor, ethers.utils.parseEther('1500000'))

  dim(`Pool balance of gnosisSafe after disbursal ${await poolToken.balanceOf(MultiSig)}`)  
  green("done")
}

run()


