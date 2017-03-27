"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
exports.default = new class {
    filter(node) {
        return node.kind === ts.SyntaxKind.PropertyDeclaration && node.modifiers
            && node.modifiers.some(m => m.kind === ts.SyntaxKind.PrivateKeyword);
    }
    visit(node, context, traverse) {
        context.replace(node.getStart(), node.getEnd(), '');
    }
};
//# sourceMappingURL=remove-privates.js.map