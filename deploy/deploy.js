const chalk = require('chalk');
const { getChainId } = require('hardhat');

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

module.exports = async (hardhat) => {
  const { getNamedAccounts, deployments, ethers } = hardhat
  const { deploy } = deployments
  const namedAccounts = await getNamedAccounts()
  const { deployer, MultiSig } = await getNamedAccounts()
  const namedSigners = await ethers.getNamedSigners()
  const deployerSigner = namedSigners.deployer

  const allReceivingEntities = {
    EmployeeA: "10000",
    EmployeeB: "400000",
    EmployeeC: "400000",
    EmployeeD: "10000",
    EmployeeL: "400000",
    EmployeeLi:"10000",
    EmployeeJ: "4200",
    Treasury: "6000000"
  }

  dim(`Deployer is ${deployer}`)
  const isTestNet = await getChainId() == 1 ? false : true
  dim(`Is TestNet? ${isTestNet}`)

  // constants 
  const twoYearsInSeconds = 63072000
  const vestingStartTimeInSeconds = parseInt(new Date().getTime() / 1000)
  const twoYearsAfterDeployStartInSeconds = vestingStartTimeInSeconds + twoYearsInSeconds
  const twoDaysInSeconds = 172810
  
  // deploy Pool token
  dim(`deploying POOL token`)
  const poolTokenResult = await deploy('Pool', {
    args: [
      MultiSig, 
      deployer, // minter
      twoYearsAfterDeployStartInSeconds
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed PoolToken token: ${poolTokenResult.address}`)

  
  // deploy GovernorAlpha
  dim(`deploying GovernorAlpha`)
  const governanceContract = isTestNet? 'GovernorZero' : "GovernorAlpha"
  const governorResult = await deploy('GovernorAlpha', {
    contract: governanceContract,
    args: [
      deployer,
      poolTokenResult.address
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed ${governanceContract} : ${governorResult.address}`)

  // deploy Timelock
  
  const timelockContract = isTestNet? "Nolock" : "Timelock"
  dim(`deploying ${timelockContract}`)
  const timelockResult = await deploy('Timelock', {
    contract: timelockContract,
    args: [
      governorResult.address,
      isTestNet ? 1 : twoDaysInSeconds // 2 days for mainnet
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })
  green(`Deployed Timelock as ${timelockContract}: ${timelockResult.address}`)

  
  dim(`Setting timelock...`)
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, deployerSigner)
  if(await governor.timelock() != timelockResult.address){
    await governor.setTimelock(timelockResult.address)
    green(`Timelock set to ${timelockResult.address}`)
  }

  
  const poolToken = await ethers.getContractAt('Pool', poolTokenResult.address, deployerSigner)

  // set POOL minter to timelock
  if(await poolToken.minter() != timelockResult.address){
    dim(`Setting timelock as POOL minter`)
    await poolToken.setMinter(timelockResult.address)
    green(`set POOL minter as ${timelockResult.address}`)
  }
  
  // deploy employee Treasury contracts
  for(const entity in allReceivingEntities) {
    let entityAddress = namedAccounts[entity]
    if(entity == 'Treasury'){
      entityAddress = timelockResult.address
      console.log("setting entity address to ", entityAddress)
    }
    const vestingAmount = ethers.utils.parseEther(allReceivingEntities[entity])
    dim("deploying TreasuryVesting contract for : ", entity, "at address", entityAddress, "with ", vestingAmount, "tokens")
    const recentBlock = await ethers.provider.getBlock()
    dim(`got recent block timestamp: ${recentBlock.timestamp}`)
    const tenMinsInSeconds = 600
    const vestingStartTimeInSeconds = recentBlock.timestamp + tenMinsInSeconds 

    const treasuryResult = await deploy(`TreasuryVesterFor${entity}`, {
      contract: 'TreasuryVester',
      args: [
        poolTokenResult.address,
        entityAddress,
        vestingAmount,
        vestingStartTimeInSeconds,
        vestingStartTimeInSeconds,
        twoYearsAfterDeployStartInSeconds
      ],
      from: deployer,
      skipIfAlreadyDeployed: true
    })
    green(`Deployed TreasuryVesting for ${entity} at contract: ${treasuryResult.address}`)
  }


    
  green(`Done!`)
};
