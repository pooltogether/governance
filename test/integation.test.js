const hardhat = require('hardhat')
const { expect } = require("chai");
const { deployments, ethers } = hardhat
const { getContract, provider } = ethers

const toWei = ethers.utils.parseEther

describe('Integration test', async () => {

  let governor, timelock, pool

  let signers

  beforeEach(async () => {
    await deployments.fixture()

    signers = await ethers.getSigners()

    governor = await getContract('GovernorAlpha')
    timelock = await getContract('Timelock')
    pool = await getContract('Pool')

    await pool.delegate(signers[0].address)
  })

  it('should be possible to create and execute a proposal', async () => {
    await pool.transfer(timelock.address, toWei('1'))

    await governor.propose(
      [pool.address],
      [0],
      ['transfer(address,uint256)'],
      [ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [signers[1].address,toWei('1')])],
      "transfer value"
    )

    await governor.castVote(1, true)

    const votingPeriod = await governor.votingPeriod()
    for (let i = 0; i < votingPeriod; i++) {
      await provider.send('evm_mine')
    }

    await governor.queue(1)

    await governor.execute(1)

    expect(await pool.balanceOf(signers[1].address)).to.equal(toWei('1'))
  })

})