"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var solcWrapper = require("solc/wrapper");
var fs = require("fs");
var path = require("path");
var https = require("https");
var MemoryStream = require("memorystream");
var DATA_DIR = path.join(__dirname, '../data/');
var ENGINE_CACHE = {};
function getVersionList(callback) {
    console.log('Retrieving available version list...');
    var mem = new MemoryStream(null, { readable: false });
    https.get('https://ethereum.github.io/solc-bin/bin/list.json', function (response) {
        if (response.statusCode !== 200) {
            console.log('Error downloading file: ' + response.statusCode);
        }
        response.pipe(mem);
        response.on('end', function () {
            callback(mem.toString());
        });
    });
}
function downloadBinary(version, callback) {
    console.log('Downloading version', version);
    getVersionList(function (pkgRaw) {
        var pkg = JSON.parse(pkgRaw);
        var engineUrl = "https://ethereum.github.io/solc-bin/bin/" + pkg.releases[version];
        console.log(engineUrl);
        var filename = path.join(DATA_DIR, version + ".js");
        var file = fs.createWriteStream(filename);
        https.get(engineUrl, function (response) {
            if (response.statusCode !== 200) {
                console.log('Error downloading file: ' + response.statusCode);
            }
            response.pipe(file);
            file.on('finish', function () {
                file.close();
                callback && callback(filename);
            });
        });
    });
}
function ensureEngine(version) {
    return new Promise(function (resolve, reject) {
        var filename = path.join(DATA_DIR, version + ".js");
        if (fs.existsSync(filename))
            return resolve(filename);
        downloadBinary(version, resolve);
    });
}
function loader(version) {
    return new Promise(function (resolve, reject) {
        if (ENGINE_CACHE[version]) {
            resolve(ENGINE_CACHE[version]);
        }
        else {
            ensureEngine(version)
                .then(function (enginePath) {
                var engineBase = require(enginePath);
                ENGINE_CACHE[version] = solcWrapper(engineBase);
                resolve(ENGINE_CACHE[version]);
            })
                .catch(reject);
        }
    });
}
exports.default = loader;
