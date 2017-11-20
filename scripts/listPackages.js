const path = require('path');
const glob = require('glob');

exports.listPackages = () =>
{
    let packages = [];

    let pkg = require(path.join(__dirname, '..', 'package.json'));

    for (let workspaceGlob of pkg.workspaces)
    {
        let packagePaths = glob.sync(path.join(__dirname, '..', workspaceGlob));

        for (let packagePath of packagePaths)
        {
            let segments = packagePath.split('/');
            packages.push(segments[segments.length - 1]);
        }
    }

    return packages;
};
