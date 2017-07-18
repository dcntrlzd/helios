const eth = require('./runner');

let id;

beforeEach(async () => {
  id = await eth.session.snapshot();
});

afterEach(async () => {
  if (id) await eth.session.revert(id);
});
