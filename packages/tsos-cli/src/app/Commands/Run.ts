import caporal = require('caporal');
import { spawn } from 'child_process';
import { injectable } from 'inversify';
import { ICommand } from 'app/Commands/ICommand';
import { ILogger } from 'app/Infrastructure/Logging/ILogger';
import { ICaporalConfig } from 'app/Infrastructure/ICaporalConfig';

export interface ICmdArguments
{
    script: string;
}

export interface ICmdOptions
{
    noCache: boolean;
    tsOptions: string | undefined;
    nodeOptions: string[] | undefined;
    astVisitors: string | undefined;
    noVisitors: boolean;
}

@injectable()
export default class Run implements ICommand
{
    public Description: string = "Compiles and Runs TypeScript using TsSimpleAst and Ast Visitor Modules on the fly.";

    public OnConfigure(config: ICaporalConfig)
    {
        config.argument('script', 'The TypeScript file to run.', caporal.STRING);
        config.option('--no-cache', 'If set transpilation cache will be disabled.', caporal.BOOLEAN, false);
        config.option('--ts-options', 'A csv list of arguments / options that are accepted by tsc.', caporal.STRING, undefined, false);
        config.option('--node-options', 'A csv list of arguments / options that are accepted by node.', caporal.LIST, undefined, false);
        config.option('--ast-visitors', 'A csv list of file globs where we might find some visitor modules.', caporal.STRING, undefined, false);
        config.option('--no-visitors', 'If set, no auto discovered visitors will be applied.', caporal.BOOLEAN, false);
    }

    public async OnExecute(args: ICmdArguments, options: ICmdOptions, logger: ILogger)
    {
        let procArgs: string[] = [];

        // Add any custom node options to the list of arguments
        // that will be passed to the child node process.
        if (options.nodeOptions)
        {
            for (let nodeOption of options.nodeOptions)
            {
                let segments = nodeOption.split('=');
                if (segments.length > 1)
                {
                    procArgs.push(`--${segments[0]} ${segments[1]}`);
                }
                else
                {
                    procArgs.push(nodeOption);
                }
            }
        }

        // Tell the child node process to execute the "Runner" command
        procArgs.push(__dirname + '/../../index.js');
        procArgs.push('runner');

        // Proxy arguments and options through to the runner.
        procArgs.push(args.script);
        if (options.noCache) procArgs.push('--no-cache');
        if (options.noVisitors) procArgs.push('--no-visitors');
        if (options.tsOptions) { procArgs.push('--ts-options'); procArgs.push(options.tsOptions); }
        if (options.astVisitors) { procArgs.push('--ast-visitors'); procArgs.push(options.astVisitors); }

        // Spawn the child node process
        let proc = spawn(process.execPath, procArgs, { stdio: 'inherit' });
        proc.on('exit', function (code: number, signal: string)
        {
            process.on('exit', function ()
            {
                if (signal)
                {
                    process.kill(process.pid, signal)
                }
                else
                {
                    process.exit(code)
                }
            });
        });
    }
}
