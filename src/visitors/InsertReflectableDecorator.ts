import * as ts from 'typescript';
import * as tspoon from '@brad-jones/tspoon';

/**
 * Inserts the @reflectable decorator to every node that TypeScript
 * will "emitDecoratorMetadata" for, such that we have access to this
 * information at runtime even though we may not have explicity added
 * another decorator manually.
 */
export class InsertReflectableDecorator implements tspoon.Visitor
{
    public filter(node: ts.Node): boolean
    {
        return (
            node.kind === ts.SyntaxKind.ClassDeclaration ||
            node.kind === ts.SyntaxKind.MethodDeclaration ||
            node.kind === ts.SyntaxKind.PropertyDeclaration ||
            node.kind === ts.SyntaxKind.GetAccessor ||
            node.kind === ts.SyntaxKind.SetAccessor
        );
    }

    public visit(node: ts.Node, context: tspoon.VisitorContext, traverse: (...visitors: tspoon.Visitor[]) => void)
    {
        context.insertLine(node.getStart(), "@tsosDecorators.reflectable");
    }
}

export default new InsertReflectableDecorator;
