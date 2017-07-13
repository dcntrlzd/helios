const path = require('path');
const contract = path.join(__dirname, 'SimpleStorage.sol');

it('runs 1', () => {
  return compile(contract, '0.4.11').then(console.log)
});

it('runs 2', () => {
  
});

it('runs 3', () => {
  
});