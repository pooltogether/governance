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
  dim(`running delegate.js script`)
    const { getNamedAccounts } = hardhat
    const { MultiSig } = await getNamedAccounts()
    
    const gnosisSafe = await ethers.provider.getUncheckedSigner(MultiSig)
    const poolToken = await ethers.getContract("Pool", gnosisSafe)

    const gnosisSafeBalanceResult =  await poolToken.balanceOf(MultiSig)
    dim(`pool.balanceOf safe ${gnosisSafeBalanceResult}`)
  
    // delegate to oneself
    dim(`delegating to self MultiSig`)
    const delegationSelfTx = await poolToken.delegate(MultiSig)
    const delegateToSelfReceipt = await ethers.provider.getTransactionReceipt(delegationSelfTx.hash)
    const delegateToSelfResultEvents = delegateToSelfReceipt.logs.map(log => { try { return poolToken.interface.parseLog(log) } catch (e) { return null } })
    
    green(`Delegated from ${delegateToSelfResultEvents[0].args.fromDelegate} to ${delegateToSelfResultEvents[0].args.toDelegate}`)


    dim("moving forwards 1 year")
    await increaseTime(365 * 24 * 3600) // go 1 year forwards
    
  


}
run()


