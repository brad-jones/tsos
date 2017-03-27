import * as ts from 'typescript';
import * as tspoon from '@brad-jones/tspoon';

// a simple proof of concept transformation, that deletes private class properties.
export default new class implements tspoon.Visitor
{
    public filter(node: ts.Node): boolean
    {
        return node.kind === ts.SyntaxKind.PropertyDeclaration && node.modifiers
        && node.modifiers.some(m => m.kind === ts.SyntaxKind.PrivateKeyword);
    }

    public visit(node: ts.ClassDeclaration, context: tspoon.VisitorContext, traverse: (...visitors: tspoon.Visitor[]) => void)
    {
        context.replace(node.getStart(), node.getEnd(), '');
    }
}
