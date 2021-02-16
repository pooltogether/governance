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
    const poolToken = await ethers.getContract("Pool")
  
    const employeeLiAddress = (await ethers.getContract("TreasuryVesterForEmployeeLi")).address
    const employeeBAddress = (await ethers.getContract("TreasuryVesterForEmployeeB")).address

    // delegate to Lilly
    const delegationToLiliTx = await poolToken.delegate(employeeLiAddress)
    const delegateToLiliReceipt = await ethers.provider.getTransactionReceipt(delegationToLiliTx.hash)
    const delegateToLiliEvents = delegateToLiliReceipt.logs.map(log => { try { return poolToken.interface.parseLog(log) } catch (e) { return null } })

    green(`Delegated from ${delegateToLiliEvents[0].args.fromDelegate} to ${delegateToLiliEvents[0].args.toDelegate}`)

    // delegate to oneself
    dim(`delegating to self MultiSig`)
    const delegationSelfTx = await poolToken.delegate(MultiSig)
    const delegateToSelfReceipt = await ethers.provider.getTransactionReceipt(delegationSelfTx.hash)
    const delegateToSelfResultEvents = delegateToSelfReceipt.logs.map(log => { try { return poolToken.interface.parseLog(log) } catch (e) { return null } })
    
    green(`Delegated from ${delegateToSelfResultEvents[0].args.fromDelegate} to ${delegateToSelfResultEvents[0].args.toDelegate}`)


    dim("moving forwards 1 year")
    await increaseTime(365 * 24 * 3600) // go 1 year forwards
    
    //claim from employeeB's treasuryVesting 
    const employeeBTreasury = await ethers.getContractAt("TreasuryVester", employeeBAddress, gnosisSafe)
    await employeeBTreasury.claim() // transfers half of total to emplyeB aaddress

    dim(`delegating to self for employeeB'`)
    const employeeBAccount = await ethers.provider.getUncheckedSigner('0xa38445311cCd04a54183CDd347E793F4D548Df3F') // employeeBcontrolledaddress
    const employeeBPoolToken = await ethers.getContract("Pool", employeeBAccount)
    
    const empoloyeeBDelegateToGnosisSafeTx = await employeeBPoolToken.delegate(MultiSig) // deletgate to gnosis safe
    const gnosisSafeDelegateToGnosisSafeReceipt = await ethers.provider.getTransactionReceipt(empoloyeeBDelegateToGnosisSafeTx.hash)
    const employeeBDelegateToGnosisSafeEvents = gnosisSafeDelegateToGnosisSafeReceipt.logs.map(log => { try { return poolToken.interface.parseLog(log) } catch (e) { return null } })
    green(`Delegated from ${employeeBDelegateToGnosisSafeEvents[0].args.fromDelegate} to ${employeeBDelegateToGnosisSafeEvents[0].args.toDelegate}`)


}
run()


