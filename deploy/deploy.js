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
  const { deployer } = await getNamedAccounts()

  dim(`Deployer is ${deployer}`)

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

  const signers = await ethers.getSigners()
  const governor = await ethers.getContractAt('GovernorAlpha', governorResult.address, signers[0])

  dim(`Setting timelock...`)
  await governor.setTimelock(timelockResult.address)

  green(`Done!`)
};
