import { fs } from 'mz';
import * as ts from 'typescript';
import * as shell from 'shelljs';
import TsSimpleAst from 'ts-simple-ast';
import { TsOsCompiler } from '@brad-jones/tsos-compiler';
import { Expect, Test, AsyncTest, SpyOn, Any, Timeout } from "alsatian";

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
        Expect(compiler['ast']['context']['_compilerOptions']['settings']['baseUrl']).toBe(options.baseUrl);
    }

    @Test()
    public ConfigureAstWithCompilerOptionsSync()
    {
        let options: ts.CompilerOptions = { baseUrl: '.' };
        let compiler = new TsOsCompiler();
        compiler.ConfigureAstSync(options);
        Expect(compiler['ast']['context']['_compilerOptions']['settings']['baseUrl']).toBe(options.baseUrl);
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
        Expect(compiler['ast']['context']['_compilerOptions']['settings']['baseUrl']).toBe(options.baseUrl);
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
        Expect(compiler['ast']['context']['_compilerOptions']['settings']['baseUrl']).toBe(options.baseUrl);
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
        Expect(compiler['ast']['context']['_compilerOptions']['settings']['baseUrl']).toBe(options.baseUrl);
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
        Expect(compiler['ast']['context']['_compilerOptions']['settings']['baseUrl']).toBe(options.baseUrl);
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
        SpyOn(compiler['ast'], 'addExistingSourceFiles');
        let files = ['/foo/bar'];
        compiler.AddSrcFiles(files);
        Expect(compiler['ast']['addExistingSourceFiles']).toHaveBeenCalledWith(files);
    }

    @AsyncTest()
    public async AddAstVisitorsWithTsConfigPath()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindFromTsConfig');
        await compiler.AddAstVisitors(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler['astVisitorFinder']['FindFromTsConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @Test()
    public async AddAstVisitorsWithTsConfigPathSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindFromTsConfig');
        compiler.AddAstVisitorsSync(`${__dirname}/../../../../tsconfig.json`);
        Expect(compiler['astVisitorFinder']['FindFromTsConfig']).toHaveBeenCalledWith(`${__dirname}/../../../../tsconfig.json`);
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @AsyncTest()
    public async AddAstVisitorsWithGlobs()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromTsConfig');
        await compiler.AddAstVisitors(['./foo/bar/**/*.js']);
        Expect(compiler['astVisitorFinder']['FindByGlob']).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['astVisitorFinder']['FindFromTsConfig']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @Test()
    public async AddAstVisitorsWithGlobsSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromTsConfig');
        compiler.AddAstVisitorsSync(['./foo/bar/**/*.js']);
        Expect(compiler['astVisitorFinder']['FindByGlob']).toHaveBeenCalledWith(Any(Array));
        Expect(compiler['astVisitorFinder']['FindFromTsConfig']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @AsyncTest()
    public async AddAstVisitorsWithVisitors()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromTsConfig');
        await compiler.AddAstVisitors([() => {}]);
        Expect(compiler['astVisitorFinder']['FindByGlob']).not.toHaveBeenCalled();
        Expect(compiler['astVisitorFinder']['FindFromTsConfig']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @Test()
    public async AddAstVisitorsWithVisitorsSync()
    {
        let compiler = new TsOsCompiler();
        SpyOn(compiler['astVisitorFinder'], 'FindByGlob');
        SpyOn(compiler['astVisitorFinder'], 'FindFromTsConfig');
        compiler.AddAstVisitorsSync([() => {}]);
        Expect(compiler['astVisitorFinder']['FindByGlob']).not.toHaveBeenCalled();
        Expect(compiler['astVisitorFinder']['FindFromTsConfig']).not.toHaveBeenCalled();
        compiler['astVisitors'].forEach(_ => Expect(typeof _).toBe('function'));
    }

    @AsyncTest()
    @Timeout(30000)
    public async EmitAll()
    {
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst(`${__dirname}/../../../../tsconfig.json`, { outDir: `${__dirname}/EmitAll` });
        let emitResult = await compiler.Emit();
        Expect(emitResult).toBeDefined();
        Expect(emitResult.getDiagnostics()).toBeEmpty();
        Expect(emitResult.getEmitSkipped()).toBe(false);
        shell.rm('-rf', `${__dirname}/EmitAll`);
    }

    @AsyncTest()
    @Timeout(30000)
    public async EmitWithDiagnostics()
    {
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst(`${__dirname}/EmitWithDiagnostics/tsconfig.json`);
        let emitResult = await compiler.Emit();
        Expect(emitResult).toBeDefined();
        Expect(emitResult.getDiagnostics()).not.toBeEmpty();
        Expect(emitResult.getEmitSkipped()).toBe(false);
        shell.rm('-r', `${__dirname}/EmitWithDiagnostics/*.js`);
    }

    @AsyncTest()
    @Timeout(30000)
    public async EmitSingleSourceFile()
    {
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst(`${__dirname}/../../../../tsconfig.json`, { outDir: `${__dirname}/EmitSingleSourceFile` });
        let emitResult = await compiler.Emit(['TsOsCompiler.ts']);
        Expect(emitResult.get('TsOsCompiler.ts')).toBeDefined();
        Expect(emitResult.get('TsOsCompiler.ts').getDiagnostics()).toBeEmpty();
        Expect(emitResult.get('TsOsCompiler.ts').getEmitSkipped()).toBe(false);
        Expect(await fs.exists(`${__dirname}/EmitSingleSourceFile/tsos-compiler/src/TsOsCompiler.js`)).toBe(true);
        shell.rm('-rf', `${__dirname}/EmitSingleSourceFile`);
    }

    @AsyncTest()
    @Timeout(30000)
    public async EmitManySourceFiles()
    {
        let files = ['tsos-compiler/src/TsOsCompiler.ts', 'tsos-compiler/src/AstVisitorFinder.ts'];
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst(`${__dirname}/../../../../tsconfig.json`, { outDir: `${__dirname}/EmitManySourceFiles` });
        let emitResult = await compiler.Emit(files);
        for (let file of files)
        {
            Expect(emitResult.get(file)).toBeDefined();
            Expect(emitResult.get(file).getDiagnostics()).toBeEmpty();
            Expect(emitResult.get(file).getEmitSkipped()).toBe(false);
            Expect(await fs.exists(`${__dirname}/EmitManySourceFiles/${file.replace('.ts', '.js')}`)).toBe(true);
        }
        shell.rm('-rf', `${__dirname}/EmitManySourceFiles`);
    }

    @AsyncTest()
    @Timeout(30000)
    public async EmitOnlyDtsFiles()
    {
        let compiler = new TsOsCompiler();
        await compiler.ConfigureAst(`${__dirname}/../../../../tsconfig.json`, { outDir: `${__dirname}/EmitOnlyDtsFiles` });
        let emitResult = await compiler.Emit(['TsOsCompiler.ts'], { emitOnlyDtsFiles: true });
        Expect(emitResult.get('TsOsCompiler.ts')).toBeDefined();
        Expect(emitResult.get('TsOsCompiler.ts').getDiagnostics()).toBeEmpty();
        Expect(emitResult.get('TsOsCompiler.ts').getEmitSkipped()).toBe(false);
        Expect(await fs.exists(`${__dirname}/EmitOnlyDtsFiles/tsos-compiler/src/TsOsCompiler.js`)).toBe(false);
        Expect(await fs.exists(`${__dirname}/EmitOnlyDtsFiles/tsos-compiler/src/TsOsCompiler.d.ts`)).toBe(true);
        shell.rm('-rf', `${__dirname}/EmitOnlyDtsFiles`);
    }
}
