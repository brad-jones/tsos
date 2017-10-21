import * as path from 'path';
import caporal = require('caporal');
import { inject, injectable } from 'inversify';
import { ICommand } from 'app/Commands/ICommand';
import { ITsOsCompiler } from '@brad-jones/tsos-compiler';
import { ILogger } from 'app/Infrastructure/Logging/ILogger';
import { ICaporalConfig } from 'app/Infrastructure/ICaporalConfig';
import { ICommandLineParser } from 'app/Infrastructure/TypeScript/CommandLineParser';

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
        @inject(ITsOsCompiler) private tsOsCompiler: ITsOsCompiler,
        @inject(ICommandLineParser) private tsCliParser: ICommandLineParser
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

        // Configure the intial ast
        await this.tsOsCompiler.ConfigureAst(normalisedProjectPath, this.tsCliParser.ParseTsOptions(options.tsOptions).options);

        // Load up visitors provided by command line and any discovered visitors from installed npm packages.
        await Promise.all
        ([
            this.tsOsCompiler.AddAstVisitors(normalisedVisitors),
            this.tsOsCompiler.AddAstVisitors(path.dirname(normalisedProjectPath))
        ]);

        // Run the compilation
        let result = await this.tsOsCompiler.Emit();

        // Check for errors
        let diag = result.getDiagnostics();
        if (diag.length > 0) throw diag;
    }
}