const Repository = require('lerna/lib/Repository');
const PackageUtilities = require('lerna/lib/PackageUtilities');

function getPackages()
{
    let repo = new Repository(__dirname);

    let packages = PackageUtilities.getPackages
    ({
        rootPath: __dirname, packageConfigs: repo.packageConfigs
    });

    packages = packages.map(pkg => pkg.name).map(name => (name.charAt(0) === '@' ? name.split('/')[1] : name));
    packages.push('solution');

    return packages;
}

module.exports =
{
    extends:
    [
        '@commitlint/config-angular'
    ],
    rules: {
        'scope-enum': () => [2, 'always', getPackages()]
    }
};
