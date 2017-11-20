let packages = require('./scripts/listPackages').listPackages();
packages.push('solution');

module.exports =
{
    extends:
    [
        '@commitlint/config-angular'
    ],
    rules:
    {
        'scope-enum': () => [2, 'always', packages]
    }
};
