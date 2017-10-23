import * as fs from 'mz/fs';
import * as path from 'path';
import * as ts from 'typescript';
import { injectable } from 'inversify';
import { Implements } from './Decorators';
import deasync = require('deasync-promise');

export let ITsConfigLoader = Symbol(__filename);

export interface ITsConfigLoader
{
    /**
     * For a given `filePath`, using the built-in TypeScript API,
     * this will return a completely parsed tsconfig, including any "extends".
     */
    LoadConfig(filePath: string): Promise<ts.ParsedCommandLine>;

    /**
     * Does exactly the same thing as `LoadConfig` but synchronously.
     */
    LoadConfigSync(filePath: string): ts.ParsedCommandLine;

    /**
     * For a given `srcFilePath`, anywhere on the filesystem,
     * using the built-in TypeScript API to locate any possible
     * tsconfig file(s), this will return a completely parsed tsconfig,
     * including any "extends".
     *
     * - `configName`: By default this is set to "tsconfig.json" but perhaps you
     *                 want to find something else, like "tsconfig.es6.config".
     */
    LoadConfigForSrcFile(srcFilePath: string, configName?: string): Promise<ts.ParsedCommandLine>;

    /**
     * Does exactly the same thing as `LoadConfigForSrcFile` but synchronously.
     */
    LoadConfigForSrcFileSync(srcFilePath: string, configName?: string): ts.ParsedCommandLine;
}

export interface IStaticTsConfigLoader
{
    new (...args: any[]): ITsConfigLoader;
}

@injectable()
@Implements<IStaticTsConfigLoader>()
export class TsConfigLoader
{
    public async LoadConfig(filePath: string): Promise<ts.ParsedCommandLine>
    {
        let rawTsConfigJson = await fs.readFile(filePath, { encoding: 'utf8' });
        let tsConfigParsedJson = ts.parseConfigFileTextToJson(filePath, rawTsConfigJson);
        return ts.parseJsonConfigFileContent(tsConfigParsedJson.config, ts.sys, path.dirname(filePath), null, filePath);
    }

    public LoadConfigSync(filePath: string): ts.ParsedCommandLine
    {
        return deasync(this.LoadConfig(filePath));
    }

    public async LoadConfigForSrcFile(srcFilePath: string, configName?: string): Promise<ts.ParsedCommandLine>
    {
        srcFilePath = await fs.realpath(srcFilePath);
        let basePath = path.dirname(srcFilePath);

        let tsConfigFileName = await fs.realpath
        (
            ts.findConfigFile
            (
                basePath,
                ts.sys.fileExists,
                configName
            )
        );

        let config = await this.LoadConfig(tsConfigFileName);

        // If the srcFilePath does not exist in the found tsconfig
        // we will return a default config instead.
        if (!config.fileNames.includes(srcFilePath))
        {
            config = ts.parseJsonConfigFileContent({}, ts.sys, basePath, null, configName);
            config.fileNames = [srcFilePath];
        }

        return config;
    }

    public LoadConfigForSrcFileSync(srcFilePath: string, configName?: string): ts.ParsedCommandLine
    {
        return deasync(this.LoadConfigForSrcFile(srcFilePath, configName));
    }
}
