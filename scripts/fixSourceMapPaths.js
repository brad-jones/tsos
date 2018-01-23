const fs = require('mz/fs');
const glob = require('glob');
const yargs = require('yargs').argv;

let sourceMapFilePaths = glob.sync(`${yargs['_']}/**/*.js.map`);

for (let sourceMapFilePath of sourceMapFilePaths)
{
    let origSourceMap = fs.readFileSync(sourceMapFilePath, 'utf8');
    let parsedSourceMap = JSON.parse(origSourceMap);

    let newSourcePaths = [];
    for (let sourcePath of parsedSourceMap['sources'])
    {
        let segments = sourcePath.split('/');
        segments.shift();
        segments.shift();
        newSourcePaths.push(segments.join('/'));
    }
    parsedSourceMap['sources'] = newSourcePaths;

    let newSourceMap = JSON.stringify(parsedSourceMap);
    fs.writeFileSync(sourceMapFilePath, newSourceMap, 'utf8');

    console.log(`Fixed source map path for ${sourceMapFilePath}`);
}
