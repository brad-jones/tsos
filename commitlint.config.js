const Repository = require('lerna/lib/Repository');

function getPackages()
{
    let packages = (new Repository(process.cwd())).packages
        .map(pkg => pkg.name)
        .map(name => (name.charAt(0) === '@' ? name.split('/')[1] : name));

    packages.push('root');

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
