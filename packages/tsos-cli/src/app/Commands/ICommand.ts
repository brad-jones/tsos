import { ILogger } from 'app/Infrastructure/Logging/ILogger';
import { ICaporalConfig } from 'app/Infrastructure/ICaporalConfig';

export let ICommand = Symbol(__filename);

export interface ICommand
{
    Description?: string;

    OnConfigure(config: ICaporalConfig): void;

    OnExecute(args: { [k: string]: any }, options: { [k: string]: any }, logger: ILogger): Promise<void>;
}
