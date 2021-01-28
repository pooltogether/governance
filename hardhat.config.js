require("@nomiclabs/hardhat-waffle");
require('hardhat-deploy')
require('hardhat-deploy-ethers')

const networks = require('./hardhat.networks')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.5.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "istanbul"
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    EmployeeB: {
      default: "0xa38445311cCd04a54183CDd347E793F4D548Df3F",
    },
    EmployeeL: {
      default: "0xa5c3A513645A9a00cB561fED40438E9DFE0D6a69",
    },
    EmployeeD: {
      default: "0xe507F2d7dE97c783a60FeF9f1c4A4dade2b0a989",
    },
    EmployeeLi: {
      default: "0xEc0286a4B478ECd600d3D96E398157B4825C5a38",
    },
    EmployeeC: {
      default: "0x5Ff0F990137ED250c84C492a896cB3F980D0f6B9",
    },
    EmployeeA: {
      default: "0xB3152182472ba2E46B11C75440a72D087F0750B6",
    },
    EmployeeJ: {
      default: "0xC30756b3012b880AfcBF24BF239b72bBcA48636c",
    },
    MultiSig: {
      default : 0,
      1 : "0x029Aa20Dcc15c022b1b61D420aaCf7f179A9C73f"
    }
    
  },
  networks
};
