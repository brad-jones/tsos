import { tmpdir } from 'os';
import * as path from 'path';
import * as ts from 'typescript';
import * as shell from 'shelljs';
import nodeHook = require('node-hook');
import { h64 as xxhash } from 'xxhashjs';
import { readFileSync, writeFileSync } from 'fs';
import replaceInFile = require('replace-in-file');
import { inject, injectable, interfaces } from 'inversify';
import { install as sourceMapSupport } from 'source-map-support';
import { ICommandLineParser } from 'app/Infrastructure/TypeScript/CommandLineParser';
import { Implements, ITsConfigLoader, ITsOsCompiler, IAstVisitor, IAstVisitorFinder } from '@brad-jones/tsos-compiler';

export let INodeHook = Symbol(__filename);

export interface INodeHook
{
    Register(tsCliOptions: string[], astVisitorGlobs?: string[] | boolean, transpilationCache?: boolean): void;
    Transpile(source: string, filename: string): string;
}

export interface IStaticNodeHook
{
    new (...args): INodeHook;
}

@injectable()
@Implements<IStaticNodeHook>()
export class NodeHook
{
    private noVisitors: boolean = false;

    private transpiledFiles: Map<string, string>;

    private transpilationCache: boolean;

    private astVisitorsFromCli: IAstVisitor[];

    private cliConfig: ts.ParsedCommandLine;

    private cliConfigString: string;

    private static cacheDir = `${tmpdir()}/__tsos_cache`;

    public constructor
    (
        @inject(ITsConfigLoader) private tsConfigLoader: ITsConfigLoader,
        @inject(ICommandLineParser) private tsCliParser: ICommandLineParser,
        @inject(IAstVisitorFinder) private astVisitorFinder: IAstVisitorFinder,
        @inject("Factory<ITsOsCompiler>") private tsOsCompilerFactory: interfaces.Factory<ITsOsCompiler>
    ){}

    public Register(tsCliOptions: string[], astVisitorGlobs: string[] | boolean = [], transpilationCache = true): void
    {
        // When working with parallel node processes, sometimes a race condition
        // happens and shelljs attempts to create the folder even though it
        // already exists.
        try
        {
            shell.mkdir('-p', NodeHook.cacheDir);
        }
        catch (e)
        {
            if (e.code !== 'EEXIST')
            {
                throw e;
            }
        }

        this.transpiledFiles = new Map<string, string>();
        this.transpilationCache = transpilationCache;
        this.cliConfig = this.tsCliParser.ParseTsOptions(tsCliOptions);
        this.cliConfigString = JSON.stringify(this.cliConfig);
        nodeHook.hook('.ts', this.Transpile.bind(this));
        sourceMapSupport({ environment: 'node', retrieveSourceMap: this._retrieveSourceMap.bind(this) });

        // We add visitors after registering the actual hook as it is
        // possible that visitors may need compilation themselves.
        if (Array.isArray(astVisitorGlobs))
        {
            this.noVisitors = true;
            this.astVisitorsFromCli = this.astVisitorFinder.FindByGlobSync(astVisitorGlobs);
            this.noVisitors = false;
        }
        else
        {
            this.noVisitors = true;
        }
    }

