import * as ts from 'typescript';
import { EmitResult as TsSimpleAstEmitResult, Diagnostic } from "ts-simple-ast";

export class EmitResult
{
    constructor
    (
        private readonly _tsSimpleAstEmitResult: TsSimpleAstEmitResult,
        private readonly _compilerDiagnostics: Diagnostic[]
    ){}

    /**
     * TypeScript compiler emit result.
     */
    public get compilerObject(): ts.EmitResult
    {
        return this._tsSimpleAstEmitResult.compilerObject;
    }

    /**
     * If the emit was skipped.
     */
    public getEmitSkipped(): boolean
    {
        return this._tsSimpleAstEmitResult.getEmitSkipped();
    }

    /**
     * Contains declaration emit diagnostics + compiler diagnostics.
     */
    public getDiagnostics(): Diagnostic[]
    {
        return this._tsSimpleAstEmitResult.getDiagnostics().concat(this._compilerDiagnostics);
    }
}
