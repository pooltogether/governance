const chalk = require('chalk');
const { getChainId } = require('hardhat');

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

module.exports = async (hardhat) => {
  const { getNamedAccounts, getNamedSigners, deployments, ethers } = hardhat
  const { deploy } = deployments
  const namedAccounts = await getNamedAccounts()
  const { deployer,
          employeeA,
          employeeB,
          employeeC,
          employeeD,
          employeeL,
          employeeLi,
          employeeJ
 } = await getNamedAccounts()
 
 
 
  const namedSigners = await ethers.getNamedSigners()
  const deployerSigner = namedSigners.deployer
  const allEmployees = {
    EmployeeA: "10000",
    EmployeeB: "400000",
    EmployeeC: "400000",
    EmployeeD: "10000",
    EmployeeL: "400000",
    EmployeeLi:"10000",
    EmployeeJ: "4200"
  }


  dim(`Deployer is ${deployer}`)
 
 // constants 
 const twoYearsInSeconds = 63072000
 
 
  // mintAfter sets when the governor contract can start minting
  const vestingStartTimeInSeconds = parseInt(new Date().getTime() / 1000)
  const twoYearsAfterDeployStartInSeconds = vestingStartTimeInSeconds + twoYearsInSeconds
  
  const poolTokenResult = await deploy('Pool', {
    args: [
      deployer,
      deployer, // minter
      twoYearsAfterDeployStartInSeconds
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
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
    skipIfAlreadyDeployed: true
  })
  green(`Deployed GovernorZero: ${governorResult.address}`)

  // deploy Timelock
  dim(`deploying Timelock`)
  const timelockResult = await deploy('Timelock', {
    contract: await getChainId() === 1 ? "Timelock" : "Nolock",
    args: [
      governorResult.address,
      await getChainId() === 1 ? 172800 : 1 // 2 days for mainnet
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed Timelock: ${timelockResult.address}`)

  
  dim(`Setting timelock...`)
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, deployerSigner)
  if(await governor.timelock() != timelockResult.address){
    await governor.setTimelock(timelockResult.address)
    green(`Timelock set to ${timelockResult.address}`)
  }

  // deploy investor and employee Treasury contracts
  const poolToken = await ethers.getContractAt('Pool', poolTokenResult.address, deployerSigner)

  // set POOL minter
  if(await poolToken.minter() != timelockResult.address){
    dim(`Setting timelock as POOL minter`)
    await poolToken.setMinter(timelockResult.address)
    green(`set POOL minter as ${timelockResult.address}`)
  }

  for(const employee in allEmployees) {
    const employeeAddress = namedAccounts[employee]
    const vestingAmount = allEmployees[employee]
    dim("deploying Treasury contract for : ", employee, "with ", vestingAmount, "tokens")
    const recentBlock = await ethers.provider.getBlock()
    dim(`got recent block timestamp: ${recentBlock.timestamp}`)
    const vestingStartTimeInSeconds = recentBlock.timestamp + 600 

    const treasuryResult = await deploy(`TreasuryVesterFor${namedAccounts[employee]}`, {
      contract: 'TreasuryVester',
      args: [
        poolTokenResult.address,
        employeeAddress,
        vestingAmount,
        vestingStartTimeInSeconds,
        vestingStartTimeInSeconds,
        twoYearsAfterDeployStartInSeconds
      ],
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    green(`Deployed TreasuryVesting for ${employee} at contract: ${treasuryResult.address}`)
  }
    
  green(`Done!`)
};