    public Transpile(source: string, filename: string): string
    {
        let config: ts.ParsedCommandLine;
        if (this.cliConfig.options.project)
        {
            config = this.tsConfigLoader.LoadConfigSync(this.cliConfig.options.project);
        }
        else
        {
            config = this.tsConfigLoader.LoadConfigForSrcFileSync(filename);
        }

        let astVisitors: IAstVisitor[] = [];

        if (!this.noVisitors)
        {
            if (this.astVisitorsFromCli.length > 0)
            {
                astVisitors = this.astVisitorsFromCli;
            }
            else if (config.options.configFilePath)
            {
                this.noVisitors = true;
                astVisitors = this.astVisitorFinder.FindFromTsConfigSync(config.options.configFilePath as string);
                this.noVisitors = false;
            }
        }

        let fileNameHash = xxhash(filename, 0xCAFEBABE).toString();
        let hash = xxhash(source + JSON.stringify(config) + this.cliConfigString + JSON.stringify(astVisitors.map(_ => _.toString())), 0xCAFEBABE).toString();
        let cachedFolder = `${NodeHook.cacheDir}/${fileNameHash}`;
        let cachedFile = `${cachedFolder}/${hash}.js`;
        this.transpiledFiles.set(filename, cachedFile);

        if (this.transpilationCache)
        {
            try
            {
                return readFileSync(cachedFile, 'utf8');
            }
            catch(e)
            {
                if (e.code !== 'ENOENT') throw e;
                return this._transpile(config, filename, cachedFile, cachedFolder, astVisitors);
            }
        }
        else
        {
            // NOTE: Even though we ignore the cache, TsSimpleAst does not
            // provide an option to get the transpiled source before it is
            // saved to the filesystem. So therfore we still need somewhere
            // to save the transpiled source.
            return this._transpile(config, filename, cachedFile, cachedFolder, astVisitors);
        }
    }

    private _transpile(config: ts.ParsedCommandLine, srcFileName: string, cachedFile: string, cachedFolder: string, astVisitors: IAstVisitor[]): string
    {
        // Ensure we don't fill up someone's filesystem with a stale cache
        shell.rm('-rf', cachedFolder); shell.mkdir('-p', cachedFolder);

        // Force some compiler options, required to make tsos work
        let additionalCompilerOptions: ts.CompilerOptions = this.cliConfig.options;
        additionalCompilerOptions.outDir = cachedFolder;
        additionalCompilerOptions.sourceMap = true;
        additionalCompilerOptions.declaration = false;

        // Run the compilation
        let compiler = this.tsOsCompilerFactory() as ITsOsCompiler;
        compiler.ConfigureAstSync(config, additionalCompilerOptions);
        compiler.AddAstVisitorsSync(astVisitors);
        let result = compiler.EmitSync([srcFileName]).get(srcFileName);

        // Check for errors
        let diag = result.getDiagnostics();
        if (diag.length > 0)
        {
            shell.rm('-rf', cachedFolder);
            throw diag;
        }

        // Now rename the transpiled files
        // NOTE: The reason for this funny business is because using the
        // compiler option "outFile" does not treat each source file seperatly
        // when it comes time to emit that source file.
        let srcMapFilePath: string = (result.compilerObject as any).sourceMaps[0].sourceMapFilePath;
        let jsFilePath = srcMapFilePath.replace('.js.map', '.js');
        shell.mv(srcMapFilePath, cachedFile + '.map');
        shell.mv(jsFilePath, cachedFile);

        // Now fix up the source map comment
        replaceInFile.sync
        ({
            files: cachedFile,
            from: `//# sourceMappingURL=${path.basename(srcMapFilePath)}`,
            to: `//# sourceMappingURL=${cachedFile}.map`
        });

        // Also fix up some file paths in the actual source map
        let sourceMap = JSON.parse(readFileSync(cachedFile + '.map', 'utf8'));
        sourceMap.file = cachedFile;
        sourceMap.sources[0] = srcFileName;
        writeFileSync(cachedFile + '.map', JSON.stringify(sourceMap), 'utf8');

        // Clean up the old directory structure created by typescript
        shell.rm('-rf', path.join(cachedFolder, jsFilePath.replace(cachedFolder, '').split('/').find(_ => _.length > 0)));

        return readFileSync(cachedFile, 'utf8');
    }

    private _retrieveSourceMap(path: string)
    {
        let cachedPath = this.transpiledFiles.get(path);

        if (cachedPath)
        {
            return {
                url: path,
                map: readFileSync(cachedPath + '.map', 'utf8')
            };
        }

        return null;
    }
}
