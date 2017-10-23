export let ILogger = Symbol(__filename);

export interface ILogger
{
    debug(str: string): void;
    info(str: string): void;
    log(str: string): void;
    warn(str: string): void;
    error(str: string): void;
}
