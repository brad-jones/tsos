import * as path from 'path';
import caporal = require('caporal');
import { inject, injectable } from 'inversify';
import { ICommand } from 'app/Commands/ICommand';
import { getErrorSource } from 'source-map-support';
import { ILogger } from 'app/Infrastructure/Logging/ILogger';
import { ICaporalConfig } from 'app/Infrastructure/ICaporalConfig';
import { INodeHook } from 'app/Infrastructure/TypeScript/NodeHook';

export interface ICmdArguments
{
    script: string;
}

export interface ICmdOptions
{
    noCache: boolean;
    tsOptions: string[];
    astVisitors: string[];
    noVisitors: boolean;
}

@injectable()
export default class Runner implements ICommand
{
    public constructor
    (
        @inject(INodeHook) private nodeHook: INodeHook
    ){}

    public Description: string = "This command is executed by the `Run` command as a child process.";

    public OnConfigure(config: ICaporalConfig)
    {
        config.argument('script', 'The TypeScript file to run.', caporal.STRING);
        config.option('--no-cache', 'If set transpilation cache will be disabled.', caporal.BOOLEAN, false);
        config.option('--ts-options', 'A csv list of arguments / options that are accepted by tsc.', caporal.LIST, [], false);
        config.option('--ast-visitors', 'A csv list of file globs where we might find some visitor modules.', caporal.LIST, [], false);
        config.option('--no-visitors', 'If set, no auto discovered visitors will be applied.', caporal.BOOLEAN, false);
        config.help('Hot Tip: If you do not need to provide any custom options to node, call this command directly to boost performance.');
    }

    public async OnExecute(args: ICmdArguments, options: ICmdOptions, logger: ILogger)
    {
        // Take into account the current working directory for relative paths
        let normalisedScriptPath = args.script.startsWith('/') ? args.script : path.join(process.cwd(), args.script);
        let normalisedVisitors = options.astVisitors.map(_ => _.startsWith('/') ? _ : path.join(process.cwd(), _));

        // This is what makes typescript files get compiled on the fly.
        this.nodeHook.Register(options.tsOptions, options.noVisitors || normalisedVisitors, !options.noCache);

        // Exceptions get swallowed if we do not wrap the require here.
        try
        {
            require(normalisedScriptPath);
        }
        catch (e)
        {
            console.log(getErrorSource(e));
            console.error(e);
        }
    }
}
