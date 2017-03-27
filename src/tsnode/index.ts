import * as yn from 'yn';
import * as ts from 'typescript';
import * as mkdirp from 'mkdirp';
import * as crypto  from 'crypto';
import * as arrify  from 'arrify';
import { BaseError } from 'make-error';
import { EOL, homedir, tmpdir } from 'os';
import sourceMapSupport = require('source-map-support');
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join, relative, resolve } from 'path';
import { transpile as tspoonTranspile, Visitor } from '@brad-jones/tspoon';
import { discoverVisitors, discoverVisitorsFromNpmPackages, loadTsConfig } from '../tsos';

/**
 * Export the current version of tsos.
 */
const pkg = require('../../package.json');
export const VERSION = pkg.version;

/**
 * Registration options.
 */
export interface Options
{
    fast?: boolean | null;
    cache?: boolean | null;
    cacheDirectory?: string;
    project?: boolean | string;
    ignore?: boolean | string | string[];
    ignoreWarnings?: number | string | Array<number | string>;
    disableWarnings?: boolean | null;
    getFile?: (fileName: string) => string;
    fileExists?: (fileName: string) => boolean;
    compilerOptions?: any;
    visitors?: boolean | string | string[];
}

/**
 * Default register options.
 */
const DEFAULTS: Options =
{
    getFile,
    fileExists,
    cache: yn(process.env['TSOS_CACHE']),
    cacheDirectory: process.env['TSOS_CACHE_DIRECTORY'],
    disableWarnings: yn(process.env['TSOS_DISABLE_WARNINGS']),
    compilerOptions: parse(process.env['TSOS_COMPILER_OPTIONS']),
    project: process.env['TSOS_PROJECT'],
    ignore: split(process.env['TSOS_IGNORE']),
    ignoreWarnings: split(process.env['TSOS_IGNORE_WARNINGS']),
    fast: yn(process.env['TSOS_FAST']),
    visitors: split(process.env['TSOS_VISITORS'])
}

/**
 * Track the project information.
 */
interface Cache
{
    contents: { [fileName: string]: string };
    versions: { [fileName: string]: number };
    sourceMaps: { [fileName: string]: string };
}

/**
 * Information retrieved from type info check.
 */
export interface TypeInfo
{
    name: string;
    comment: string;
}

/**
 * Internal source output.
 */
type SourceOutput = [string, string];

/**
 * Internal diagnostic representation.
 */
export interface TSDiagnostic
{
    message: string;
    code: number;
}

/**
 * Results from calling the "register" function.
 */
export interface Register
{
    cwd: string;
    extensions: string[];
    compile(code: string, fileName: string, lineOffset?: number): string;
    getTypeInfo(fileName: string, position: number): TypeInfo;
}

/**
 * Registers the TypeScript compiler (actually tspoon).
 *
 * @param  {Options} options Configure the compiler with these options.
 *
 * @return {Register}
 */
