import * as fs from 'fs';
import { provider, compiler } from '../runner';
import * as ethers from 'ethers';

const INITIAL_SUPPLY = 10000;
const DECIMALS = 2;
const ETH_TO_WEI = 1000000000000000000;

let accounts;
let tokenFactory: ethers.ContractFactory;
let exchangeFactory: ethers.ContractFactory;

beforeAll(async () => {
  accounts = await provider.listAccounts();

  const { HandsOnToken, ExchangeOffice } = await compiler.compileFile('./HandsOnToken.sol');
  const signer = provider.getSigner();

  tokenFactory = new ethers.ContractFactory(HandsOnToken.abi, HandsOnToken.data, signer);
  exchangeFactory = new ethers.ContractFactory(ExchangeOffice.abi, ExchangeOffice.data, signer);
})

describe('HandsOnToken', () => {
  it('Creates the token', async () => {
    const [account] = accounts;
    const contract = await tokenFactory.deploy(INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT');

    const value = await contract.functions.balanceOf(account);
    expect(Number(value)).toBe(Math.pow(10, DECIMALS) * INITIAL_SUPPLY);
  });
});

describe('ExchangeOffice', () => {
  it('Creates the contract and exchanges ETH for HOT', async () => {
    const [account, otherAccount] = accounts;

    const token = await tokenFactory.deploy(INITIAL_SUPPLY, 'HOT', DECIMALS, 'HOT');
    await token.deployed();

    const exchange = await exchangeFactory.deploy(1000, token.address);
    await exchange.deployed();

    // Transfer tokens to the exchange office
    const tx = await token.functions.transfer(exchange.address, 1000 * Math.pow(10, DECIMALS));
    const value = await token.functions.balanceOf(exchange.address);
    expect(Number(value)).toBe(Math.pow(10, DECIMALS) * 1000);

    // Run the exchange contract
    const otherSigner = provider.getSigner(otherAccount);
    const otherExchange = exchange.connect(otherSigner);
    await otherSigner.sendTransaction({ to: exchange.address, value: ethers.utils.parseEther('2.5'), gasLimit: 3141592 });

    const balanceOfContract = await provider.getBalance(exchange.address);
    const tokenBalanceOfTestAccount = await token.functions.balanceOf(otherAccount);
    const tokenBalanceOfContract = await token.functions.balanceOf(exchange.address);

    // Assert values
    expect(Number(tokenBalanceOfTestAccount)).toBe(2500);
    expect(Number(tokenBalanceOfContract)).toBe(97500);
    expect(Number(balanceOfContract)).toBe(2.5 * ETH_TO_WEI);
  });
});
