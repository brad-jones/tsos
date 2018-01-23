import chalk from 'chalk';
import * as ts from 'typescript';
import { injectable } from 'inversify';
import { Diagnostic } from 'ts-simple-ast';
import { Implements } from '@brad-jones/tsos-compiler';

export let IDiagnosticFormatter = Symbol(__filename);

export interface IDiagnosticFormatter
{
    FormatDiagnostics(diagnostics: Diagnostic[]): string;
}

export interface IStaticDiagnosticFormatter
{
    new (...args): IDiagnosticFormatter;
}

@injectable()
@Implements<IStaticDiagnosticFormatter>()
export class DiagnosticFormatter
{
    public FormatDiagnostics(diagnostics: Diagnostic[]): string
    {
        // Original formatting code came from:
        // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

        return diagnostics.map(diagnostic =>
        {
            let tsDiagnostic = diagnostic.compilerObject;

            if (tsDiagnostic.file)
            {
                let { line, character } = tsDiagnostic.file.getLineAndCharacterOfPosition(tsDiagnostic.start!);

                let message = ts.flattenDiagnosticMessageText(tsDiagnostic.messageText, '\n');

                let relativeFilePath = tsDiagnostic.file.fileName.replace(process.cwd() + '/', '');

                return `${chalk.italic(relativeFilePath)} (${line + 1},${character + 1}): error ${chalk.bold.bgRed('TS' + tsDiagnostic.code)}: ${chalk.red(message)}`;
            }
            else
            {
                return `${chalk.red(ts.flattenDiagnosticMessageText(tsDiagnostic.messageText, '\n'))}`;
            }
        }).join('\n');
    }
}
