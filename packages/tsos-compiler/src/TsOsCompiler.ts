import { merge } from 'lodash';
import * as ts from 'typescript';
import { Implements } from './Decorators';
import { IAstVisitor } from './IAstVisitor';
import deasync = require('deasync-promise');
import { inject, injectable } from 'inversify';
import { ITsConfigLoader, TsConfigLoader } from './TsConfigLoader';
import TsSimpleAst, { EmitOptions, EmitResult } from "ts-simple-ast";
import { IAstVisitorFinder, AstVisitorFinder } from './AstVisitorFinder';

export let ITsOsCompiler = Symbol(__filename);

// TODO: Write some documentation
export interface ITsOsCompiler
{
    ConfigureAst(ast: TsSimpleAst): Promise<void>;
    ConfigureAst(compilerOptions: ts.CompilerOptions): Promise<void>;
    ConfigureAst(tsConfigFilePath: string, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): Promise<void>;
    ConfigureAst(parsedTsConfig: ts.ParsedCommandLine, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): Promise<void>;
    ConfigureAstSync(ast: TsSimpleAst): void;
    ConfigureAstSync(compilerOptions: ts.CompilerOptions): void;
    ConfigureAstSync(tsConfigFilePath: string, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): void;
    ConfigureAstSync(parsedTsConfig: ts.ParsedCommandLine, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): void;
    AddSrcFiles(fileGlobs: string[]): void;
    AddAstVisitors(tsConfigFilePath: string): Promise<void>;
    AddAstVisitors(globs: string[]): Promise<void>;
    AddAstVisitors(visitors: IAstVisitor[]): Promise<void>;
    AddAstVisitorsSync(tsConfigFilePath: string): void;
    AddAstVisitorsSync(globs: string[]): void;
    AddAstVisitorsSync(visitors: IAstVisitor[]): void;
    Emit(emitOptions?: EmitOptions): Promise<EmitResult>;
    Emit(srcFiles: string[], emitOptions?: EmitOptions): Promise<Map<string, EmitResult>>;
    EmitSync(emitOptions?: EmitOptions): EmitResult;
    EmitSync(srcFiles: string[], emitOptions?: { emitOnlyDtsFiles?: boolean }): Map<string, EmitResult>;
}

export interface IStaticTsOsCompiler
{
    new (...args: any[]): ITsOsCompiler;
}

@injectable()
@Implements<IStaticTsOsCompiler>()
export class TsOsCompiler
{
    protected ast: TsSimpleAst;

    protected astVisitors: IAstVisitor[] = [];

    public constructor
    (
        @inject(ITsConfigLoader) protected tsConfigLoader: ITsConfigLoader = null,
        @inject(IAstVisitorFinder) protected astVisitorFinder: IAstVisitorFinder = null
    ){
        // Make this class non di friendly
        if (tsConfigLoader === null) this.tsConfigLoader = new TsConfigLoader();
        if (astVisitorFinder === null) this.astVisitorFinder = new AstVisitorFinder();
    }

