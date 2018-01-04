import * as caporal from 'caporal';
import { Container } from 'inversify';
import requireGlob = require('require-glob');
import { ICommand } from 'app/Commands/ICommand';
import { ILogger } from 'app/Infrastructure/Logging/ILogger';

(async () =>
{
    // Build the Inversify IoC Container
    let container = new Container();
    container.load.apply(container, await requireGlob
    (
        ['**/InversifyContainerModule.js'],
        {
            reducer: (options, result, fileObject, i, fileObjects) =>
            {
                if (!Array.isArray(result)) result = [];
                result.push(fileObject.exports.default);
                return result;
            }
        }
    ));

    // Build the root level caporal command
    caporal.bin('tsos')
        .version(require(__dirname + '/../../package.json').version)
        .name('Typescript On Steroids')
        .description('CLI Interface for TsOs')
        .logger(container.get<ILogger>(ILogger));

    // Resolve and Register all our Command Classes
    (container['_bindingDictionary']['_map'].get(ICommand) as any[]).forEach(_ =>
    {
        let commandName = _.constraint.metaData.value;
        let commandInstance = container.getNamed<ICommand>(ICommand, commandName);
        let caporalCmdConfig = caporal.command(commandName, commandInstance.Description);
        commandInstance.OnConfigure(caporalCmdConfig);
        caporalCmdConfig.action(commandInstance.OnExecute.bind(commandInstance));
    });

    // Boot the caporal cli app
    await caporal.parse(process.argv);

})()
.catch(err =>
{
    console.error(err);
    process.exit(1);
});
