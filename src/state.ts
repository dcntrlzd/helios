import * as fs from 'fs';

export default class State {
  private state: Object;
  private statePath: string;

  constructor(statePath: string) {
    this.statePath = statePath;

    try {
      const rawState = fs.readFileSync(statePath);
      this.state = JSON.parse(rawState.toString());
    } catch (e) {
      this.state = {};
    }
    this.persist();
  }

  private persist() {
    fs.writeFileSync(this.statePath, JSON.stringify(this.state));
  }

  public getState(networkId: any): Object {
    return this.state[networkId.toString()] || {};
  }

  public setState(networkId: any, state: Object): void {
    const networkState = this.getState(networkId);
    this.state[networkId.toString()] = Object.assign(networkState, state);
    this.persist();
  }
}
