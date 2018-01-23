import * as path from 'path';
import * as caporal from 'caporal';
import { Diagnostic } from 'ts-simple-ast';
import { inject, injectable } from 'inversify';
import { ICommand } from 'app/Commands/ICommand';
import { getErrorSource } from 'source-map-support';
import { ILogger } from 'app/Infrastructure/Logging/ILogger';
import { ICaporalConfig } from 'app/Infrastructure/ICaporalConfig';
import { INodeHook } from 'app/Infrastructure/TypeScript/NodeHook';
import { IDiagnosticFormatter } from 'app/Infrastructure/TypeScript/DiagnosticFormatter';

export interface ICmdArguments
{
    script: string;
}

export interface ICmdOptions
{
    noCache: boolean;
    tsOptions: string[];
    scriptOptions: string[];
    astVisitors: string[];
    noVisitors: boolean;
}

@injectable()
export default class Run implements ICommand
{
    public constructor
    (
        @inject(INodeHook) private nodeHook: INodeHook,
        @inject(IDiagnosticFormatter) private diagnosticFormatter: IDiagnosticFormatter
    ){}

    public Description: string = "Compiles and Runs TypeScript using TsSimpleAst and Ast Visitor Modules on the fly.";

    public OnConfigure(config: ICaporalConfig)
    {
        config.argument('script', 'The TypeScript file to run.', caporal.STRING);
        config.option('--no-cache', 'If set transpilation cache will be disabled.', caporal.BOOLEAN, false);
        config.option('--ts-options', 'A csv list of arguments / options that are accepted by tsc.', caporal.LIST, [], false);
        config.option('--script-options', 'A csv list of arguments / options that are accepted by the script being run.', caporal.LIST, [], false);
        config.option('--ast-visitors', 'A csv list of file globs where we might find some visitor modules.', caporal.LIST, [], false);
        config.option('--no-visitors', 'If set, no auto discovered visitors will be applied.', caporal.BOOLEAN, false);
    }

    public async OnExecute(args: ICmdArguments, options: ICmdOptions, logger: ILogger)
    {
        // Take into account the current working directory for relative paths
        let normalisedScriptPath = args.script.startsWith('/') ? args.script : path.join(process.cwd(), args.script);
        let normalisedVisitors = options.astVisitors.map(_ => _.startsWith('/') ? _ : path.join(process.cwd(), _));

        // This is what makes typescript files get compiled on the fly.
        this.nodeHook.Register(options.tsOptions, options.noVisitors || normalisedVisitors, !options.noCache);

        // Add the script options into argv
        if (options.scriptOptions)
        {
            process.argv.splice(process.argv.findIndex(_ => _ === '--script-options'), 2);

            for (let scriptOption of options.scriptOptions)
            {
                let segments = scriptOption.split('=');
                if (segments.length > 1)
                {
                    if (segments[0].length === 1)
                    {
                        process.argv.push(`-${segments[0]} ${segments[1]}`);
                    }
                    else
                    {
                        process.argv.push(`--${segments[0]} ${segments[1]}`);
                    }
                }
                else
                {
                    if (scriptOption.length === 1)
                    {
                        process.argv.push(`-${scriptOption}`);
                    }
                    else
                    {
                        process.argv.push(`--${scriptOption}`);
                    }
                }
            }
        }

        // Exceptions get swallowed if we do not wrap the require here.
        try
        {
            require(normalisedScriptPath);
        }
        catch (e)
        {
            let mappedError = getErrorSource(e);
            if (mappedError) console.error(mappedError);

            if (Array.isArray(e) && e[0] instanceof Diagnostic)
            {
                console.error(this.diagnosticFormatter.FormatDiagnostics(e));
            }
            else
            {
                console.error(e);
            }

            process.exit(1);
        }
    }
}
