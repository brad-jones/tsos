const fs = require('fs');
const axios = require('axios');
const shell = require('shelljs');
const lodash = require('lodash');
const Repository = require('lerna/lib/Repository');
const PackageUtilities = require('lerna/lib/PackageUtilities');

(async () =>
{
    let gitUrl = lodash.trim(shell.exec('git config --get remote.origin.url', { silent: true }));
    console.log(`Git URL: ${gitUrl}`);

    let owner = gitUrl.substring(gitUrl.lastIndexOf(':')+1, gitUrl.lastIndexOf('/'));
    console.log(`Owner: ${owner}`);

    let repo = gitUrl.substring(gitUrl.lastIndexOf('/')+1, gitUrl.lastIndexOf('.'));
    console.log(`Repo: ${repo}`);

    let latestTag = lodash.trim
    (
        shell.exec
        (
            'git describe --tags --abbrev=0',
            { silent: true }
        )
    );
    console.log(`Latest Git Tag: ${latestTag}`);

    try
    {
        await axios.get
        (
            `https://github.com/brad-jones/tsos/releases/tag/${latestTag}`,
            {
                validateStatus: (status) => status === 404
            }
        );
    }
    catch (e)
    {
        console.log(`Nothing to do this, release (${latestTag}) already exists.`);
        process.exit(0);
    }

    let secondLastTag = lodash.trim
    (
        shell.exec
        (
            'git describe --abbrev=0 --tags `git rev-list --tags --skip=1 --max-count=1`',
            { silent: true }
        )
    );
    console.log(`Second Last Git Tag: ${secondLastTag}`);

    let latestTagAnchor = `<a name="${latestTag.replace('v', '')}"></a>`;
    let secondLastTagAnchor = `<a name="${secondLastTag.replace('v', '')}"></a>`;

    let changeLog = fs.readFileSync('CHANGELOG.md', 'utf8');

    let latestChangeLog = lodash.trim
    (
        changeLog.substring
        (
            changeLog.lastIndexOf(latestTagAnchor) + latestTagAnchor.length,
            changeLog.lastIndexOf(secondLastTagAnchor)
        )
    ).replace(/#+ \[.*?\](\(.*?\)) \(.*?\)/, '[Click here for the full diff]$1');
    console.log(`\nLatest Changelog:\n---\n${latestChangeLog}\n---\n`);

    let uploads = [];
    for (let package of getPackages())
    {
        let pkg = `@${owner}/${package}@${latestTag.replace('v', '')}`;
        console.log(`Downloading ${pkg}`);
        uploads.push(lodash.trim(shell.exec(`npm pack ${pkg}`, { silent:true })));
    }

    let gitHubReleaseCmd = `\
        node ./node_modules/.bin/github-release upload \
        --owner ${owner} \
        --repo ${repo} \
        --tag ${latestTag} \
        --name ${latestTag} \
        --body "${latestChangeLog}" \
        ${uploads.join(' ')} \
    `;

    shell.exec(gitHubReleaseCmd);

    function getPackages()
    {
        let repo = new Repository(__dirname);

        let packages = PackageUtilities.getPackages
        ({
            rootPath: __dirname, packageConfigs: repo.packageConfigs
        });

        packages = packages.map(pkg => pkg.name).map(name => (name.charAt(0) === '@' ? name.split('/')[1] : name));

        return packages;
    }
})()
.catch(e =>
{
    console.error(e);
    process.exit(1);
});
