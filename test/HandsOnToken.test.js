const async = require('async');
const fs = require('fs');
const eth = require('../dist/runner');

const { default: Session } = require('../dist/session');

const { HandsOnToken, ExchangeOffice } = require('./HandsOnToken.sol');

const INITIAL_SUPPLY = 10000;
const DECIMALS = 2;
const ETH_TO_WEI = 1000000000000000000;

describe('HandsOnToken', () => {
  it('Creates the token', async () => {
    const { web3 } = eth.session;
    const [account] = await eth.sync(web3.eth, web3.eth.getAccounts)
    web3.eth.defaultAccount = account;

    const contract = await eth.deploy(HandsOnToken, {}, INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT');
    
    const value = await eth.sync(contract, contract.balanceOf, account);
    expect(value.toNumber()).toBe(Math.pow(10, DECIMALS) * INITIAL_SUPPLY);
  });
});

describe('ExchangeOffice', () => {
  it('Creates the contract and exchanges ETH for HOT', async () => {
    const { web3 } = eth.session;
    const accounts = await eth.sync(web3.eth, web3.eth.getAccounts)
    const [account, testAccount] = accounts;
    web3.eth.defaultAccount = account;

    const token = await eth.deploy(HandsOnToken, {}, INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT');

    const contract = await eth.deploy(ExchangeOffice, {}, 1000, token.address);
  
    // Transfer tokens to the exchange office
    await eth.sync(token, token.transfer, contract.address, 1000 * Math.pow(10, DECIMALS));
    const value = await eth.sync(token, token.balanceOf, contract.address);
    expect(value.toNumber()).toBe(Math.pow(10, DECIMALS) * 1000);

    // Run the exchange contract
    web3.eth.defaultAccount = testAccount;
    await eth.sync(web3.eth, web3.eth.sendTransaction, { to: contract.address, value: 2.5 * ETH_TO_WEI, gas: eth.session.DEPLOYMENT_GAS });
    const balanceOfContract= await eth.sync(web3.eth, web3.eth.getBalance, contract.address);
    const tokenBalanceOfTestAccount = await eth.sync(token, token.balanceOf, testAccount);
    const tokenBalanceOfContract = await eth.sync(token, token.balanceOf, contract.address);

    // Assert values
    expect(tokenBalanceOfTestAccount.toNumber()).toBe(2500);
    expect(tokenBalanceOfContract.toNumber()).toBe(97500);
    expect(balanceOfContract.toNumber()).toBe(2.5 * ETH_TO_WEI);
  });
});