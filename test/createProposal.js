const hardhat = require('hardhat')
const chalk = require("chalk")

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

const { ethers } = hardhat

const { increaseTime } = require('./helpers/increaseTime')

async function run() {
    const { getNamedAccounts } = hardhat
    const { MultiSig } = await getNamedAccounts()

    const gnosisSafe = await ethers.provider.getUncheckedSigner(MultiSig)
    const alphaGovernanceContract = await ethers.getContract("GovernorAlpha", gnosisSafe)
    const timelockContract = await ethers.getContract("Timelock", gnosisSafe)
    const timelockAddress = timelockContract.address
    const treasuryVestingContract = await ethers.getContract("TreasuryVesterForTreasury")
    const treasuryVestingAddress = treasuryVestingContract.address

    const pool = await ethers.getContract("Pool", gnosisSafe)
    const treasuryBalanceBeforeClaim = await pool.balanceOf(timelockAddress)
    green("Balance of timelock before proposal : ", treasuryBalanceBeforeClaim)


    // create a proposal to call claim() on Treasury Vestor
    const proposalAmount = await ethers.utils.parseEther("0")
    dim(`creating proposal with target ${treasuryVestingAddress} with amount ${proposalAmount}`)   
    const createProposalTx =   await alphaGovernanceContract.propose([treasuryVestingAddress], [proposalAmount], ["claim()"], [[]], "call claim on TreasuryVesting contract")
    dim(`parsing create proposal receipt`)
    const createProposalReceipt = await ethers.provider.getTransactionReceipt(createProposalTx.hash)
    const createProposalEvents = createProposalReceipt.logs.map(log => { try { return alphaGovernanceContract.interface.parseLog(log) } catch (e) { return null } })
    dim("created proposal with id ", createProposalEvents[0].args.id)
    dim("created proposal with startBlock ", createProposalEvents[0].args.startBlock)
    dim("created proposal with endBlock ", createProposalEvents[0].args.endBlock)
    const proposalId =  createProposalEvents[0].args.id

    // Now vote on proposal, get above threshold
    dim("proposal state: ",await alphaGovernanceContract.state(proposalId.toString()))
    dim("Current block number ", (await ethers.provider.getBlock()).number)
    await increaseTime(30) // go at least once block fowards
    dim("Going fowards in time to block number ", (await ethers.provider.getBlock()).number)
    dim("proposal state: ",await alphaGovernanceContract.state(proposalId.toString()))
    dim("casting vote for proposal")
    await alphaGovernanceContract.castVote(proposalId, true)
    const votingPeriod = await alphaGovernanceContract.votingPeriod()
    dim(`fast forwarding ${votingPeriod.toNumber()}} blocks`)

    // await (async function r(){
    for(let counter=0; counter < votingPeriod.toNumber();  counter++){
      await ethers.provider.send('evm_mine', [])
    }
    // })
    // r()

    
    console.log("proposal state: ",await alphaGovernanceContract.state(proposalId.toString()))

    const currentBlock = await ethers.provider.getBlock()
    dim("currentBlock Number is ", currentBlock.number)


    // Queue proposal
    const queueProposalResult = await alphaGovernanceContract.queue(proposalId.toString())
    const queueProposalReceipt = await ethers.provider.getTransactionReceipt(queueProposalResult.hash)

    const queueProposalEvents = queueProposalReceipt.logs.map(log => { try { return alphaGovernanceContract.interface.parseLog(log) } catch (e) { return timelockContract.interface.parseLog(log) } })

    const eta = queueProposalEvents[1].args.eta

    dim("blockTimestamp is ", (await ethers.provider.getBlock()).timestamp)
    dim("eta for proposal is ",eta.toString())


    // now execute transaction
    dim("moving forwards 173000 seconds") // which is timelock.delay()
    await increaseTime(173000)
    dim("blockTimestamp is ", (await ethers.provider.getBlock()).timestamp)
    dim("eta for proposal is ",eta.toString())
    dim("proposal status is ", await alphaGovernanceContract.state(proposalId.toString()))
    const executeProposalResult = await alphaGovernanceContract.execute(proposalId.toString())

    

    green(`Finished executing proposals`)
    const treasuryBalanceAfterClaim = await pool.balanceOf(timelockAddress)
    green("Balance of timelock after proposal : ", treasuryBalanceAfterClaim)




}
run()