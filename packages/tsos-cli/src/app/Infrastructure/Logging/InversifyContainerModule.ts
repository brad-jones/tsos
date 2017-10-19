import caporalLogger = require('caporal/lib/logger');
import { ContainerModule, interfaces } from 'inversify';
import { ILogger } from 'app/Infrastructure/Logging/ILogger';

export default new ContainerModule
(
    (bind: interfaces.Bind, unbind: interfaces.Unbind,
    isBound: interfaces.IsBound, rebind: interfaces.Rebind) =>
    {
        bind<ILogger>(ILogger).toConstantValue(caporalLogger.createLogger());
    }
);
