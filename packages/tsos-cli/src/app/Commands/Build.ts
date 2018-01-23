import * as path from 'path';
import * as caporal from 'caporal';
import { inject, injectable } from 'inversify';
import { ICommand } from 'app/Commands/ICommand';
import { ITsOsCompiler } from '@brad-jones/tsos-compiler';
import { ILogger } from 'app/Infrastructure/Logging/ILogger';
import { ICaporalConfig } from 'app/Infrastructure/ICaporalConfig';
import { INodeHook } from 'app/Infrastructure/TypeScript/NodeHook';
import { ICommandLineParser } from 'app/Infrastructure/TypeScript/CommandLineParser';
import { IDiagnosticFormatter } from 'app/Infrastructure/TypeScript/DiagnosticFormatter';

export interface ICmdArguments
{
    project: string;
}

export interface ICmdOptions
{
    tsOptions: string[];
    astVisitors: string[];
}

@injectable()
export default class Build implements ICommand
{
    public constructor
    (
        @inject(INodeHook) private nodeHook: INodeHook,
        @inject(ITsOsCompiler) private tsOsCompiler: ITsOsCompiler,
        @inject(ICommandLineParser) private tsCliParser: ICommandLineParser,
        @inject(IDiagnosticFormatter) private diagnosticFormatter: IDiagnosticFormatter
    ){}

    public Description: string = "Compiles TypeScript using TsSimpleAst and Ast Visitor Modules.";

    public OnConfigure(config: ICaporalConfig)
    {
        config.argument('project', 'The file path to a tsconfig json file.', caporal.STRING);
        config.option('--ts-options', 'A csv list of arguments / options that are accepted by tsc.', caporal.LIST, [], false);
        config.option('--ast-visitors', 'A csv list of file globs where we might find some visitor modules.', caporal.LIST, [], false);
        config.help('This command is designed to work at a project level, for singular scripts it is assumed you would use the `tsos run` command.');
    }

    public async OnExecute(args: ICmdArguments, options: ICmdOptions, logger: ILogger)
    {
        // Take into account the current working directory for relative paths
        let normalisedProjectPath = args.project.startsWith('/') ? args.project : path.join(process.cwd(), args.project);
        let normalisedVisitors = options.astVisitors.map(_ => _.startsWith('/') ? _ : path.join(process.cwd(), _));

        // Configure the initial ast
        await this.tsOsCompiler.ConfigureAst(normalisedProjectPath, this.tsCliParser.ParseTsOptions(options.tsOptions).options);

        // It is possible that visitors themselves may well be TypeScript files
        // that need compilation first so we register the NodeHook here as well
        // but visitors will get transpiled without any visitors otherwise we
        // find ourselves in circular dependency problem.
        this.nodeHook.Register(options.tsOptions, false);

        // Load up visitors provided by command line or
        // any discovered visitors from tsconfig.
        if (normalisedVisitors.length > 0)
        {
            await this.tsOsCompiler.AddAstVisitors(normalisedVisitors);
        }
        else
        {
            await this.tsOsCompiler.AddAstVisitors(normalisedProjectPath);
        }

        // Run the compilation
        let result = await this.tsOsCompiler.Emit();

        // Check for errors
        let diag = result.getDiagnostics();
        if (diag.length > 0)
        {
            console.error(this.diagnosticFormatter.FormatDiagnostics(diag));
            throw new Error('TypeScript contains errors!');
        }
    }
}
