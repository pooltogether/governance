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
 

 const retroDistibutionTotalAmount = 1.5e24 // 1.5 million



 const allEmployees = {employeeA, employeeB, employeeC, employeeD, employeeL, employeeLi}
//  const employeePercentage =


  // only mint five minutes after deployment
  const mintAfter = parseInt(new Date().getTime() / 1000) + 300
  
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

  // wait until mintAfter has expired


  // deploy investor and employee Treasury contracts
  allEmployees.forEach((employee)=>{
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


  })



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

  
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, signers[0])

  dim(`Setting timelock...`)
  await governor.setTimelock(timelockResult.address)



  // wait for mint period to expire and then mint tokens for MerkleDistributor TODO with setTimeout()
  // mint tokens for merkleDistributor
  const deployerSigner =  signers[0]
  const defiSaver = await ethers.getContractAt('DefiSaver', defiSaverResult.address, deployerSigner)
  const mintTokensToMerkleDistributorResult = await defiSaver.mint(merkleDistributor, retroDistibutionTotalAmount)
  green(`Minted tokens to MerkleDistributor`)
  


  green(`Done!`)
};


function checkFlag() {
  if(flag == false) {
    setTimeout(checkFlag, 100); /* this checks the flag every 100 milliseconds*/
  } else {

  }
}
