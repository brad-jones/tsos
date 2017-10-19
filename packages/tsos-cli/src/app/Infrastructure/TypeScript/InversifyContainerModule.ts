import { ContainerModule, interfaces } from 'inversify';
import { INodeHook, NodeHook } from 'app/Infrastructure/TypeScript/NodeHook';
import { ICommandLineParser, CommandLineParser } from 'app/Infrastructure/TypeScript/CommandLineParser';
import { ITsConfigLoader, TsConfigLoader, ITsOsCompiler, TsOsCompiler, IAstVisitorFinder, AstVisitorFinder } from '@brad-jones/tsos-compiler';

export default new ContainerModule
(
    (bind: interfaces.Bind, unbind: interfaces.Unbind,
    isBound: interfaces.IsBound, rebind: interfaces.Rebind) =>
    {
        bind<INodeHook>(INodeHook).to(NodeHook);
        bind<ITsOsCompiler>(ITsOsCompiler).to(TsOsCompiler);
        bind<ITsConfigLoader>(ITsConfigLoader).to(TsConfigLoader);
        bind<IAstVisitorFinder>(IAstVisitorFinder).to(AstVisitorFinder);
        bind<ICommandLineParser>(ICommandLineParser).to(CommandLineParser);
    }
);
