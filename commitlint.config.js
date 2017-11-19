const fs = require('fs');
const path = require('path');
const glob = require('glob');

module.exports =
{
    extends:
    [
        '@commitlint/config-angular'
    ],
    rules:
    {
        'scope-enum': () => [2, 'always', (() =>
        {
            let scopes = ['solution'];

            let pkg = require(path.join(__dirname, 'package.json'));

            for (let workspaceGlob of pkg.workspaces)
            {
                let packagePaths = glob.sync(path.join(__dirname, workspaceGlob));

                for (let packagePath of packagePaths)
                {
                    let segments = packagePath.split('/');
                    scopes.push(segments[segments.length - 1]);
                }
            }

            return scopes;
        })()]
    }
};
