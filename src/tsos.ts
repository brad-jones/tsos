import * as fs from 'fs';
import * as path from 'path';
import * as requireDir from 'require-dir';
import * as ts from 'typescript';

import { TranspilerOutput, Visitor, transpile as tspoonTranspile } from 'tspoon';

export function transpile(filePath: string, configName?: string): TranspilerOutput
{
    // TODO: This all needs to be cached.
    let tsConfigFileName = fs.realpathSync(ts.findConfigFile(path.dirname(filePath), ts.sys.fileExists, configName));
    let tsConfigParsedJson = ts.parseConfigFileTextToJson(tsConfigFileName, ts.sys.readFile(tsConfigFileName)).config;
    let tsConfig = ts.parseJsonConfigFileContent(tsConfigParsedJson, ts.sys, path.dirname(tsConfigFileName), null, tsConfigFileName);
    tsConfig.options.declaration = false;

    // TODO: This needs to be fleshed out further to use "glob" pattens.
    // It also needs some sort of "node module resolution" logic written.
    // And cached as well.
    let visitorsArray: Visitor[] = [];
    if (typeof tsConfig.raw.tsos !== 'undefined' && typeof tsConfig.raw.tsos.visitors !== 'undefined')
    {
        let visitorsMap: {[index:string]:{default:Visitor}} = requireDir(tsConfig.raw.tsos.visitors, { recurse: true });
        let visitorsArray: Visitor[] = Object.keys(visitorsMap).map(key => visitorsMap[key].default);
    }

    return tspoonTranspile(ts.sys.readFile(filePath),
    {
        sourceFileName: filePath,
        compilerOptions: tsConfig.options,
        visitors: visitorsArray
    });
}
