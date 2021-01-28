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
          employeeLi,
          investorMultisig
 } = await getNamedAccounts()
 
 
 
 const namedSigners = await ethers.getNamedSigners()
 const deployerSigner = namedSigners.deployer
  const allEmployees = {
    [employeeA]: "1990",
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

 const totalSupply = "10000000" // 10 million
 const retroDistibutionAmount = "1500000"
 const totalSupplyGWei = ethers.utils.parseEther(totalSupply)
 const retroDistibutionTotalAmount = totalSupplyGWei * 0.15 // 1.5 million
 
 const investorAmount = "1200000" // 1.2 million
 const twoYearsInSeconds = 63072000
 const mintDelayTimeInSeconds = twoYearsInSeconds // 2 years
 
 

  // mintAfter sets when the governor contract can start minting
  const deployStartTimeInSeconds =   parseInt(new Date().getTime() / 1000)
  const treasuryVestingPeriodInSeconds = deployStartTimeInSeconds + twoYearsInSeconds
  const mintAfter = deployStartTimeInSeconds + mintDelayTimeInSeconds
  
  const poolTokenResult = await deploy('Pool', {
    args: [
      deployer,
      deployer,
      mintAfter
    ],
    from: deployer,
    //skipIfAlreadyDeployed: true
  })
  green(`Deployed PoolToken token: ${poolTokenResult.address}`)

  
  // deploy GovernorAlpha
  dim(`deploying GovernorAlpha`)
  const governorResult = await deploy('GovernorAlpha', {
    contract: 'GovernorZero',
    args: [
      deployer,
      poolTokenResult.address
    ],
    from: deployer,
    //skipIfAlreadyDeployed: true
  })
  green(`Deployed GovernorZero: ${governorResult.address}`)

  // deploy Timelock
  dim(`deploying Timelock`)
  const timelockResult = await deploy('Timelock', {
    contract: 'Nolock',
    args: [
      governorResult.address,
      1 // 1 second delay
    ],
    from: deployer,
    //skipIfAlreadyDeployed: false
  })
  green(`Deployed Timelock: ${timelockResult.address}`)

  
  dim(`Setting timelock...`)
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, deployerSigner)
  await governor.setTimelock(timelockResult.address)
  
  // deploy investor and employee Treasury contracts
  const poolToken = await ethers.getContractAt('Pool', poolTokenResult.address, deployerSigner)

  for(const employee in allEmployees){
    
    const vestingAmount = allEmployees[employee]
    dim("deploying Treasury contract for : ", employee, "with ", vestingAmount, "tokens")

    const treasuryResult = await deploy('TreasuryVester', {
      args: [
        poolTokenResult.address,
        employee,
        vestingAmount,
        mintAfter,
        treasuryVestingPeriodInSeconds,
        treasuryVestingPeriodInSeconds + 1
      ],
      from: deployer,
      skipIfAlreadyDeployed: false
    })
    green(`Deployed TreasuryVesting for ${employee} at contract: ${treasuryResult.address}`)
    
    // now transfer to each Treasury contract
    dim(`Transfering allocated tokens to contract`)
    const mintToTreasuryResult = await poolToken.transferFrom(deployerSigner.address, treasuryResult.address, vestingAmount)
    green(`Transferred ${vestingAmount} to ${treasuryResult.address}`)
  }
    


  // send investor tokens to multisig
  dim(`Transferring tokens to investor multisig`)
  await poolToken.transferFrom(deployerSigner.address, investorMultisig, investorAmount)
  green(`Transferred ${investorAmount} tokens to InvestorMultisig `)

  // transfer tokens for merkleDistributor
  dim(`Transferring tokens to MerkleDistributor`)
  await poolToken.transferFrom(deployerSigner.address, merkleDistributor, retroDistibutionAmount)
  green(`Transferred ${retroDistibutionAmount} tokens to MerkleDistributor`)
  
  //transfer remainder of tokens to Timelock
  const tokensRemainingResult = await poolToken.balanceOf(deployerSigner.address)
  console.log("tokensRemainingResult is ", tokensRemainingResult) // in BN format
  const tokensRemaining = totalSupplyGWei - tokensRemainingResult
  await poolToken.transferFrom(deployerSigner.address, merkleDistributor, tokensRemaining)
  green(`Transferred ${tokensRemaining} to Timelock`)

  green(`Done!`)
};
