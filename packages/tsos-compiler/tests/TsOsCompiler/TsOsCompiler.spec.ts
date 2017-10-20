import { fs } from 'mz';
import * as ts from 'typescript';
import * as shell from 'shelljs';
import TsSimpleAst from 'ts-simple-ast';
import { Expect, Test, AsyncTest, SpyOn, Any } from "alsatian";
import { TsOsCompiler } from '@brad-jones/tsos-compiler';

export class TsOsCompilerFixture
{
    @Test()
    public EnsureContructorCreatesDefaultDependencies()
    {
        let compiler = new TsOsCompiler();
        Expect(compiler['tsConfigLoader']['constructor']['name']).toBe('TsConfigLoader');
        Expect(compiler['astVisitorFinder']['constructor']['name']).toBe('AstVisitorFinder');
    }

    @Test()
    public EnsureContructorAcceptsCustomDependencies()
    {
        let compiler = new TsOsCompiler({name: 'FakeTsConfigLoader'} as any, {name: 'FakeAstVisitorFinder'} as any);
        Expect(compiler['tsConfigLoader']['name']).toBe('FakeTsConfigLoader');
        Expect(compiler['astVisitorFinder']['name']).toBe('FakeAstVisitorFinder');
    }

    @AsyncTest()
    public async ConfigureAstWithAst()
    {
        let ast = new TsSimpleAst();
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst(ast);
        Expect(compiler['ast']).toBe(ast);
    }

    @Test()
    public ConfigureAstWithAstSync()
    {
        let ast = new TsSimpleAst();
        let compiler = new TsOsCompiler();
        compiler.ConfigureAstSync(ast);
        Expect(compiler['ast']).toBe(ast);
    }

    @AsyncTest()
    public async ConfigureAstWithCompilerOptions()
    {
        let options: ts.CompilerOptions = { baseUrl: '.' };
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst(options);
        Expect(compiler['ast']['global']['_compilerOptions']['baseUrl']).toBe(options.baseUrl);
    }

    @Test()
    public ConfigureAstWithCompilerOptionsSync()
    {
        let options: ts.CompilerOptions = { baseUrl: '.' };
        let compiler = new TsOsCompiler();
        compiler.ConfigureAstSync(options);
        Expect(compiler['ast']['global']['_compilerOptions']['baseUrl']).toBe(options.baseUrl);
    }

