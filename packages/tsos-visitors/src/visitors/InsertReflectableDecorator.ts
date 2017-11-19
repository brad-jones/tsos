import * as ts from 'typescript';
import { IAstVisitor } from '@brad-jones/tsos-compiler';
import { TypeGuards, DecoratableNode } from 'ts-simple-ast';

export function reflectable(constructor: Function){}

// dfhghgf


let InsertReflectableDecorator: IAstVisitor = (ast) =>
{
    ast.getSourceFiles().filter(_ => !_.getFilePath().includes('.d.ts')).forEach(srcFile =>
    {
        let addedDecorator = false;

        let decoratableNodes: DecoratableNode[] = srcFile.getDescendants()
            .filter(_ => TypeGuards.isDecoratableNode(_)) as any;

        decoratableNodes.filter(_ => _.getDecorators().length === 0).forEach(node =>
        {
            try
            {
                node.addDecorator({ name: 'reflectable' });
                addedDecorator = true;
            }
            catch (e)
            {
                // fail silently, there are a large number of cases that
                // cause exceptions, for some reason standalone function
                // parameters are considered decoratable
            }
        });

        if (addedDecorator)
        {
            srcFile.addImport
            ({
                namedImports:[{ name: 'reflectable' }],
                moduleSpecifier: '@brad-jones/tsos-visitors'
            });
        }
    });
};

export default InsertReflectableDecorator;
