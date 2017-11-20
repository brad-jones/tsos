const github = require('octonode');
const yargs = require('yargs').argv;

github.client(process.env['GITHUB_TOKEN']).repo('brad-jones/tsos')
.pr({"title": yargs['title'], "head": yargs['head'], "base": yargs['base']}, (result) =>
{
    if (result.body && result.body.errors)
    {
        console.log(result.body);
        process.exit(1);
    }
});
