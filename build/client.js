"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Web3 = require("web3");
class Client {
    constructor(provider) {
        this.METHOD_PATTERN = /^(get|is|send|sign|call)([A-Z].*)?$/;
        this.DEPLOYMENT_GAS = 3141592;
        this.DEPLOYMENT_GAS_PRICE = 100000000000;
        this.web3 = new Web3(provider);
        Object.keys(this.web3.eth).filter((methodName) => {
            return this.METHOD_PATTERN.test(methodName);
        }).forEach((methodName) => {
            const method = this.web3.eth[methodName];
            if (!method) {
                throw new Error(`${methodName} method not found in the supplied web3 client.`);
            }
            this[methodName] = this.promisify(method, this.web3.eth);
        });
    }
    isConnected() {
        return this.web3.isConnected();
    }
    getNetwork() {
        return this.promisify(this.web3.version.getNetwork, this.web3.version)();
    }
    getCurrentAccount() {
        return this.web3.eth.defaultAccount;
    }
    setCurrentAccount(account) {
        this.web3.eth.defaultAccount = account;
    }
    defineContract(compiledContract, address) {
        return new Promise((resolve, reject) => {
            const { abi, data } = compiledContract;
            const contract = this.web3.eth.contract(abi);
            resolve(this.promisifyContract(contract.at(address)));
        });
    }
    deployContract(compiledContract, options = {}) {
        const { from, args = [], gas = this.DEPLOYMENT_GAS, gasPrice = this.DEPLOYMENT_GAS_PRICE, } = options;
        return new Promise((resolve, reject) => {
            const { abi, data } = compiledContract;
            const contract = this.web3.eth.contract(abi);
            const deployOptions = { data, gas, gasPrice };
            if (from) {
                Object.assign(deployOptions, { from });
            }
            const deployArguments = [
                ...args,
                deployOptions,
                (err, res) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    else if (res.address) {
                        resolve(this.promisifyContract(res));
                        return;
                    }
                },
            ];
            contract.new(...deployArguments);
        });
    }
    promisifyContract(baseContract) {
        const contract = Object.assign({}, baseContract);
        contract.abi.forEach((abiItem) => {
            const { name } = abiItem;
            const method = contract[name];
            if (!method) {
                return;
            }
            contract[name] = this.promisify(method, contract);
        });
        return contract;
    }
    promisify(method, context) {
        const boundMethod = method.bind(context);
        return (...baseArgs) => new Promise((resolve, reject) => {
            const callback = (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            };
            boundMethod(...baseArgs.concat([callback]));
        });
    }
}
exports.default = Client;
