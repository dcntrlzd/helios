import * as fs from 'fs';
import * as path from 'path';

import State from './state';

const STATE_PATH = path.resolve(__dirname, '../test/state.json');

afterEach(() => {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
});

it('can create a new state instance', () => {
  const state = new State({ path: STATE_PATH });
  expect(fs.readFileSync(STATE_PATH).toString()).toMatchSnapshot();
});

it('does not persists if no state path is given', () => {
  const state = new State({ path: false });
  expect(fs.existsSync(STATE_PATH)).toBe(false);
  state.setState(420, { version: 0 })
  expect(fs.existsSync(STATE_PATH)).toBe(false);
  expect(state.getState(420)).toMatchSnapshot();
});

it('can persist state modifications', async () => {
  const state = new State({ path: STATE_PATH });
  expect(fs.readFileSync(STATE_PATH).toString()).toMatchSnapshot();
  state.setState(420, { version: 0 });
  expect(fs.readFileSync(STATE_PATH).toString()).toMatchSnapshot();
  expect(state.getState(420)).toMatchSnapshot();
});

it('can preload a previously persisted state', () => {
  fs.writeFileSync(STATE_PATH, JSON.stringify({ 420: { version: 0 } }));
  const state = new State({ path: STATE_PATH });
  expect(state.getState(420)).toMatchSnapshot();
});
