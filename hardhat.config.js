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
    merkleDistributor:{
      4: "0x0c6271c65DA3183A2e7a0914c840a6F0a04D050d"
    },
    employeeB :{
      1: "0xa38445311cCd04a54183CDd347E793F4D548Df3F",
      4: "0xa38445311cCd04a54183CDd347E793F4D548Df3F"
    },
    employeeL :{
      1: "0xa5c3A513645A9a00cB561fED40438E9DFE0D6a69",
      4: "0xa5c3A513645A9a00cB561fED40438E9DFE0D6a69"
    },
    employeeD:{
      1: "0xe507F2d7dE97c783a60FeF9f1c4A4dade2b0a989",
      4: "0xe507F2d7dE97c783a60FeF9f1c4A4dade2b0a989"
    },
    employeeLi:{
      1: "0xEc0286a4B478ECd600d3D96E398157B4825C5a38",
      4: "0xEc0286a4B478ECd600d3D96E398157B4825C5a38"
    },
    employeeC:{
      1: "0x5Ff0F990137ED250c84C492a896cB3F980D0f6B9",
      4: "0x5Ff0F990137ED250c84C492a896cB3F980D0f6B9"
    },
    employeeA:{
      1: "0xB3152182472ba2E46B11C75440a72D087F0750B6",
      4: "0xB3152182472ba2E46B11C75440a72D087F0750B6"
    }
    // investor1:{
    //   1: "0x",
    //   4: "0x"
    // }
    
  },
  networks
};
