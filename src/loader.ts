import * as solcWrapper from 'solc/wrapper';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as MemoryStream from 'memorystream';

const DATA_DIR = path.join(__dirname, '../data/');
const ENGINE_CACHE = {};

function getVersionList(callback) {
  console.log('Retrieving available version list...');

  const mem = new MemoryStream(null, { readable: false });
  https.get('https://ethereum.github.io/solc-bin/bin/list.json', function(response) {
    if (response.statusCode !== 200) {
      console.log('Error downloading file: ' + response.statusCode);
    }
    response.pipe(mem);
    response.on('end', function() {
      callback(mem.toString());
    });
  });
}

function downloadBinary(version, callback?: (filename: string) => void) {
  console.log('Downloading version', version);

  getVersionList(pkgRaw => {
    const pkg = JSON.parse(pkgRaw);
    const engineUrl = `https://ethereum.github.io/solc-bin/bin/${pkg.releases[version]}`;
    console.log(engineUrl);
    const filename = path.join(DATA_DIR, `${version}.js`);
    const file = fs.createWriteStream(filename);
    https.get(engineUrl, function(response) {
      if (response.statusCode !== 200) {
        console.log('Error downloading file: ' + response.statusCode);
      }
      response.pipe(file);
      file.on('finish', function() {
        file.close();
        callback && callback(filename);
      });
    });
  });
}

function ensureEngine(version) {
  return new Promise((resolve, reject) => {
    const filename = path.join(DATA_DIR, `${version}.js`);
    if (fs.existsSync(filename)) return resolve(filename);
    downloadBinary(version, resolve);
  });
}

export default function loader(version) {
  return new Promise((resolve, reject) => {
    if (ENGINE_CACHE[version]) {
      resolve(ENGINE_CACHE[version]);
    } else {
      ensureEngine(version)
        .then((enginePath: string) => {
          const engineBase = require(enginePath);
          ENGINE_CACHE[version] = solcWrapper(engineBase);
          resolve(ENGINE_CACHE[version]);
        })
        .catch(reject);
    }
  });
}
