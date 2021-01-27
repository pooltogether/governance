const chalk = require('chalk')

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

module.exports = async (hardhat) => {
  const { getNamedAccounts, deployments, ethers } = hardhat
  const { deploy } = deployments
  const { deployer,
          merkleDistributor,
          employeeA,
          employeeB,
          employeeC,
          employeeD,
          employeeL,
          employeeLi
 } = await getNamedAccounts()
 
 
 const signers = await ethers.getSigners()

 dim(`Deployer is ${deployer}`)
 
 // constants
 const retroDistibutionTotalAmount = 1.5e24 // 1.5 million
 const fiveMinsInSeconds = 300


 const allEmployees = {employeeA, employeeB, employeeC, employeeD, employeeL, employeeLi}
//  const employeePercentages =


  // only mint five minutes after deployment  
  const mintAfter = parseInt(new Date().getTime() / 1000) + fiveMinsInSeconds
  
  const defiSaverResult = await deploy('DefiSaver', {
    args: [
      deployer,
      deployer,
      mintAfter
    ],
    from: deployer,
    // skipIfAlreadyDeployed: true
  })
  green(`Deployed DefiSaver token: ${defiSaverResult.address}`)

  
  // deploy GovernorAlpha
  const governorResult = await deploy('GovernorAlpha', {
    contract: 'GovernorZero',
    args: [
      deployer,
      defiSaverResult.address
    ],
    from: deployer,
    // skipIfAlreadyDeployed: true
  })
  green(`Deployed GovernorZero: ${governorResult.address}`)

  // deploy Timelock
  const timelockResult = await deploy('Timelock', {
    contract: 'Nolock',
    args: [
      governorResult.address,
      1 // 1 second delay
    ],
    from: deployer,
    // skipIfAlreadyDeployed: true
  })
  green(`Deployed Timelock: ${timelockResult.address}`)

  
  dim(`Setting timelock...`)
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, signers[0])
  await governor.setTimelock(timelockResult.address)
  
  
  // wait until mintAfter has expired
  await new Promise(r => setTimeout(r, fiveMinsInSeconds));

  // deploy investor and employee Treasury contracts
  for(const employee of allEmployees){
    dim("deploying Treasury contract for : ", employeeA)
    const vestingAmount = 100 // todo populate from percentage array
    const twoYearsInSecondsUnix = mintAfter + 63072000 

    const treasuryResult = await deploy('TreasuryVester', {
    args: [
      desfiSaverResult.address,
      employee,
      vestingAmount,
      mintAfter,
      0,
      twoYearsInSecondsUnix
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
    })
    green(`Deployed TreasuryVesting for ${employee} at contract: ${treasuryResult.address}`)
    
    // now mint to each Treasury contract
    const defiSaver = await ethers.getContractAt('DefiSaver', defiSaverResult.address, deployerSigner)
    const mintToTreasuryResult = await defiSaver.mint(treasuryResult.address, retroDistibutionTotalAmount)

  }
    
  // mint tokens for merkleDistributor
  const deployerSigner =  signers[0]
  const defiSaver = await ethers.getContractAt('DefiSaver', defiSaverResult.address, deployerSigner)
  const mintTokensToMerkleDistributorResult = await defiSaver.mint(merkleDistributor, retroDistibutionTotalAmount)
  green(`Minted tokens to MerkleDistributor`)
  


  green(`Done!`)
};
