import { fs } from 'mz';
import { Expect, Test, AsyncTest } from "alsatian";
import { TsConfigLoader } from '@brad-jones/tsos-compiler';

export class TsConfigLoaderFixture
{
    @AsyncTest()
    public async LoadConfig()
    {
        let tsConfigLoader = new TsConfigLoader();
        let config = await tsConfigLoader.LoadConfig(`${__dirname}/../../../../tsconfig.json`);
        Expect(config.fileNames).toContain(__filename);
    }

    @Test()
    public LoadConfigSync()
    {
        let tsConfigLoader = new TsConfigLoader();
        let config = tsConfigLoader.LoadConfigSync(`${__dirname}/../../../../tsconfig.json`);
        Expect(config.fileNames).toContain(__filename);
    }

    @AsyncTest()
    public async LoadConfigForSrcFile()
    {
        let tsConfigLoader = new TsConfigLoader();
        let config = await tsConfigLoader.LoadConfigForSrcFile(__filename);
        Expect(config.options.configFilePath).toBe(await fs.realpath(`${__dirname}/../../../../tsconfig.json`));
    }

    @Test()
    public LoadConfigForSrcFileSync()
    {
        let tsConfigLoader = new TsConfigLoader();
        let config = tsConfigLoader.LoadConfigForSrcFileSync(__filename);
        Expect(config.options.configFilePath).toBe(fs.realpathSync(`${__dirname}/../../../../tsconfig.json`));
    }
}
