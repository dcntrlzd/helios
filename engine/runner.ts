const path = require('path');
const glob = require('glob');

const SRC_DIR = path.join(__dirname, '../src/');
const globPattern = path.join(SRC_DIR, '**/*.ts');

// options is optional
glob(globPattern, {}, (error, files) => {
  // cleanup the console first
  process.stdout.write('\033c');
  // handle errors
  if (error) return console.error(error);
  // report
  files.forEach(require);
});
