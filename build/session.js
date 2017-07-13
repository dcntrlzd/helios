"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TestRPC = require("ethereumjs-testrpc");
var Web3 = require("web3");
var Session = (function () {
    function Session(options) {
        this.provider = TestRPC.provider(options);
        this.web3 = new Web3();
        this.web3.setProvider(this.provider);
    }
    Session.prototype.onStep = function (callback) {
        if (!this.provider.manager.state.blockchain.vm)
            throw new Error('VM not ready yet');
        // HARDCORE DEBUGGER:
        this.provider.manager.state.blockchain.vm.on('step', callback);
    };
    Session.prototype.run = function (runner) {
        var _this = this;
        this.web3.eth.getAccounts(function (error, accounts) {
            if (error)
                throw error;
            var account = accounts[0];
            if (!account)
                throw new Error('No initial account found in blockchain');
            _this.web3.eth.defaultAccount = account;
            runner(_this.web3);
        });
    };
    return Session;
}());
exports.default = Session;
