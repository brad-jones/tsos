import { Expect, Test, AsyncTest, Timeout } from "alsatian";
import { AstVisitorFinder } from '@brad-jones/tsos-compiler';

export class AstVisitorFinderFixture
{
    @AsyncTest()
    public async FindByGlob()
    {
        let finder = new AstVisitorFinder();
        let result = await finder.FindByGlob([`${__dirname}/**/*.visitor.js`]);
        Expect(Array.isArray(result)).toBeTruthy();
        Expect(result.length).toBe(3);
        result.forEach(_ => Expect(typeof _).toEqual("function"));
    }

    @Test()
    public FindByGlobSync()
    {
        let finder = new AstVisitorFinder();
        let result = finder.FindByGlobSync([`${__dirname}/**/*.visitor.js`]);
        Expect(Array.isArray(result)).toBeTruthy();
        Expect(result.length).toBe(2);
        result.forEach(_ => Expect(typeof _).toEqual("function"));
    }

    @AsyncTest()
    public async FindFromTsConfig()
    {
        let finder = new AstVisitorFinder();
        let result = await finder.FindFromTsConfig(`${__dirname}/../../../../tsconfig.json`);
        Expect(Array.isArray(result)).toBeTruthy();
        Expect(result.length).toBe(1);
        result.forEach(_ => Expect(typeof _).toEqual("function"));
    }

    @Test()
    public FindFromTsConfigSync()
    {
        let finder = new AstVisitorFinder();
        let result = finder.FindFromTsConfigSync(`${__dirname}/../../../../tsconfig.json`);
        Expect(Array.isArray(result)).toBeTruthy();
        Expect(result.length).toBe(1);
        result.forEach(_ => Expect(typeof _).toEqual("function"));
    }
}
