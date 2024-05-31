const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString() , 'ether')
}

describe('Token', () => {
    let token , accounts, deployer
    
    beforeEach(async () => {
        // fetch Token from Blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Psichedelic', 'PSI' , '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0];
    })
    describe('Deployment' , () => {
     const name = 'Psichedelic'
     const symbol = 'PSI'
     const decimals = '18'
     const totalSupply = tokens('1000000')
    
    it('has correct name', async () => {
        //check it has correct name
        expect(await token.name()).to.equal(name)
    })
    it('has correct symbol', async () => {
      // check it has correct symbol
        expect(await token.symbol()).to.equal(symbol)
    })

    it('has correct decimals', async () => {
        // check it has correct decimals
          expect(await token.decimals()).to.equal(decimals)
    })

    it('has correct total supply', async () => {
        // check it has correct decimals
        
          expect(await token.totalSupply()).to.equal(totalSupply)
    })
    it('assigns total supply to deployer', async () => {
        // check it has correct decimals
        
          expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
    })

})

})