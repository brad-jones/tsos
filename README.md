# TypeScript on Steroids
[![Build Status](https://travis-ci.org/brad-jones/tsos.svg?branch=master)](https://travis-ci.org/brad-jones/tsos)
[![Coverage Status](https://coveralls.io/repos/github/brad-jones/tsos/badge.svg?branch=master)](https://coveralls.io/github/brad-jones/tsos?branch=master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

__So if TypeScript is JavaScript on Steroids, this project is, well you get the idea...__

## No really what is this?
In short this provides, [ts-node](https://github.com/TypeStrong/ts-node) +
[tspoon](https://github.com/wix/tspoon) in one executable but it is so much more.

TypeScript is awesome however it does lack some features from more established
programming languages. Reflection is one such feature that I am always wishing
was more powerful. This is not so much a TypeScript issue, it's more to do with
the fact that TypeScript is just JavaScript and Js is very poor in this area.

With [tspoon](https://github.com/wix/tspoon) we can effectively extend the
TypeScript language to support some of these concepts. For example automatically
applying a `@decorator` to every class so that _design time_ meta data is output
by the TypeScript transpiler.

But now we have non portable TypeScript source code. This project aims to solve
this problem by making _tspoon vistors_ shareable between TypeScript code bases.

## Reflection vs Transpilation
Intially I started this project with the idea of sharing my existing
_tspoon vistors_ that make reflection more powerful in TypeScript.

But then I got thinking that there are situations that instead of using a
reflective model to build some dynamic object at run time. Perhaps we can get
the same end result by simply applying more transpilations.

See this example:

```ts
import 'reflect-metadata';
import * as commander from 'commander';
import { paramCase } from 'change-case';

// This class represents our commander cli application.
class Foo
{
    public fooBar(someValue: string)
    {
        console.log('fooBar says: ' + someValue);
    }
    
    public barFoo()
    {
        console.log('Hello from barFoo');
    }
    
    public barFooQuz()
    {
        console.log('Hello from barFooQuz');
    }
}

// This code uses reflection to configure commander for us.
let foo = new Foo;
for (let name of Object.getOwnPropertyNames(Object.getPrototypeOf(foo)))
{
    let method = foo[name];
    
    // Ignore the constructor
    if (!(method instanceof Function) || method === Foo) continue;
    
    commander
    .command(paramCase(name).replace('-', ':'))
    //.description( TODO: We could use a decorator to provide this. )
    .action(method);
}

commander.parse(process.argv);
```

So using some imagination, it wouldn't be too much of a stretch to see how one
might transpile the typescript class directly into commander calls.

Thinking about this concept further one might end up with TypeScript packages,
such as an Inversion of Control container, that implement some of their logic at
runtime as well as at transpilation time through tspoon vistors.