export function register(options: Options = {}): Register
{
    const cwd = process.cwd();
    const extensions = ['.ts', '.tsx'];
    const originalJsHandler = require.extensions['.js'];
    const getFile = options.getFile || DEFAULTS.getFile;
    const fileExists = options.fileExists || DEFAULTS.fileExists;
    const emptyFileListWarnings = [18002, 18003];
    const ignoreWarnings = arrify(options.ignoreWarnings || DEFAULTS.ignoreWarnings || []).concat(emptyFileListWarnings).map(Number);
    const disableWarnings = !!(options.disableWarnings == null ? DEFAULTS.disableWarnings : options.disableWarnings);
    const shouldCache = !!(options.cache == null ? DEFAULTS.cache : options.cache);
    const fast = !!(options.fast == null ? DEFAULTS.fast : options.fast);
    const project = options.project || DEFAULTS.project;

    // Determin the actual base path, regardless of if a "project" is used or not.
    let basePath: string;
    if (typeof project === 'string')
    {
        if (project.endsWith('.json'))
        {
            basePath = dirname(project);
        }
        else
        {
            basePath = project;
        }
    }
    else
    {
        basePath = cwd;
    }

    // The main TypeScript compiler configuration.
    //
    // In order, is made up of the following:
    //
    //   - Environment variables
    //
    //   - Cli Arguments & Options
    //
    //   - Project "tsconfig.json" files
    //
    //   - And some hard coded values,
    //     that are hard requirements for
    //     the functionality of tsnode.
    //
    const config = readConfig
    (
        ts.convertCompilerOptionsFromJson(Object.assign({}, DEFAULTS.compilerOptions, options.compilerOptions), basePath).options,
        project,
        cwd
    );

    let configDiagnostics = filterDiagnostics
    (
        config.errors, ignoreWarnings, disableWarnings
    );

    if (configDiagnostics.length)
    {
        throw new TSError(formatDiagnostics(configDiagnostics, cwd, 0));
    }

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

    // An array of regular expressions used to blacklist
    // certian files / folders from being transpiled.
    const ignore: RegExp[] = arrify
    (
        (
            typeof options.ignore === 'boolean' ?
            (options.ignore === false ? [] : undefined) :
            (options.ignore || DEFAULTS.ignore)
        ) ||
        ['/node_modules/']
    )
    .map(str => new RegExp(str));

    // Start with a blank cache.
    const cache: Cache = { contents: {}, versions: {}, sourceMaps: {} };

    // Define the cache directory
    const cacheDirectory: string = join
    (
        resolve(cwd, options.cacheDirectory || DEFAULTS.cacheDirectory || getTmpDir()),
        getCompilerDigest({version: ts.version,fast,ignoreWarnings,disableWarnings,config,tspoonVisitors})
    );

    // Make sure the cache directory _always_ exists (source maps write there).
    mkdirp.sync(cacheDirectory);

    // Install source map support and read from cache.
    sourceMapSupport.install
    ({
        environment: 'node',
        retrieveSourceMap(fileName: string)
        {
            if (cache.sourceMaps[fileName])
            {
                return {
                    url: cache.sourceMaps[fileName],
                    map: getFile(cache.sourceMaps[fileName])
                };
            }
        }
    });

    // Enable `allowJs` when flag is set.
    if (config.options.allowJs)
    {
        extensions.push('.js');
    }

    // Add all files into the file hash.
    for (const fileName of config.fileNames)
    {
        if (/\.d\.ts$/.test(fileName))
        {
            cache.versions[fileName] = 1;
        }
    }

    // Get the extension for a transpiled file.
    let getExtension = (fileName: string) =>
    {
        if (config.options.jsx === ts.JsxEmit.Preserve && extname(fileName) === '.tsx')
        {
            return '.jsx';
        }

        return '.js';
    }

    // This is where we actually transpile TypeScript into JavaScript.
    let getOutput = (code: string, fileName: string, lineOffset = 0): SourceOutput =>
    {
        const result = tspoonTranspile(code,
        {
            sourceFileName: fileName,
            compilerOptions: config.options,
            visitors: tspoonVisitors
        });

        const diagnosticList = result.diags ?
        filterDiagnostics(result.diags, ignoreWarnings, disableWarnings) :
        [];

        if (diagnosticList.length)
        {
            throw new TSError(formatDiagnostics(diagnosticList, cwd, lineOffset));
        }

        return [result.code, JSON.stringify(result.sourceMap)];
    };

    let compile = readThrough
    (
        cacheDirectory,
        shouldCache,
        getFile,
        fileExists,
        cache,
        getOutput,
        getExtension
    );

    let getTypeInfo = (_fileName: string, _position: number): TypeInfo =>
    {
        throw new TypeError(`No type information available under "--fast" mode`);
    };

    // Use full language services when the fast option is disabled.
    if (!fast)
    {
        // TODO: Investigate the tspoon "validate" functionality.
        throw new TypeError('tsos does not yet support full type checking with tspoon');
    }

    const register: Register = { cwd, compile, getTypeInfo, extensions };

    // Register the extensions.
    extensions.forEach(extension => registerExtension(extension, ignore, register, originalJsHandler));

    return register;
}

/**
 * Registers the TypeScript compiler with node, using "require.extensions".
 *
 * @param  {string} ext File extension to register typescript transpilation for.
 *
 * @param  {RegExp[]} ignore Used as a blacklist to skip transpilation for.
 *
 * @param  {Register} register Register object that includes the
 *                             all important "compile" method.
 *
 * @param  {string} originalHandler The original javascript registration, once
 *                                  transpiled to JavaScript we still need a way
 *                                  to execute that JavaScript.
 *
 * @return {void}
 */
