"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const tsnodePath = 'node ' + path.join(__dirname, '/../dist/tsnode/bin.js');
test('privates are removed', done => {
    let cmd = `${tsnodePath} --fast ${path.join(__dirname, '/subjects/TwoNames.ts')}`;
    shell.exec(cmd, { silent: true }, (code, stdout, stderr) => {
        expect(code).toBe(0);
        expect(stdout).toBe("undefined\n");
        expect(stderr).toBe('');
        done();
    });
});
test('privates are not removed', done => {
    let cmd = `${tsnodePath} --fast --no-visitors ${path.join(__dirname, '/subjects/TwoNames.ts')}`;
    shell.exec(cmd, { silent: true }, (code, stdout, stderr) => {
        expect(code).toBe(0);
        expect(stdout).toBe("John\n");
        expect(stderr).toBe('');
        done();
    });
});
test('simple rollup test', done => {
    let cmd = `../node_modules/.bin/rollup --config ./rollup.config.js`;
    shell.cd(__dirname);
    shell.exec(cmd, { silent: true }, (code, stdout, stderr) => {
        expect(code).toBe(0);
        expect(fs.existsSync(path.join(__dirname, '/output/TwoNamesBundle.js'))).toBeTruthy();
        expect(fs.existsSync(path.join(__dirname, '/output/TwoNamesBundle.js.map'))).toBeTruthy();
        expect(fs.readFileSync(path.join(__dirname, '/output/TwoNamesBundle.js'), 'utf8').includes('John')).toBeFalsy();
        shell.cd(__dirname + '/..');
        done();
    });
});
//# sourceMappingURL=tsos.test.js.map