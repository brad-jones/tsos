export type ValidatorFn = (str: string) => any;

export type ValidatorArg = string[]|string|RegExp|ValidatorFn|Number;

export interface ICaporalConfig
{
    help(helpText: string): ICaporalConfig;
    argument(synopsis: string, description: string, validator?: ValidatorArg, defaultValue?: any): ICaporalConfig;
    command(synospis: string, description: string): ICaporalConfig;
    option(synopsis: string, description: string, validator?: ValidatorArg, defaultValue?: any, required?: boolean): ICaporalConfig;
    alias(alias: string): ICaporalConfig;
    strict(value: boolean): ICaporalConfig;
}
