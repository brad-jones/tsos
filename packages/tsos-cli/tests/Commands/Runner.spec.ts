import { fs } from 'mz';
import * as execa from 'execa';
import * as ts from 'typescript';
import { Expect, Test, AsyncTest, SpyOn, Any, TeardownFixture, Timeout } from "alsatian";

export class TsOsCliRunnerCmdFixture
{
    @AsyncTest()
    @Timeout(5000)
    public async RunHelloWorld()
    {
        let result = await execa(`${__dirname}/../../dist/index.js`, ['runner', `${__dirname}/../ScriptsToRun/HelloWorld.ts`], { reject: false });
        Expect(result.code).toBe(0);
        Expect(result.failed).toBe(false);
        Expect(result.killed).toBe(false);
        Expect(result.timedOut).toBe(false);
        Expect(result.stdout).toBe('Hello World');
        Expect(result.stderr).toBeEmpty();
    }
}
