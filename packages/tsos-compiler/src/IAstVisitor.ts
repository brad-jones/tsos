import TsSimpleAst from "ts-simple-ast";

export let IAstVisitor = Symbol();

export interface IAstVisitor
{
    (ast: TsSimpleAst, ctx?: { [name: string]: any }): void | Promise<void>;
}