function registerExtension(ext: string, ignore: RegExp[], register: Register, originalHandler: (m: NodeModule, filename: string) => any): void
{
    const old = require.extensions[ext] || originalHandler;

    require.extensions[ext] = function (m, filename)
    {
        if (shouldIgnore(filename, ignore)) return old(m, filename);

        const _compile = m._compile;

        m._compile = function (code, fileName)
        {
            return _compile.call
            (
                this,
                register.compile(code, fileName),
                fileName
            );
        }

        return old(m, filename);
    }
}

/**
 * Reads in any further configuration from "tsconfig.json" files.
 *
 * @param  {ts.CompilerOptions} compilerOptions Any existing compiler options to
 *                                              be merged with the ones we read
 *                                              from the filesystem.
 *
 * @param  {string|boolean|undefined} project A custom project, file or
 *                                            directory, to read config from.
 *
 * @param  {string} cwd The current working directory.
 *
 * @return {ts.ParsedCommandLine}
 */
function readConfig(compilerOptions: ts.CompilerOptions, project: string|boolean|undefined, cwd: string): ts.ParsedCommandLine
{
    // Load config from the current working directory or a specific project.
    let tsConfig: ts.ParsedCommandLine;
    if (typeof project === 'string')
    {
        if (project.endsWith('.json'))
        {
            tsConfig = loadTsConfig(dirname(project), basename(project));
        }
        else
        {
            tsConfig = loadTsConfig(project);
        }
    }
    else
    {
        tsConfig = loadTsConfig(cwd);
    }

    // Merge in any options provided through the cli / env variables
    tsConfig.options = Object.assign({}, tsConfig.options, compilerOptions);

    // Options that are pivotal to the functionality of tsnode.
    tsConfig.options.sourceMap = true;
    tsConfig.options.inlineSourceMap = false;
    tsConfig.options.inlineSources = true;
    tsConfig.options.declaration = false;
    tsConfig.options.noEmit = false;
    tsConfig.options.outDir = '$$tsos$$';

    // Delete options that *should not* be passed through.
    delete tsConfig.options.out;
    delete tsConfig.options.outFile;
    delete tsConfig.options.declarationDir;

    // Target ES5 output by default (instead of ES3).
    if (tsConfig.options.target === undefined)
    {
        tsConfig.options.target = ts.ScriptTarget.ES5;
    }

    // Force CommonJS modules, node doesn't understand anything else.
    tsConfig.options.module = ts.ModuleKind.CommonJS;

    return tsConfig;
}

/**
 * Wraps a compile method, such that it's output will be cached if enabled.
 *
 * @param  {string} cachedir The directory where the cache resides.
 *
 * @param  {boolean} shouldCache If true a caching compile method will be
 *                               returned, if false a non-caching compile
 *                               method will be returned.
 *
 * @param  {Function} getFile A function to read a file.
 *
 * @param  {Function} fileExists A function to check if a file exists.
 *
 * @param  {Cache} cache An instance of our Cache object.
 *
 * @param  {Function} compile The original compile function.
 *
 * @param  {Function} getExtension A function that returns the new file
 *                                 extension, given the original filename.
 *                                 ie: .ts becomes .js
 *
 * @return {Function} A wrapped compile function.
 */
function readThrough
(
    cachedir: string,
    shouldCache: boolean,
    getFile: (fileName: string) => string,
    fileExists: (fileName: string) => boolean,
    cache: Cache,
    compile: (code: string, fileName: string, lineOffset?: number) => SourceOutput,
    getExtension: (fileName: string) => string
){
    if (shouldCache === false)
    {
        return function (code: string, fileName: string, lineOffset?: number)
        {
            const cachePath = join(cachedir, getCacheName(code, fileName));
            const extension = getExtension(fileName);
            const sourceMapPath = `${cachePath}${extension}.map`;
            const out = compile(code, fileName, lineOffset);
            cache.sourceMaps[fileName] = sourceMapPath;
            const output = updateOutput(out[0], fileName, extension, sourceMapPath);
            const sourceMap = updateSourceMap(out[1], fileName);
            writeFileSync(sourceMapPath, sourceMap);
            return output;
        }
    }

    return function (code: string, fileName: string, lineOffset?: number)
    {
        const cachePath = join(cachedir, getCacheName(code, fileName));
        const extension = getExtension(fileName);
        const outputPath = `${cachePath}${extension}`;
        const sourceMapPath = `${outputPath}.map`;
        cache.sourceMaps[fileName] = sourceMapPath;
        if (fileExists(outputPath)) return getFile(outputPath);
        const out = compile(code, fileName, lineOffset);
        const output = updateOutput(out[0], fileName, extension, sourceMapPath);
        const sourceMap = updateSourceMap(out[1], fileName);
        writeFileSync(outputPath, output);
        writeFileSync(sourceMapPath, sourceMap);
        return output
    }
}

