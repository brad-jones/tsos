import * as fs from 'fs';

import { transpile } from '../dist/tsos';

test('transpiles typescript using tspoon', () =>
{
    expect(transpile(__dirname + '/../src/tsos.ts').code)
    .toBe(fs.readFileSync(__dirname + '/../dist/tsos.js').toString('utf8'));
});
