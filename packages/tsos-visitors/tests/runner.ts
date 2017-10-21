import { fs } from 'mz';
import * as shell from 'shelljs';
import tapSpec = require('tap-spec');
import tapXUnit = require('tap-xunit');
import { TestSet, TestRunner } from "alsatian";

(async () =>
{
    // Setup the alsatian test runner
    let testRunner = new TestRunner();
    let tapStream = testRunner.outputStream;
    let testSet = TestSet.create();
    testSet.addTestsFromFiles('./**/*.spec.ts');

    // Setup tap-xunit, this is what provides an
    // XML XUnit file that CircleCI consumes.
    let tapToXUnitConverter = tapXUnit();
    let reportDir = `${__dirname}/../../../test-results/tsos-visitors`;
    shell.mkdir('-p', reportDir);
    tapStream.pipe(tapToXUnitConverter).pipe(fs.createWriteStream(`${reportDir}/report.xml`));
    process.on('exit', (code) =>
    {
        if (code === 0 && tapToXUnitConverter.exitCode !== 0)
        {
            process.exit(tapToXUnitConverter.exitCode);
        }
    });

    // This will output a human readable report to the console.
    tapStream.pipe(tapSpec()).pipe(process.stdout);

    // Runs the tests
    await testRunner.run(testSet);
})()
.catch(e =>
{
    console.error(e);
    process.exit(1);
});
