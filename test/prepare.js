beforeEach(() => {
  jest.setTimeout(60 * 5 * 1000);
});

// Ganache triggers max listener warning so we disable it here
require('events').EventEmitter.defaultMaxListeners = 50;