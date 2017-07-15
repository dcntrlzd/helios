const async = require('async');
const fs = require('fs');

const { default: Session } = require('../dist/session');

const { HandsOnToken, ExchangeOffice } = require('./HandsOnToken.sol');

const INITIAL_SUPPLY = 10000;
const DECIMALS = 2;
const ETH_TO_WEI = 1000000000000000000;

describe('HandsOnToken', () => {
  it('Creates the token', async () => {
    const { web3 } = new Session();
    const [account] = await eth.sync(web3.eth, web3.eth.getAccounts)
    web3.eth.defaultAccount = account;

    const { abi, data } = HandsOnToken;
    const gas = await eth.sync(web3.eth, web3.eth.estimateGas, { data });
    
    const ContractClass = web3.eth.contract(abi);
    const contract = await eth.deploy(ContractClass, INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT', { data, gas: gas * 2});
    
    const value = await eth.sync(contract, contract.balanceOf, account);
    expect(value.toNumber()).toBe(Math.pow(10, DECIMALS) * INITIAL_SUPPLY);
  });
});

describe('ExchangeOffice', () => {
  it('Creates the contract and exchanges ETH for HOT', async () => {
    const session = new Session();
    const { web3 } = session;
    const accounts = await eth.sync(web3.eth, web3.eth.getAccounts)
    const [account, testAccount] = accounts;
    web3.eth.defaultAccount = account;

    const { abi, data } = ExchangeOffice;
    // Huge gas for running test calls
    const gas = 3141592;
    
    const TokenClass = web3.eth.contract(HandsOnToken.abi);
    const token = await eth.deploy(TokenClass, INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT', { data: HandsOnToken.data, gas: gas });

    const ContractClass = web3.eth.contract(ExchangeOffice.abi);
    const contract = await eth.deploy(ContractClass, 1000, token.address, { data: ExchangeOffice.data, gas: gas });
  
    // Transfer tokens to the exchange office
    await eth.sync(token, token.transfer, contract.address, 1000 * Math.pow(10, DECIMALS));
    const value = await eth.sync(token, token.balanceOf, contract.address);
    expect(value.toNumber()).toBe(Math.pow(10, DECIMALS) * 1000);

    // Run the exchange contract
    web3.eth.defaultAccount = testAccount;
    await eth.sync(web3.eth, web3.eth.sendTransaction, { to: contract.address, value: 2.5 * ETH_TO_WEI, gas });
    const balanceOfContract= await eth.sync(web3.eth, web3.eth.getBalance, contract.address);
    const tokenBalanceOfTestAccount = await eth.sync(token, token.balanceOf, testAccount);
    const tokenBalanceOfContract = await eth.sync(token, token.balanceOf, contract.address);

    // Assert values
    expect(tokenBalanceOfTestAccount.toNumber()).toBe(2500);
    expect(tokenBalanceOfContract.toNumber()).toBe(97500);
    expect(balanceOfContract.toNumber()).toBe(2.5 * ETH_TO_WEI);
  });
});