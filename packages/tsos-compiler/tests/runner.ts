import { TestSet, TestRunner } from "alsatian";

(async () =>
{
    const testSet = TestSet.create();
    testSet.addTestsFromFiles('./**/*.spec.ts');

    const testRunner = new TestRunner();

    testRunner.outputStream
        .pipe(process.stdout);

    await testRunner.run(testSet);
})().catch(e =>
{
    console.error(e);
    process.exit(1);
});
