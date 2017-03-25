import * as fs from 'fs';
import * as requireDir from 'require-dir';

import { TranspilerOutput, Visitor, transpile as tspoonTranspile } from 'tspoon';

import { convertCompilerOptionsFromJson } from 'typescript';
import { loadSync } from 'tsconfig';

export function transpile(filePath: string): TranspilerOutput
{
    // TODO: filePath might need adjusting for both loadSync and convertCompilerOptionsFromJson

    let tsConfig = loadSync(filePath);
    let tsCompilerOptions = convertCompilerOptionsFromJson(tsConfig.config.compilerOptions, filePath).options;

    let visitorsMap: {[index:string]:{default:Visitor}} = requireDir(tsConfig.config.tspoon.vistors, { recurse: true });
    let visitorsArray: Visitor[] = Object.keys(visitorsMap).map(key => visitorsMap[key].default);

    return tspoonTranspile(fs.readFileSync(filePath).toString('utf8'),
    {
        sourceFileName: filePath,
        compilerOptions: tsCompilerOptions,
        visitors: visitorsArray
    });
}
