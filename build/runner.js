"use strict";
var jasmine2 = require("jest-jasmine2");
var compiler_js_1 = require("./compiler.js");
module.exports = function runner(globalConfig, config, environment, runtime, testPath) {
    environment.global.compile = compiler_js_1.default;
    return jasmine2(globalConfig, config, environment, runtime, testPath);
};
