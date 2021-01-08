const chalk = require("chalk")

function dim() {
  console.log(chalk.dim.call(chalk, ...arguments))
}

function green() {
  console.log(chalk.green.call(chalk, ...arguments))
}

module.exports = async (hardhat) => {
  const { getNamedAccounts, deployments } = hardhat
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  // only mint five minutes after deployment
  const mintAfter = parseInt(new Date().getTime() / 1000) + 300
  
  dim(`DefiSaver constructor args: `, [deployer, deployer, mintAfter])

  const defiSaverResult = await deploy("DefiSaver", {
    args: [
      deployer,
      deployer,
      mintAfter
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  })

  green(`Deployed DefiSaver token: ${defiSaverResult.address}`)
};
