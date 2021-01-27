const chalk = require('chalk')

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

module.exports = async (hardhat) => {
  const { getNamedAccounts, getNamedSigners, deployments, ethers } = hardhat
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
 
 
 
 const namedSigners = await ethers.getNamedSigners()
 const deployerSigner = namedSigners.deployer
  const allEmployees = {
    [employeeA]: 1990,
    [employeeB]: 200,
    [employeeC]: 200,
    [employeeD]:200,
    [employeeL]:200,
    [employeeLi]:200
  }
 for(const e in allEmployees){
   console.log(e)
   console.log(allEmployees[e])
 }
   dim(`Deployer is ${deployer}`)
 
 // constants

 const totalSupply = 10e24
 const retroDistibutionTotalAmount = totalSupply * 0.15 // 1.5 million
 const investorAmount = totalSupply * 0.12 // 1.2 million
 const twoYearsInSeconds = 63072000
 const mintDelayTimeInSeconds = twoYearsInSeconds // 2 years
 
 

  // mintAfter sets when the governor contract can start minting
  const deployStartTimeInSeconds =   parseInt(new Date().getTime() / 1000)
  const treasuryVestingPeriodInSeconds = deployStartTimeInSeconds + twoYearsInSeconds
  const mintAfter = deployStartTimeInSeconds + mintDelayTimeInSeconds
  
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
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, deployerSigner)
  await governor.setTimelock(timelockResult.address)
  
  // deploy investor and employee Treasury contracts
  const defiSaver = await ethers.getContractAt('DefiSaver', defiSaverResult.address, deployerSigner)

  for(const employee in allEmployees){
    
    const vestingAmount = allEmployees[employee]
    dim("deploying Treasury contract for : ", employee, "with ", vestingAmount, "tokens")

    const treasuryResult = await deploy('TreasuryVester', {
      args: [
        defiSaverResult.address,
        employee,
        vestingAmount,
        mintAfter,
        0,
        treasuryVestingPeriodInSeconds
      ],
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    green(`Deployed TreasuryVesting for ${employee} at contract: ${treasuryResult.address}`)
    
    // now transfer to each Treasury contract
    const mintToTreasuryResult = await defiSaver.transferFrom(deployerSigner.address, treasuryResult.address, vestingAmount)

  }
    
  // transfer tokens for merkleDistributor
  const mintTokensToMerkleDistributorResult = await defiSaver.transferFrom(deployerSigner.address, merkleDistributor, retroDistibutionTotalAmount)
  green(`Minted tokens to MerkleDistributor`, mintTokensToMerkleDistributorResult)

  // send investor tokens to multisig
  const mintTokensToInvestorMultisigResult = await defiSaver.transferFrom(deployerSigner.address, investorMultisig, investorAmount)
  green(`Minted tokens to InvestorMultisig `, mintTokensToInvestorMultisigResult)

  //transfer remainder of tokens to Timelock
  const tokensRemainingResult = await defiSaver.balanceOf(deployerSigner.address)
  console.log("tokensRemainingResult is ", tokensRemainingResult)
  // const transferTokensToTimelock = await defiSaver.transferFrom()
  green(`Done!`)
};
