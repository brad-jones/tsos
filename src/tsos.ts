import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as requireDir from 'require-dir';
import requireGlob = require('require-glob');
import { TranspilerOutput, Visitor, transpile as tspoonTranspile } from '@brad-jones/tspoon';

/**
 * Discovers Tspoon Visitor Modules from NPM Packages.
 *
 * A Tspoon Visitor Module, is simply a javascript module that provides 2
 * functions. A filter function that you guessed it, filters ast nodes before
 * handing off to a visit function that then performs transpilations.
 *
 * > NOTE: Visitor modules are expected to provide a single "default" export.
 *
 * Visitors are found by first looking for a "package.json" file in the provided
 * basePath, if that file defines a `tsos.visitors` array of glob patterns, each
 * glob pattern is passed to `requireGlob`, the resulting exports are added to
 * the visitors array.
 *
 * We then recurse into "node_modules" and repeat.
 *
 * @param  {string} basePath Where to start looking for modules.
 *
 * @return Visitor[] An array of visitors.
 */
export function discoverVisitorsFromNpmPackages(basePath: string): Visitor[]
{
    let visitorsArray: Visitor[] = [];

    let pkg;
    try { pkg = require(path.join(basePath, 'package.json')); }
    catch (e) { /* siliently fail and move on */ }

    if (pkg && pkg.tsos && pkg.tsos.visitors instanceof Array)
    {
        visitorsArray.push
        (
            ...discoverVisitors(basePath, pkg.tsos.visitors as Array<string>)
        );
    }

    fs.readdirSync(basePath).filter(f => fs.statSync(path.join(basePath, f)).isDirectory()).forEach(v =>
    {
        // Recurse into npm org packages
        if (v.startsWith('@'))
        {
            visitorsArray.push(...discoverVisitorsFromNpmPackages(path.join(basePath, v)));
            return;
        }

        // Recurse into node_modules
        try { visitorsArray.push(...discoverVisitorsFromNpmPackages(path.join(basePath, v, 'node_modules'))); }
        catch (e) { /* siliently fail and move on */ }
    });

    return visitorsArray;
}

/**
 * Discovers Tspoon Visitor Modules using "require-glob".
 *
 * @param  {string}   basePath  The base path that is prepended to each glob.
 *
 * @param  {string[]} globPaths An array of glob paths, that might contain
 *                              visitor modules.
 *
 * @return {Visitor[]}
 */
export function discoverVisitors(basePath: string, globPaths: string[]): Visitor[]
{
    let visitorsArray: Visitor[] = [];

    globPaths.forEach(glob =>
    {
        let visitorsMap: {[index:string]:{default:Visitor}} = requireGlob.sync
        (
            path.join(basePath, glob),
            {
                reducer: (options, result, fileObject, i, fileObjects) =>
                {
                    result[fileObject['path']] = fileObject['exports'];
                    return result;
                }
            }
        );

        visitorsArray.push
        (
            ...Object.keys(visitorsMap).map
            (
                key => visitorsMap[key].default
            )
        );
    });

    return visitorsArray;
}

/**
 * For a given basePath, using the built-in TypeScript API,
 * this will return a completely parsed tsconfig,
 * including any parent "extends".
 *
 * @param  {string} basePath The path to start searching for a
 *                           "tsconfig.json" file.
 *
 * @param  {string} configName By default this is set to "tsconfig.json" but
 *                             perhaps you want to find something else, like
 *                             "tsconfig.es6.config".
 *
 * @return ts.ParsedCommandLine
 */
export function loadTsConfig(basePath: string, configName?: string): ts.ParsedCommandLine
{
    let tsConfigFileName = fs.realpathSync
    (
        ts.findConfigFile
        (
            basePath,
            ts.sys.fileExists,
            configName
        )
    );

    let tsConfigParsedJson = ts.parseConfigFileTextToJson
    (
        tsConfigFileName,
        ts.sys.readFile(tsConfigFileName)
    );

    return ts.parseJsonConfigFileContent
    (
        tsConfigParsedJson.config,
        ts.sys,
        path.dirname(tsConfigFileName),
        null,
        tsConfigFileName
    );
}

export function transpile(filePath: string, source: string, visitors: Visitor[] = [], compilerOptions?: ts.CompilerOptions): string
{
    if (typeof compilerOptions === 'undefined' || compilerOptions === null)
    {
        try
        {
            compilerOptions = loadTsConfig(path.dirname(filePath)).options;
        }
        catch(e)
        {
            compilerOptions = {};
        }
    }

    const transpilerOut = tspoonTranspile(source,
    {
        sourceFileName: filePath,
        compilerOptions: compilerOptions,
        visitors: visitors
    });

    if (transpilerOut.diags)
    {
        transpilerOut.diags.forEach(d =>
        {
            var position = d.file.getLineAndCharacterOfPosition(d.start);
            console.error('->', d.file.fileName+':'+ (1+position.line)+':'+ position.character, ':',  d.messageText);
        });
    }

    if (transpilerOut.halted) throw new Error('Invalid TypeScript!');

    return transpilerOut.code;
}

export function transpileFile(filePath: string, visitors: Visitor[] = [], compilerOptions?: ts.CompilerOptions): string
{
    return transpile(filePath, fs.readFileSync(filePath, 'utf8'), visitors, compilerOptions);
}
