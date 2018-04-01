const fs = require('fs');
const { session, compiler } = require('../runner');

const INITIAL_SUPPLY = 10000;
const DECIMALS = 2;
const ETH_TO_WEI = 1000000000000000000;

describe('HandsOnToken', () => {
  it('Creates the token', async () => {
    const from = session.getCurrentAccount();
    const { HandsOnToken, ExchangeOffice } = await compiler.compileFile('./HandsOnToken.sol');
    const account = session.getCurrentAccount();

    const contract = await session.deployContract(HandsOnToken, {
      args: [INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT']
    });

    const value = await contract.methods.balanceOf(account).call();
    expect(Number(value)).toBe(Math.pow(10, DECIMALS) * INITIAL_SUPPLY);
  });
});

describe('ExchangeOffice', () => {
  it('Creates the contract and exchanges ETH for HOT', async () => {
    const { HandsOnToken, ExchangeOffice } = await compiler.compileFile('./HandsOnToken.sol');
    const { web3 } = session;
    const accounts = await web3.eth.getAccounts();

    const [account, testAccount] = accounts;
    session.setCurrentAccount(account);

    const token = await session.deployContract(HandsOnToken, {
      args: [INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT']
    });

    const contract = await session.deployContract(ExchangeOffice, {
      args: [1000, token.options.address]
    });

    // Transfer tokens to the exchange office
    await token.methods.transfer(contract.options.address, 1000 * Math.pow(10, DECIMALS)).send({ from: account });
    const value = await token.methods.balanceOf(contract.options.address).call();
    expect(Number(value)).toBe(Math.pow(10, DECIMALS) * 1000);

    // Run the exchange contract
    session.setCurrentAccount(testAccount);
    await web3.eth.sendTransaction({ to: contract.options.address, value: 2.5 * ETH_TO_WEI, gas: session.DEPLOYMENT_GAS });
    
    const balanceOfContract = await web3.eth.getBalance(contract.options.address);
    const tokenBalanceOfTestAccount = await token.methods.balanceOf(testAccount).call();
    const tokenBalanceOfContract = await token.methods.balanceOf(contract.options.address).call();

    // Assert values
    expect(Number(tokenBalanceOfTestAccount)).toBe(2500);
    expect(Number(tokenBalanceOfContract)).toBe(97500);
    expect(Number(balanceOfContract)).toBe(2.5 * ETH_TO_WEI);
  });
});
