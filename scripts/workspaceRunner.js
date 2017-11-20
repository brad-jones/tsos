const os = require('os');
const path = require('path');
const execa = require('execa');
const Listr = require('listr');
const yargs = require('yargs').argv;
const listPackages = require('./listPackages').listPackages;

if (process.env['CI']) yargs['verbose'] = true;

new Listr
(
    listPackages().map(package =>
    {
        let pkgPath = path.join(__dirname, '..', 'packages', package);

        return {
            title: package,
            task: (ctx, task) =>
            {
                let proc = execa('yarn', ['run', yargs['_']], { cwd: pkgPath });

                if (yargs['verbose'])
                {
                    proc.stdout.pipe(process.stdout);
                }

                return proc;
            }
        };
    }),
    {
        concurrent: yargs['concurrent'] || os.cpus().length,
        renderer: yargs['verbose'] ? 'verbose' : 'default'
    }
)
.run().catch(e =>
{
    console.error(e);
    process.exit(1);
});