/**
 * Split a string array of values.
 */
export function split(value: string | undefined): string[]
{
    return value ? value.split(/ *, */g) : undefined;
}

/**
 * Parse a string as JSON.
 */
export function parse(value: string | undefined)
{
    return value ? JSON.parse(value) : undefined;
}

/**
 * Replace backslashes with forward slashes.
 */
export function normalizeSlashes(value: string): string
{
    return value.replace(/\\/g, '/');
}

/**
 * Return a default temp directory based on home directory of user.
 */
function getTmpDir(): string
{
    const hash = crypto.createHash('sha256').update(homedir(), 'utf8').digest('hex');
    return join(tmpdir(), `tsos-${hash}`);
}

/**
 * Check if the filename should be ignored.
 */
function shouldIgnore(filename: string, ignore: RegExp[]): boolean
{
    const relname = normalizeSlashes(filename);
    return ignore.some(x => x.test(relname));
}

/**
 * Update the output remapping the source map.
 */
function updateOutput(outputText: string, fileName: string, extension: string, sourceMapPath: string): string
{
    // Replace the original extension (E.g. `.ts`).
    const ext = extname(fileName);
    const originalPath = basename(fileName).slice(0, -ext.length) + `${extension}.map`;
    return outputText.slice(0, -originalPath.length) + sourceMapPath.replace(/\\/g, '/');
}

/**
 * Update the source map contents for improved output.
 */
function updateSourceMap(sourceMapText: string, fileName: string): string
{
    const sourceMap = JSON.parse(sourceMapText);
    sourceMap.file = fileName;
    sourceMap.sources = [fileName];
    delete sourceMap.sourceRoot;
    return JSON.stringify(sourceMap);
}

/**
 * Get the file name for the cache entry.
 */
function getCacheName(sourceCode: string, fileName: string): string
{
    return crypto.createHash('sha256')
        .update(extname(fileName), 'utf8')
        .update('\0', 'utf8')
        .update(sourceCode, 'utf8')
        .digest('hex');
}

/**
 * Create a hash of the current configuration.
 */
function getCompilerDigest(opts: any): string
{
    return crypto.createHash('sha256').update(JSON.stringify(opts), 'utf8').digest('hex');
}

/**
 * Check if the file exists.
 */
export function fileExists(fileName: string): boolean
{
    try
    {
        const stats = statSync(fileName);
        return stats.isFile() || stats.isFIFO();
    }
    catch (err)
    {
        return false;
    }
}

/**
 * Get the file from the file system.
 */
export function getFile(fileName: string): string
{
    return readFileSync(fileName, 'utf8');
}

/**
 * Filter diagnostics.
 */
function filterDiagnostics(diagnostics: ts.Diagnostic[], ignore: number[], disable: boolean): ts.Diagnostic[]
{
    if (disable) return [];
    return diagnostics.filter(x => ignore.indexOf(x.code) === -1);
}

/**
 * Format an array of diagnostics.
 */
export function formatDiagnostics(diagnostics: ts.Diagnostic[], cwd: string, lineOffset: number): TSDiagnostic[]
{
    return diagnostics.map(x => formatDiagnostic(x, cwd, lineOffset));
}

/**
 * Format a diagnostic object into a string.
 */
export function formatDiagnostic(diagnostic: ts.Diagnostic, cwd: string, lineOffset: number): TSDiagnostic
{
    const messageText = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    if (diagnostic.file)
    {
        const path = relative(cwd, diagnostic.file.fileName);
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const message = `${path} (${line + 1 + lineOffset},${character + 1}): ${messageText} (${diagnostic.code})`;
        return { message, code: diagnostic.code };
    }

    return { message: `${messageText} (${diagnostic.code})`, code: diagnostic.code };
}

/**
 * TypeScript diagnostics error.
 */
export class TSError extends BaseError
{
    public name = 'TSError';

    public constructor(public diagnostics: TSDiagnostic[])
    {
        super(`⨯ Unable to compile TypeScript\n${diagnostics.map(x => x.message).join('\n')}`);
    }
}