    public ConfigureAst(ast: TsSimpleAst): Promise<void>;
    public ConfigureAst(compilerOptions: ts.CompilerOptions): Promise<void>;
    public ConfigureAst(tsConfigFilePath: string, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): Promise<void>;
    public ConfigureAst(parsedTsConfig: ts.ParsedCommandLine, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): Promise<void>;
    public async ConfigureAst(...args): Promise<void>
    {
        // Take the provided TsSimpleAst object as is,
        // assume the caller knows what they are doing.
        if (args[0] instanceof TsSimpleAst)
        {
            this.ast = args[0]; return;
        }

        // Take a simple CompilerOptions object and configure a new TsSimpleAst.
        // The caller will then have to add at least one source file to the ast.
        if (typeof args[0] === 'object' && !args[0].options)
        {
            this.ast = new TsSimpleAst({ compilerOptions: args[0] }); return;
        }

        // Otherwise grab the parsed ts config, either directly or from the filesystem.
        let parsedTsConfig: ts.ParsedCommandLine;
        switch (typeof args[0])
        {
            case 'object': parsedTsConfig = args[0]; break;
            case 'string': parsedTsConfig = await this.tsConfigLoader.LoadConfig(args[0]); break;
            default: throw new Error('First parameter must be of type, string or object!');
        }

        if (parsedTsConfig)
        {
            // Merge in any additional compiler options
            let compilerOptions = parsedTsConfig.options;
            if (typeof args[1] === 'object')
            {
                compilerOptions = merge(compilerOptions, args[1]);
            }

            // Create the new ast
            this.ast = new TsSimpleAst({ compilerOptions: compilerOptions, addFilesFromTsConfig: false });

            // Automatically add all source files to the ast.
            // Down the track this may not be required.
            // see: https://github.com/dsherret/ts-simple-ast/issues/7
            // While TsSimpleAst now allows us to import files from tsconfig,
            // in order to maintain our current interface (we allow files to be
            // automatically imported from ParsedCommandLine) we will disable
            // the provided functionality and continue to use our own.
            if (typeof args[2] === 'undefined' || typeof args[2] === 'boolean')
            {
                if (args[2] === false) return;
                this.AddSrcFiles(parsedTsConfig.fileNames);
            }

            return;
        }

        throw new Error('Invalid parameters provided!');
    }

    public ConfigureAstSync(ast: TsSimpleAst): void;
    public ConfigureAstSync(compilerOptions: ts.CompilerOptions): void;
    public ConfigureAstSync(tsConfigFilePath: string, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): void;
    public ConfigureAstSync(parsedTsConfig: ts.ParsedCommandLine, additionalCompilerOptions?: ts.CompilerOptions, autoAddSrcFiles?: boolean): void;
    public ConfigureAstSync(...args): void
    {
        deasync(this.ConfigureAst.apply(this, args));
    }

    public AddSrcFiles(fileGlobs: string[]): void
    {
        this.ast.addExistingSourceFiles.call(this.ast, fileGlobs);
    }

    public AddAstVisitors(tsConfigFilePath: string): Promise<void>;
    public AddAstVisitors(globs: string[]): Promise<void>;
    public AddAstVisitors(visitors: IAstVisitor[]): Promise<void>;
    public async AddAstVisitors(...args): Promise<void>
    {
        if (args[0] instanceof Array)
        {
            if (typeof args[0][0] === 'string')
            {
                this.astVisitors.push(...await this.astVisitorFinder.FindByGlob(args[0]));
            }
            else
            {
                this.astVisitors.push(...args[0]);
            }

            return;
        }

        if (typeof args[0] === 'string')
        {
            this.astVisitors.push(...await this.astVisitorFinder.FindFromTsConfig(args[0]));
            return;
        }

        throw new Error('Invalid parameters provided!');
    }

    public AddAstVisitorsSync(tsConfigFilePath: string): void;
    public AddAstVisitorsSync(globs: string[]): void;
    public AddAstVisitorsSync(visitors: IAstVisitor[]): void;
    public AddAstVisitorsSync(...args): void
    {
        deasync(this.AddAstVisitors.apply(this, args));
    }

    public Emit(emitOptions?: EmitOptions): Promise<EmitResult>;
    public Emit(srcFiles: string[], emitOptions?: EmitOptions): Promise<Map<string, EmitResult>>;
    public async Emit(...args): Promise<any>
    {
        let ctx = {};

        for (let visitor of this.astVisitors)
        {
            let possiblePromise = visitor(this.ast, ctx);

            if (possiblePromise instanceof Promise)
            {
                await possiblePromise;
            }
        }

        if (args[0] instanceof Array)
        {
            let results = new Map<string, EmitResult>();

            for (let srcFile of args[0])
            {
                results.set(srcFile, this.ast.getSourceFile(srcFile).emit(args[1]));
            }

            return results;
        }

        return this.ast.emit(args[0]);
    }

    public EmitSync(emitOptions?: EmitOptions): EmitResult;
    public EmitSync(srcFiles: string[], emitOptions?: { emitOnlyDtsFiles?: boolean }): Map<string, EmitResult>;
    public EmitSync(...args): any
    {
        return deasync(this.Emit.apply(this, args));
    }
}
