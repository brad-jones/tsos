#!/usr/bin/env node

import 'reflect-metadata';

/**
 * Overload the node.js module loader.
 *
 * This code makes the runtime module loader match our design time typescript
 * module resolution settings. The idea being that importing "app/Some/Module"
 * is much better than "../../Some/Module".
 */
(function()
{
    var Module = require('module');
    var originalRequire = Module.prototype.require;
    Module.prototype.require = function()
    {
        if (arguments[0].startsWith('app/'))
        {
            arguments[0] = __dirname + '/' + arguments[0];
        }

        return originalRequire.apply(this, arguments);
    };
})();

// Now hand off to the main application
require('app/Program');
