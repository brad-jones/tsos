import { fs } from 'mz';
import * as execa from 'execa';
import * as ts from 'typescript';
import * as shell from 'shelljs';
import { Expect, Test, AsyncTest, SpyOn, Any, TeardownFixture, Timeout } from "alsatian";

export class TsOsCliBuildCmdFixture
{
    @AsyncTest()
    @Timeout(30000)
    public async BuildGoodProject()
    {
        let projectPath = `${__dirname}/../ProjectsToBuild/GoodProject`;
        let result = await execa
        (
            `${__dirname}/../../dist/index.js`,
            ['build', `${projectPath}/tsconfig.json`],
            { reject: false }
        );
        Expect(result.code).toBe(0);
        Expect(result.failed).toBe(false);
        Expect(result.killed).toBe(false);
        Expect(result.timedOut).toBe(false);
        Expect(result.stdout).toBeEmpty();
        Expect(result.stderr).toBeEmpty();
        Expect(await fs.exists(`${projectPath}/FooBar.d.ts`)).toBe(true);
        Expect(await fs.exists(`${projectPath}/FooBar.js`)).toBe(true);
        Expect(await fs.exists(`${projectPath}/FooBar.js.map`)).toBe(true);
        shell.rm('-f', `${projectPath}/*.d.ts`);
        shell.rm('-f', `${projectPath}/*.js`);
        shell.rm('-f', `${projectPath}/*.js.map`);
    }

    @AsyncTest()
    @Timeout(30000)
    public async BuildBadProject()
    {
        let projectPath = `${__dirname}/../ProjectsToBuild/BadProject`;
        let result = await execa
        (
            `${__dirname}/../../dist/index.js`,
            ['build', `${projectPath}/tsconfig.json`],
            { reject: false }
        );
        Expect(result.code).not.toBe(0);
        Expect(result.failed).toBe(true);
        Expect(result.killed).toBe(false);
        Expect(result.timedOut).toBe(false);
        Expect(result.stdout).toBeEmpty();
        Expect(result.stderr).not.toBeEmpty();
        Expect(await fs.exists(`${projectPath}/FooBar.d.ts`)).toBe(false);
        Expect(await fs.exists(`${projectPath}/FooBar.js`)).toBe(false);
        Expect(await fs.exists(`${projectPath}/FooBar.js.map`)).toBe(false);
    }

    @AsyncTest()
    @Timeout(30000)
    public async BuildWithTsOptions()
    {
        let projectPath = `${__dirname}/../ProjectsToBuild/BadProject`;
        let result = await execa
        (
            `${__dirname}/../../dist/index.js`,
            [
                'build', `${projectPath}/tsconfig.json`,
                '--ts-options', 'noEmitOnError=false'
            ],
            { reject: false }
        );
        Expect(result.code).not.toBe(0);
        Expect(result.failed).toBe(true);
        Expect(result.killed).toBe(false);
        Expect(result.timedOut).toBe(false);
        Expect(result.stdout).toBeEmpty();
        Expect(result.stderr).not.toBeEmpty();
        Expect(await fs.exists(`${projectPath}/FooBar.d.ts`)).toBe(true);
        Expect(await fs.exists(`${projectPath}/FooBar.js`)).toBe(true);
        Expect(await fs.exists(`${projectPath}/FooBar.js.map`)).toBe(true);
        shell.rm('-f', `${projectPath}/*.d.ts`);
        shell.rm('-f', `${projectPath}/*.js`);
        shell.rm('-f', `${projectPath}/*.js.map`);
    }

    @AsyncTest()
    @Timeout(30000)
    public async BuildWithAstVisitors()
    {
        let projectPath = `${__dirname}/../ProjectsToBuild/GoodProject`;
        let result = await execa
        (
            `${__dirname}/../../dist/index.js`,
            [
                'build', `${projectPath}/tsconfig.json`,
                '--ast-visitors', `${__dirname}/../../../tsos-visitors/src/visitors/*.ts`
            ],
            { reject: false }
        );
        Expect(result.code).toBe(0);
        Expect(result.failed).toBe(false);
        Expect(result.killed).toBe(false);
        Expect(result.timedOut).toBe(false);
        Expect(result.stdout).toBeEmpty();
        Expect(result.stderr).toBeEmpty();
        Expect(await fs.exists(`${projectPath}/FooBar.d.ts`)).toBe(true);
        Expect(await fs.exists(`${projectPath}/FooBar.js`)).toBe(true);
        Expect(await fs.exists(`${projectPath}/FooBar.js.map`)).toBe(true);
        Expect(await fs.readFile(`${projectPath}/FooBar.js`, 'utf8')).toContain('tsosReflectable.ClassDecorator');
        shell.rm('-f', `${projectPath}/*.d.ts`);
        shell.rm('-f', `${projectPath}/*.js`);
        shell.rm('-f', `${projectPath}/*.js.map`);
    }
}
