const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString() , 'ether')
}

describe('Token', () => {
   let token , accounts, deployer, receiver
    
    beforeEach(async () => {
        // fetch Token from Blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Psichedelic', 'PSI' , '1000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0];
        receiver = accounts[1];
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

describe('Sending Tokens', () => {
   let amount, transaction, result
    describe('Sucess', () => {
        beforeEach(async () => {
            amount = tokens(100)
            transaction = await token.connect(deployer).transfer(receiver.address, amount)
            result = await transaction.wait()
        })
    
        it('transfers token balances', async () => {
            expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
            expect(await token.balanceOf(receiver.address)).to.equal(amount)
            //Ensure that tokens were transfered (balance changed)
        })
    
        it('emits a Transfer event', async () => {
            const event = result.events[0]
            expect(event.event).to.equal('Transfer')
            
            const args = event.args
            expect(args.from).to.equal(deployer.address)
            expect(args.to).to.equal(receiver.address)
            expect(args.value).to.equal(amount)
        })  
    })
    
    describe('Failure', () => {
        it ('rejects insufficent balances', async () => {
            const invalidAmount = tokens(100000000)
            await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
        })
        it('rejects invalid recipent', async () => {
            const amount = tokens(100)
            await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
        })
    })

  })

})