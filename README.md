# TypeScript on Steroids
[![CircleCI](https://circleci.com/gh/brad-jones/tsos/tree/develop.svg?style=svg)](https://circleci.com/gh/brad-jones/tsos/tree/develop)
[![codecov](https://codecov.io/gh/brad-jones/tsos/branch/develop/graph/badge.svg)](https://codecov.io/gh/brad-jones/tsos)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

__So if TypeScript is JavaScript on Steroids, this project is, well you get the idea...__

## No really what is this?
In short this provides, [ts-node](https://github.com/TypeStrong/ts-node) +
[ts-simple-ast](https://github.com/dsherret/ts-simple-ast) in one executable
but it is so much more.

> NOTE: v1 of tsos was based on https://github.com/wix/tspoon  
> Read more about it's deprecation here: https://github.com/wix/tspoon/issues/136

TypeScript is awesome however it does lack some features from more established
programming languages. Reflection is one such feature that I am always wishing
was more powerful. This is not so much a TypeScript issue, it's more to do with
the fact that TypeScript is just JavaScript and Js is very poor in this area.

With [ts-simple-ast](https://github.com/dsherret/ts-simple-ast) we can
effectively extend the TypeScript language to support some of these concepts.
For example automatically applying a `@decorator` to every class so that
_design time_ meta data is output by the TypeScript transpiler.

But now we have non portable TypeScript source code. This project aims to solve
this problem by making _ts-simple-ast vistor modules_ shareable between
TypeScript code bases.

## Reflection vs Transpilation
Intially I started this project with the idea of sharing my existing
_tspoon vistors_ that make reflection more powerful in TypeScript.

But then I got thinking that there are situations that instead of using a
reflective model to build some dynamic object at run time. Perhaps we can get
the same end result by simply applying more transpilations.

I wrote the above in v1, now some 12 or so months later in v2 this exactly what
I am doing in my TypeScript projects, basically you do all your reflection at
build time using the AST, before that very rich type information is discarded.

## Project Structure
We are now running a [lerna](https://lernajs.io/) monorepo setup.

> NOTE: This is likely to change, I miss [semantic release](https://github.com/semantic-release/semantic-release).
  Plus I think Npm Org's match up nicely with Github Org's, release notes and
  version tags then make more sence, etc. Kind of thinking lerna + git submodules
  but better :)

- __@brad-jones/tsos-compiler:__ This is the brains of the operation.
  Essentially it is a very simple layer over the top of `TsSimpleAst`.
  If you want to use tsos programatically this is the project you want.

- __@brad-jones/tsos-cli:__ This package exposes the compiler via a console
  application. It currently provides 2 main sub commands.

  - _run:_ A [ts-node](https://github.com/TypeStrong/ts-node) like execution
    environment but uses the `tsos-compiler` to compile TypeScript with visitors
    on the fly.
  
  - _build:_ A project based build tool using `tsos-compiler`.

- __@brad-jones/tsos-visitors:__ This is (or will be) a collection of core tsos
  visitors. This package is completely optional, only install it if you have
  a need for one of the visitor modules, otherwise write your own.
