"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class State {
    constructor(options = {}) {
        const { path } = options;
        this.path = path;
        if (this.path) {
            try {
                const rawState = fs.readFileSync(path);
                this.state = JSON.parse(rawState.toString());
            }
            catch (e) {
                this.state = {};
            }
            this.persist();
        }
        else {
            this.state = {};
        }
    }
    getState(networkId) {
        return this.state[networkId.toString()] || {};
    }
    setState(networkId, state) {
        const networkState = this.getState(networkId);
        this.state[networkId.toString()] = Object.assign(networkState, state);
        this.persist();
    }
    persist() {
        if (this.path) {
            fs.writeFileSync(this.path, JSON.stringify(this.state));
        }
    }
}
exports.default = State;
