import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';

const tsnodePath = 'node ' + path.join(__dirname, '/../dist/tsnode/bin.js');

// consider swapping over to: https://github.com/avajs/ava

test('privates are removed', done =>
{
    let cmd = `${tsnodePath} --fast --visitors="tests/visitors/*.js" ${path.join(__dirname, '/subjects/TwoNames.ts')}`;
    shell.exec(cmd, {silent:true}, (code: number, stdout: string, stderr: string) =>
    {
        expect(code).toBe(0);
        expect(stdout).toBe("undefined\n");
        expect(stderr).toBe('');
        done();
    });
});

test('privates are not removed', done =>
{
    let cmd = `${tsnodePath} --fast --no-visitors ${path.join(__dirname, '/subjects/TwoNames.ts')}`;
    shell.exec(cmd, {silent:true}, (code: number, stdout: string, stderr: string) =>
    {
        expect(code).toBe(0);
        expect(stdout).toBe("John\n");
        expect(stderr).toBe('');
        done();
    });
});

test('simple rollup test', done =>
{
    let cmd = `../node_modules/.bin/rollup --config ./rollup.config.js`;
    shell.cd(__dirname);
    shell.exec(cmd, {silent:true}, (code: number, stdout: string, stderr: string) =>
    {
        expect(code).toBe(0);
        expect(fs.existsSync(path.join(__dirname, '/output/TwoNamesBundle.js'))).toBeTruthy();
        expect(fs.existsSync(path.join(__dirname, '/output/TwoNamesBundle.js.map'))).toBeTruthy();
        expect(fs.readFileSync(path.join(__dirname, '/output/TwoNamesBundle.js'), 'utf8').includes('John')).toBeFalsy();
        shell.cd(__dirname + '/..');
        done();
    });
});
