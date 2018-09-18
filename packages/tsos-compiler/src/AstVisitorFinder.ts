import * as path from 'path';
import * as ts from 'typescript';
import { Implements } from './Decorators';
import deasync = require('deasync-promise');
import { IAstVisitor } from './IAstVisitor';
import requireGlob = require('require-glob');
import { inject, injectable } from 'inversify';
import { TsConfigLoader, ITsConfigLoader } from './TsConfigLoader';

export let IAstVisitorFinder = Symbol(__filename);

export interface IAstVisitorFinder
{
    /**
     * Discovers `IAstVisitor` modules using `require-glob`.
     *
     * - `globPaths` an array of glob paths, that might contain visitor modules.
     *
     * > NOTE: The modules must have a `default` export.
     */
    FindByGlob(globPaths: string[]): Promise<IAstVisitor[]>;

    /**
     * Does exactly the same thing as `FindByGlob` but synchronously.
     */
    FindByGlobSync(globPaths: string[]): IAstVisitor[];

    /**
     * Discovers `IAstVisitor` modules from a TsConfig file path.
     *
     * Visitors are found by looking for a `tsos.visitors` array of file globs
     * in the tsconfig file. This method will recursively follow any `extends`
     * and continue looking for `tsos.visitors` keys.
     *
     * Each glob pattern is passed to `FindByGlob`, the
     * resulting exports are added to the visitors array.
     */
    FindFromTsConfig(tsConfigFilePath: string): Promise<IAstVisitor[]>;

    /**
     * Discovers `IAstVisitor` modules from a `ts.ParsedCommandLine` object.
     *
     * Visitors are found by looking for a `tsos.visitors` array of file globs
     * in the tsconfig file. This method will recursively follow any `extends`
     * and continue looking for `tsos.visitors` keys.
     *
     * Each glob pattern is passed to `FindByGlob`, the
     * resulting exports are added to the visitors array.
     */
    FindFromTsConfig(tsConfig: ts.ParsedCommandLine): Promise<IAstVisitor[]>;

    /**
     * Does exactly the same thing as `FindFromTsConfig` but synchronously.
     */
    FindFromTsConfigSync(tsConfigFilePath: string): IAstVisitor[];

    /**
     * Does exactly the same thing as `FindFromTsConfig` but synchronously.
     */
    FindFromTsConfigSync(tsConfig: ts.ParsedCommandLine): IAstVisitor[];
}

export interface IStaticAstVisitorFinder
{
    new (...args: any[]): IAstVisitorFinder;
}

@injectable()
@Implements<IStaticAstVisitorFinder>()
export class AstVisitorFinder
{
    public constructor
    (
        @inject(ITsConfigLoader) protected tsConfigLoader: ITsConfigLoader = null
    ){
        // Make this class non di friendly
        if (tsConfigLoader === null) this.tsConfigLoader = new TsConfigLoader();
    }

    public async FindByGlob(globPaths: string[]): Promise<IAstVisitor[]>
    {
        let results = await requireGlob
        (
            globPaths,
            {
                reducer: (options, result, fileObject, i, fileObjects) =>
                {
                    if (!Array.isArray(result)) result = [];
                    result.push(fileObject.exports.default);
                    return result;
                }
            }
        );

        if (!Array.isArray(results)) results = [];

        return results;
    }

    public FindByGlobSync(globPaths: string[]): IAstVisitor[]
    {
        return deasync(this.FindByGlob(globPaths));
    }

    public async FindFromTsConfig(arg: string | ts.ParsedCommandLine): Promise<IAstVisitor[]>
    {
        let visitors: IAstVisitor[] = [];

        let tsConfig: ts.ParsedCommandLine;
        if (typeof arg === 'string')
        {
            tsConfig = await this.tsConfigLoader.LoadConfig(arg);
        }
        else
        {
            tsConfig = arg;
        }

        if (tsConfig.raw.extends)
        {
            let extend: string = tsConfig.raw.extends;
            if (!extend.startsWith('/'))
            {
                extend = path.join
                (
                    path.dirname(tsConfig.options.configFilePath as string),
                    extend
                );
            }

            visitors.push(...await this.FindFromTsConfig(extend));
        }

        if (tsConfig.raw.tsos && Array.isArray(tsConfig.raw.tsos.visitors))
        {
            visitors.push(...await this.FindByGlob
            (
                (tsConfig.raw.tsos.visitors as string[]).map(glob =>
                    glob.startsWith('/') ? glob : path.join
                    (
                        path.dirname(tsConfig.options.configFilePath as string),
                        glob
                    )
                )
            ));
        }

        return visitors;
    }

    public FindFromTsConfigSync(arg: string | ts.ParsedCommandLine): IAstVisitor[]
    {
        return deasync(this.FindFromTsConfig(arg));
    }
}
