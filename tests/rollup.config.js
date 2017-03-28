export default
{
    entry: './subjects/TwoNames.ts',
    dest: './output/TwoNamesBundle.js',
    sourceMap: true,
    format: 'cjs',
    plugins:
    [
        require('../dist/rollup-plugin-tsos').default
        ({
            visitors:
            [
                './visitors/*.js'
            ]
        })
    ]
};
