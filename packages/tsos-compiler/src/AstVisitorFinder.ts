import * as fs from 'mz/fs';
import * as path from 'path';
import * as ts from 'typescript';
import { injectable } from 'inversify';
import { Implements } from './Decorators';
import deasync = require('deasync-promise');
import { IAstVisitor } from './IAstVisitor';
import requireGlob = require('require-glob');
import globPromise = require('glob-promise');

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
     * Discovers `IAstVisitor` modules from NPM Packages.
     *
     * - `basePath` a folder than contains a `package.json`
     *    or a `node_modules` folder.
     *
     * Visitors are found by first looking for a `package.json` file in the
     * provided `basePath`, if that file defines a `tsos.visitors` array of
     * glob patterns, each glob pattern is passed to `FindByGlob`, the
     * resulting exports are added to the visitors array.
     *
     * We then recurse into `node_modules` and repeat.
     */
    FindFromNpmPackages(basePath: string): Promise<IAstVisitor[]>;

    /**
     * Does exactly the same thing as `FindFromNpmPackages` but synchronously.
     */
    FindFromNpmPackagesSync(basePath: string): IAstVisitor[];
}

export interface IStaticAstVisitorFinder
{
    new (...args: any[]): IAstVisitorFinder;
}

@injectable()
@Implements<IStaticAstVisitorFinder>()
export class AstVisitorFinder
{
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

    public async FindFromNpmPackages(basePath: string): Promise<IAstVisitor[]>
    {
        let visitorsArray: IAstVisitor[] = [];

        let pkg;
        try { pkg = require(path.join(basePath, 'package.json')); }
        catch (e) { /* siliently fail and move on */ }

        if (pkg && pkg.tsos && pkg.tsos.visitors instanceof Array)
        {
            let globs = (pkg.tsos.visitors as Array<string>).map(glob => path.join(basePath, glob));
            let visitors = await this.FindByGlob(globs);
            visitorsArray.push(...visitors);
        }

        let pkgFolders: string[] = [];
        let nodeModules = path.join(basePath, 'node_modules');
        try { pkgFolders = await fs.readdir(nodeModules); }
        catch (e) { /* siliently fail and move on */ }

        for (let pkgFolder of pkgFolders.filter(f => fs.statSync(path.join(nodeModules, f)).isDirectory()))
        {
            if (pkgFolder.startsWith('@'))
            {
                for (let orgFolder of (await fs.readdir(path.join(nodeModules, pkgFolder))).filter(f => fs.statSync(path.join(nodeModules, pkgFolder, f)).isDirectory()))
                {
                    visitorsArray.push(...await this.FindFromNpmPackages(path.join(nodeModules, pkgFolder, orgFolder)));
                }
            }
            else
            {
                visitorsArray.push(...await this.FindFromNpmPackages(path.join(nodeModules, pkgFolder)));
            }
        }

        return visitorsArray;
    }

    public FindFromNpmPackagesSync(basePath: string): IAstVisitor[]
    {
        return deasync(this.FindFromNpmPackages(basePath));
    }
}
