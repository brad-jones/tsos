declare module "repl"
{
    import * as readline from "readline";

    export class REPLServer implements readline.ReadLine
    {
        inputStream: NodeJS.ReadableStream;
        outputStream: NodeJS.WritableStream;
        useColors: boolean;
        commands:
        {
            [command: string]: REPLCommand;
        };
        defineCommand(keyword: string, cmd: REPLCommand | { help: string, action: REPLCommand }): void;
        displayPrompt(preserveCursor?: boolean): void;
        setPrompt(prompt: string): void;
        turnOffEditorMode(): void;
    }

    export type REPLCommand = (this: REPLServer, rest: string) => void;

    export class Recoverable extends SyntaxError
    {
        err: Error;
        constructor(err: Error);
    }
}
