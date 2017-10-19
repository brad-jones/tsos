import TsSimpleAst from "ts-simple-ast";

export let IAstVisitor = Symbol();

export interface IAstVisitor
{
    (ast: TsSimpleAst): void | Promise<void>;
}
