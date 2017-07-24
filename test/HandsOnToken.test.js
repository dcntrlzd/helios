const async = require('async');
const fs = require('fs');
const eth = require('../src/runner');

const { HandsOnToken, ExchangeOffice } = eth.compile('./HandsOnToken.sol');

const INITIAL_SUPPLY = 10000;
const DECIMALS = 2;
const ETH_TO_WEI = 1000000000000000000;

describe('HandsOnToken', () => {
  it('Creates the token', async () => {
    const [account] = await eth.client.getAccounts();
    eth.client.setCurrentAccount(account);

    const contract = await eth.client.deployContract(HandsOnToken, {
      args: [INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT']
    });

    const value = await contract.balanceOf(account);
    expect(value.toNumber()).toBe(Math.pow(10, DECIMALS) * INITIAL_SUPPLY);
  });
});

describe('ExchangeOffice', () => {
  it('Creates the contract and exchanges ETH for HOT', async () => {
    const accounts = await eth.client.getAccounts();

    const [account, testAccount] = accounts;
    eth.client.setCurrentAccount(account);

    const token = await eth.client.deployContract(HandsOnToken, {
      args: [INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT']
    });

    const contract = await eth.client.deployContract(ExchangeOffice, {
      args: [1000, token.address]
    });

    // Transfer tokens to the exchange office
    await token.transfer(contract.address, 1000 * Math.pow(10, DECIMALS));
    const value = await token.balanceOf(contract.address);
    expect(value.toNumber()).toBe(Math.pow(10, DECIMALS) * 1000);

    // Run the exchange contract
    eth.client.setCurrentAccount(testAccount);
    await eth.client.sendTransaction({ to: contract.address, value: 2.5 * ETH_TO_WEI, gas: eth.client.DEPLOYMENT_GAS });
    const balanceOfContract = await eth.client.getBalance(contract.address);
    const tokenBalanceOfTestAccount = await token.balanceOf(testAccount);
    const tokenBalanceOfContract = await token.balanceOf(contract.address);

    // Assert values
    expect(tokenBalanceOfTestAccount.toNumber()).toBe(2500);
    expect(tokenBalanceOfContract.toNumber()).toBe(97500);
    expect(balanceOfContract.toNumber()).toBe(2.5 * ETH_TO_WEI);
  });
});
