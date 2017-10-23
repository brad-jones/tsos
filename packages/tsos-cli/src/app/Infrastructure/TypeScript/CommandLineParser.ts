import * as ts from 'typescript';
import { injectable } from 'inversify';
import { Implements } from '@brad-jones/tsos-compiler';

export let ICommandLineParser = Symbol(__filename);

export interface ICommandLineParser
{
    ParseTsOptions(options: string[]): ts.ParsedCommandLine;
}

export interface IStaticCommandLineParser
{
    new (...args): ICommandLineParser;
}

@injectable()
@Implements<IStaticCommandLineParser>()
export class CommandLineParser
{
    public ParseTsOptions(options: string[]): ts.ParsedCommandLine
    {
        let parsedConfig: ts.ParsedCommandLine =
        {
            options: {}, fileNames: [], errors: []
        };

        if (options)
        {
            let cmdLineArgs = [];

            for (let option of options)
            {
                let segments = option.split('=');
                if (segments.length > 1)
                {
                    if (segments[0].length > 1)
                    {
                        cmdLineArgs.push(`--${segments[0]}`);
                    }
                    else
                    {
                        cmdLineArgs.push(`-${segments[0]}`);
                    }

                    cmdLineArgs.push(segments[1]);
                }
                else
                {
                    if (option.length > 1)
                    {
                        cmdLineArgs.push(`--${option}`);
                    }
                    else
                    {
                        cmdLineArgs.push(`-${option}`);
                    }
                }
            }

            parsedConfig = ts.parseCommandLine(cmdLineArgs);
        }

        return parsedConfig;
    }
}
