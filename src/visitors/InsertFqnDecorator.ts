import * as ts from 'typescript';
import * as tspoon from '@brad-jones/tspoon';

/**
 * Inserts the @fqn decorator on method parameters that provides the
 * "fully-qualified-name" of a type reference (ie: An Interface).
 *
 * At runtime we can determine that a particular parameter is meant to be a
 * `node_modules/foo#IBar` or a `../../Contracts#IFoo`. Basically the fqn is
 * just a string that can be used to represent the "type" of an interface that
 * normally does not exist at runtime.
 */
export class InsertFqnDecorator implements tspoon.Visitor
{
    public filter(node: ts.Node): boolean
    {
        return node.kind === ts.SyntaxKind.ClassDeclaration;
    }

    public visit(node: ts.ClassDeclaration, context: tspoon.VisitorContext, traverse: (...visitors: tspoon.Visitor[]) => void)
    {
        traverse
        ({
            filter: (node) =>
            {
                if (node.kind === ts.SyntaxKind.Parameter)
                {
                    let parameterDeclaration = node as ts.ParameterDeclaration;

                    if (typeof parameterDeclaration.type !== 'undefined')
                    {
                        if (parameterDeclaration.type.kind === ts.SyntaxKind.TypeReference)
                        {
                            if (parameterDeclaration.type.getText() !== 'Function')
                            {
                                return true;
                            }
                        }
                    }
                }

                return false;
            },
            visit: (node: ts.ParameterDeclaration, context, traverse) =>
            {
                let fqn: string = null;

                let paramType = node.type.getText();

                let sourceFile: ts.SourceFile = node.getSourceFile();

                tspoon.traverseAst(sourceFile,
                {
                    filter: (node) => node.kind === ts.SyntaxKind.ImportDeclaration,
                    visit: (importDec: ts.ImportDeclaration, context, traverse) =>
                    {
                        let moduleSpecifier = '/' + importDec.moduleSpecifier.getText().replace(/'/g, '');

                        traverse
                        ({
                            filter: (node) => node.kind === ts.SyntaxKind.ImportSpecifier,
                            visit: (importSpecifier: ts.ImportSpecifier, context, traverse) =>
                            {
                                if (importSpecifier.name.getText() === paramType)
                                {
                                    if (typeof importSpecifier.propertyName !== 'undefined')
                                    {
                                        fqn = moduleSpecifier + '#' + importSpecifier.propertyName.getText();
                                    }
                                    else
                                    {
                                        fqn = moduleSpecifier + '#' + importSpecifier.name.getText();
                                    }
                                }
                            }
                        },{
                            filter: (node) => node.kind === ts.SyntaxKind.ImportClause,
                            visit: (importClause: ts.ImportClause, context, traverse) =>
                            {
                                if (importClause.getText().includes('*'))
                                {
                                    let namedBinding = (importClause.namedBindings as any).name.text;

                                    if (paramType.startsWith(namedBinding))
                                    {
                                        fqn = moduleSpecifier + '#' + paramType.replace(namedBinding+'.', '');
                                    }
                                }
                                else
                                {
                                    if (importClause.getText() === paramType)
                                    {
                                        fqn = moduleSpecifier + '#default';
                                    }
                                }
                            }
                        });
                    }
                }, context);

                if (fqn === null)
                {
                    tspoon.traverseAst(sourceFile,
                    {
                        filter: (node) => node.kind === ts.SyntaxKind.ClassDeclaration,
                        visit: (node: ts.ClassDeclaration, context, traverse) =>
                        {
                            let moduleSpecifier = '/' + sourceFile.fileName.replace('/\.tsx?/', '');

                            if (node.name.text === paramType)
                            {
                                fqn = moduleSpecifier + '#' + node.name.text;
                            }
                        }
                    }, context);
                }

                if (fqn !== null)
                {
                    context.insert(node.getStart(), "@tsosDecorators.fqn('"+fqn+"')");
                }
            }
        });
    }
}

export default new InsertFqnDecorator;
