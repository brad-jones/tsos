"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=tsos.test.js.map