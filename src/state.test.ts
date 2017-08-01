import * as path from 'path';
import * as fs from 'fs';

import State from './state';

const STATE_PATH = path.resolve(__dirname, '../state.json');

beforeEach(() => {
  try {
    fs.unlinkSync(STATE_PATH);
  } catch (e) {

  }
})

it('can create a new state instance', () => {
  const state = new State(STATE_PATH);
  expect(fs.readFileSync(STATE_PATH).toString()).toMatchSnapshot();
});

it('can persist state modifications',async () => {
  const state = new State(STATE_PATH);
  expect(fs.readFileSync(STATE_PATH).toString()).toMatchSnapshot();
  state.setState(420, { version: 0 });
  expect(fs.readFileSync(STATE_PATH).toString()).toMatchSnapshot();
  expect(state.getState(420)).toMatchSnapshot();
});

it('can preload a previously persisted state', () => {
  fs.writeFileSync(STATE_PATH, JSON.stringify({ 420: { hello: 'world' } }));
  const state = new State(STATE_PATH);
  expect(state.getState(420)).toMatchSnapshot();
});
