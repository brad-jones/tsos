import * as changeCase from 'change-case';
import requireGlob = require('require-glob');
import { ICommand } from 'app/Commands/ICommand';
import { ContainerModule, interfaces } from 'inversify';

export default new ContainerModule
(
    (bind: interfaces.Bind, unbind: interfaces.Unbind,
    isBound: interfaces.IsBound, rebind: interfaces.Rebind) =>
    {
        function bindAllCommands(modules: any, path: string = ''): void
        {
            for (let moduleName in modules)
            {
                if (typeof modules[moduleName] !== 'function')
                {
                    bindAllCommands
                    (
                        modules[moduleName],
                        path + changeCase.paramCase(moduleName) + ' '
                    );
                }
                else
                {
                    bind<ICommand>(ICommand)
                        .to(modules[moduleName])
                        .whenTargetNamed
                        (
                            path.substr(0, path.length-1)
                                .toLowerCase()
                        );
                }
            }
        }

        bindAllCommands(requireGlob.sync
        ([
            '**/*.js',
            '!ICommand.js',
            '!InversifyContainerModule.js'
        ]));
    }
);
