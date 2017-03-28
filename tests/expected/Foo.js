"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const tsosDecorators = require("@brad-jones/tsos/Decorators");
const IBar_1 = require("./IBar");
let Foo = class Foo {
    foo(bar) {
        console.log('THIS IS FOO');
    }
};
tslib_1.__decorate([
    tsosDecorators.reflectable,
    tslib_1.__param(0, tsosDecorators.fqn('/./IBar#IBar')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof IBar_1.IBar !== "undefined" && IBar_1.IBar) === "function" && _a || Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Foo.prototype, "foo", null);
Foo = tslib_1.__decorate([
    tsosDecorators.reflectable
], Foo);
exports.Foo = Foo;
var _a;
//# sourceMappingURL=Foo.js.map
