"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Web3 = require("web3");
const client_1 = require("./client");
const compiler_1 = require("./compiler");
const state_1 = require("./state");
class Session {
    static create(provider, options) {
        return new Promise((resolve) => new Session(provider, options, resolve));
    }
    constructor(provider, options = {}, callback) {
        if (provider) {
            this.provider = provider;
        }
        else if (process.env.HELIOS_NODE_URL) {
            this.provider = new Web3.providers.HttpProvider(process.env.HELIOS_NODE_URL);
        }
        else {
            throw new Error('No provider supplied for the session');
        }
        this.client = new client_1.default(this.provider);
        this.state = new state_1.default(options.state);
        this.compiler = new compiler_1.default(options.compiler);
        this.compile = this.compiler.compile.bind(this.compiler);
        this.promise = Promise.all([
            this.client.getNetwork().then((networkId) => {
                this.networkId = networkId;
            }),
            this.client.getAccounts().then(([account]) => {
                this.client.setCurrentAccount(account);
            }),
        ]).then(() => {
            if (callback) {
                callback(this);
            }
        });
    }
    getState() {
        if (!this.networkId) {
            throw new Error('Cannot read state before networkId is set');
        }
        return this.state.getState(this.networkId);
    }
    setState(state) {
        if (!this.networkId) {
            throw new Error('Cannot write state before networkId is set');
        }
        this.state.setState(this.networkId, state);
    }
    snapshot() {
        return this.send('evm_snapshot').then(({ result }) => {
            return result;
        });
    }
    revert(snapshotId) {
        return this.send('evm_revert', snapshotId);
    }
    attachDebugger(callback) {
        if (!this.provider.manager.state.blockchain.vm) {
            throw new Error('VM not ready yet');
        }
        // TODO: Implement debuger
        this.provider.manager.state.blockchain.vm.on('step', callback);
    }
    send(method, ...params) {
        const payload = { method, jsonrpc: '2.0', id: new Date().getTime() };
        if (params.length > 0) {
            Object.assign(payload, { params });
        }
        return new Promise((resolve, reject) => {
            this.provider.send(payload, (err, res) => {
                if (!err) {
                    resolve(res);
                    return;
                }
                reject(err);
            });
        });
    }
}
exports.default = Session;