    @AsyncTest()
    public async ConfigureAstWithTsConfig()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        await compiler.ConfigureAst(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler['tsConfigLoader']['LoadConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
    }

    @Test()
    public ConfigureAstWithTsConfigSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        compiler.ConfigureAstSync(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler['tsConfigLoader']['LoadConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
    }

    @AsyncTest()
    public async ConfigureAstWithTsConfigAndCompilerOptions()
    {
        let options: ts.CompilerOptions = { baseUrl: '/foo/bar' };
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        await compiler.ConfigureAst(`${__dirname}/../../../../tsconfig.json`, options);
        Expect(compiler['tsConfigLoader']['LoadConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['ast']['global']['_compilerOptions']['baseUrl']).toBe(options.baseUrl);
    }

    @Test()
    public async ConfigureAstWithTsConfigAndCompilerOptionsSync()
    {
        let options: ts.CompilerOptions = { baseUrl: '/foo/bar' };
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        compiler.ConfigureAstSync(`${__dirname}/../../../../tsconfig.json`, options);
        Expect(compiler['tsConfigLoader']['LoadConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['ast']['global']['_compilerOptions']['baseUrl']).toBe(options.baseUrl);
    }

    @AsyncTest()
    public async ConfigureAstWithTsConfigNoAutoAddFiles()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        await compiler.ConfigureAst(`${__dirname}/../../../../tsconfig.json`, undefined, false);
        Expect(compiler['tsConfigLoader']['LoadConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler.AddSrcFiles).not.toHaveBeenCalled();
    }

    @Test()
    public ConfigureAstWithTsConfigNoAutoAddFilesSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        compiler.ConfigureAstSync(`${__dirname}/../../../../tsconfig.json`, undefined, false);
        Expect(compiler['tsConfigLoader']['LoadConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler.AddSrcFiles).not.toHaveBeenCalled();
    }

    @AsyncTest()
    public async ConfigureAstWithParsedConfig()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        await compiler.ConfigureAst(ts.parseJsonConfigFileContent({}, ts.sys, `${__dirname}/../../../..`));
        Expect(compiler['tsConfigLoader']['LoadConfig']).not.toHaveBeenCalled();
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
    }

    @Test()
    public ConfigureAstWithParsedConfigSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        compiler.ConfigureAstSync(ts.parseJsonConfigFileContent({}, ts.sys, `${__dirname}/../../../..`));
        Expect(compiler['tsConfigLoader']['LoadConfig']).not.toHaveBeenCalled();
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
    }

    @AsyncTest()
    public async ConfigureAstWithParsedConfigAndCompilerOptions()
    {
        let options: ts.CompilerOptions = { baseUrl: '/foo/bar' };
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        await compiler.ConfigureAst(ts.parseJsonConfigFileContent({}, ts.sys, `${__dirname}/../../../..`), options);
        Expect(compiler['tsConfigLoader']['LoadConfig']).not.toHaveBeenCalled();
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['ast']['global']['_compilerOptions']['baseUrl']).toBe(options.baseUrl);
    }

    @Test()
    public ConfigureAstWithParsedConfigAndCompilerOptionsSync()
    {
        let options: ts.CompilerOptions = { baseUrl: '/foo/bar' };
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        compiler.ConfigureAstSync(ts.parseJsonConfigFileContent({}, ts.sys, `${__dirname}/../../../..`), options);
        Expect(compiler['tsConfigLoader']['LoadConfig']).not.toHaveBeenCalled();
        Expect(compiler.AddSrcFiles).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['ast']['global']['_compilerOptions']['baseUrl']).toBe(options.baseUrl);
    }

    @AsyncTest()
    public async ConfigureAstWithParsedConfigNoAutoAddFiles()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        await compiler.ConfigureAst(ts.parseJsonConfigFileContent({}, ts.sys, `${__dirname}/../../../..`), undefined, false);
        Expect(compiler['tsConfigLoader']['LoadConfig']).not.toHaveBeenCalled();
        Expect(compiler.AddSrcFiles).not.toHaveBeenCalled();
    }

    @Test()
    public ConfigureAstWithParsedConfigNoAutoAddFilesSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['tsConfigLoader'], 'LoadConfig');
        SpyOn(compiler, 'AddSrcFiles');
        compiler.ConfigureAstSync(ts.parseJsonConfigFileContent({}, ts.sys, `${__dirname}/../../../..`), undefined, false);
        Expect(compiler['tsConfigLoader']['LoadConfig']).not.toHaveBeenCalled();
        Expect(compiler.AddSrcFiles).not.toHaveBeenCalled();
    }

    @Test()
    public AddSrcFiles()
    {
        let compiler = new TsOsCompiler();
        compiler.ConfigureAstSync({});
        SpyOn(compiler['ast'], 'addSourceFiles');
        compiler.AddSrcFiles(['/foo/bar']);
        Expect(compiler['ast']['addSourceFiles']).toHaveBeenCalledWith('/foo/bar');
    }

    @AsyncTest()
    public async AddAstVisitorsWithBasePath()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindFromNpmPackages');
        await compiler.AddAstVisitors(`${__dirname}/../../../..`);
        Expect(compiler['astVisitorFinder']['FindFromNpmPackages']).toHaveBeenCalledWith(`${__dirname}/../../../..`);
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @Test()
    public async AddAstVisitorsWithBasePathSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindFromNpmPackages');
        compiler.AddAstVisitorsSync(`${__dirname}/../../../..`);
        Expect(compiler['astVisitorFinder']['FindFromNpmPackages']).toHaveBeenCalledWith(`${__dirname}/../../../..`);
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @AsyncTest()
    public async AddAstVisitorsWithGlobs()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromNpmPackages');
        await compiler.AddAstVisitors(['./foo/bar/**/*.js']);
        Expect(compiler['astVisitorFinder']['FindByGlob']).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['astVisitorFinder']['FindFromNpmPackages']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @Test()
    public async AddAstVisitorsWithGlobsSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromNpmPackages');
        compiler.AddAstVisitorsSync(['./foo/bar/**/*.js']);
        Expect(compiler['astVisitorFinder']['FindByGlob']).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['astVisitorFinder']['FindFromNpmPackages']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @AsyncTest()
    public async AddAstVisitorsWithVisitors()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromNpmPackages');
        await compiler.AddAstVisitors([() => {}]);
        Expect(compiler['astVisitorFinder']['FindByGlob']).not.toHaveBeenCalled();
        Expect(compiler['astVisitorFinder']['FindFromNpmPackages']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @Test()
    public async AddAstVisitorsWithVisitorsSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromNpmPackages');
        compiler.AddAstVisitorsSync([() => {}]);
        Expect(compiler['astVisitorFinder']['FindByGlob']).not.toHaveBeenCalled();
        Expect(compiler['astVisitorFinder']['FindFromNpmPackages']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    // TODO: Write missing Emit tests
    // Need to create a mock of the TsOsCompiler
    // so we don't spend ages actually Emitting things.
}
