import * as ts from 'typescript';
import * as tspoon from '@brad-jones/tspoon';

/**
 * Inserts an import for our special decorators at the top of every source file.
 *
 * NOTE: We do not care about adding this into files that never
 *       use it as TypeScript will tree shake it for us.
 */
export class InsertTsOsDecoratorImport implements tspoon.Visitor
{
    public filter(node: ts.Node): boolean
    {
        return node.kind === ts.SyntaxKind.SourceFile;
    }

    public visit(node: ts.Node, context: tspoon.VisitorContext, traverse: (...visitors: tspoon.Visitor[]) => void)
    {
        context.insertLine(node.getStart(), "import * as tsosDecorators from '@brad-jones/tsos/Decorators';");
    }
}

export default new InsertTsOsDecoratorImport;
