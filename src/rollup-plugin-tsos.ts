import * as fs from 'fs';
import * as ts from 'typescript';
import { dirname, basename } from 'path';
import { createFilter } from 'rollup-pluginutils';
import { transpile as tspoonTranspile, Visitor } from '@brad-jones/tspoon';
import { loadTsConfig, discoverVisitors, discoverVisitorsFromNpmPackages } from './tsos';

export interface IRollupOptions
{
    project?: string;
    include?: string | string[];
	exclude?: string  | string[];
    visitors?: boolean | string | string[];
}

export interface IRollupTransformed
{
    code?: string;
    map?: Object;
}

export interface IRollupPlugin
{
    name?: string;
    options?: (globalOptions: any) => any;
    load?: (id: string) => string | null | undefined;
    resolveId?: (importee: string, importer: string) => string | null | undefined;
    transform?: (source: string, id: string) => IRollupTransformed;
    transformBundle?: (source: string, format?: string) => IRollupTransformed;
    ongenerate?: (bundleOptions: any, rendered: string) => void;
    onwrite?: (writeOptions: any, output: string) => void;
    intro?: () => string;
    outro?: () => string;
    banner?: string | (() => string);
    footer?: string | (() => string);
}

export default function tsosRollup(options?: IRollupOptions): IRollupPlugin
{
    // Set default options
    options = Object.assign<IRollupOptions, IRollupOptions>
    (
        {
            include: [ "*.ts+(|x)", "**/*.ts+(|x)" ],
            exclude: [ "*.d.ts", "**/*.d.ts" ],
        },
        options
    );

    // Determin the base path of the project.
    let basePath: string;
    if (options.project)
    {
        if (options.project.endsWith('.json'))
        {
            basePath = dirname(options.project);
        }
        else
        {
            basePath = options.project;
        }
    }
    else
    {
        basePath = process.cwd();
    }

    // Load tsconfig.json
    let tsConfig: ts.ParsedCommandLine;
    if (options.project && options.project.endsWith('.json'))
    {
        tsConfig = loadTsConfig(basePath, basename(options.project));
    }
    else
    {
        tsConfig = loadTsConfig(basePath);
    }

    // Override some options that are imperative to the operation of this rollup plugin.
    tsConfig.options.module = ts.ModuleKind.ES2015;
    tsConfig.options.noEmitHelpers = true;
    tsConfig.options.importHelpers = true;
    tsConfig.options.noResolve = false;

    // Load tspoon visitor modules.
    let tspoonVisitors: Visitor[];
    if (typeof options.visitors === 'boolean' && options.visitors === false)
    {
        tspoonVisitors = [];
    }
    else if (options.visitors instanceof Array)
    {
        tspoonVisitors = discoverVisitors(basePath, options.visitors);
    }
    else
    {
        tspoonVisitors = discoverVisitorsFromNpmPackages(basePath);
    }

    // Read in the tslib source.
    const TSLIB = "tslib";
    let tslibSource: string;
    try
    {
        tslibSource = fs.readFileSync
        (
            require.resolve
            (
                "tslib/"+require("tslib/package.json")["module"]
            ),
            "utf8"
        );
    }
    catch (e)
    {
        console.warn("Error loading `tslib` helper library."); throw e;
    }

    // Create our rollup filter
    let filter = createFilter(options.include, options.exclude);

    return {
        name: 'rollup-plugin-tsos',
        load: (id: string) => (id === "\0" + TSLIB) ? tslibSource : null,
        resolveId: (importee: string, importer: string): string =>
        {
            if (importee === TSLIB) return "\0" + TSLIB;

            if (!importer) return null;

            importer = importer.split("\\").join("/");

            const result = ts.nodeModuleNameResolver(importee, importer, tsConfig.options, ts.sys);

            if (result.resolvedModule && result.resolvedModule.resolvedFileName)
            {
                if (result.resolvedModule.resolvedFileName.endsWith('.d.ts'))
                {
                    return null;
                }

                return result.resolvedModule.resolvedFileName;
            }

            return null;
        },
        transform: (code: string, id: string): IRollupTransformed =>
        {
            if (!filter(id)) return null;

            const transpilerOut = tspoonTranspile(code,
            {
                sourceFileName: id,
                compilerOptions: tsConfig.options,
                visitors: tspoonVisitors
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

            return {
                code: transpilerOut.code,
                map: transpilerOut.sourceMap
            };
        }
    };
}
