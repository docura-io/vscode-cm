'use strict';
exports.__esModule = true;
exports.Rules = void 0;
var vscode_1 = require("vscode");
var Rules = /** @class */ (function () {
    function Rules() {
    }
    Rules.multilineEnterRules = [
        {
            // e.g. /** | */
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            afterText: /^\s*\*\/$/,
            action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
        }, {
            // e.g. /** ...|
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            action: { indentAction: vscode_1.IndentAction.None, appendText: ' * ' }
        }, {
            // e.g. /*! | */
            beforeText: /^\s*\/\*\!(?!\/)([^\*]|\*(?!\/))*$/,
            afterText: /^\s*\*\/$/,
            action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
        }, {
            // e.g.  * ...|
            beforeText: /^(\t|(\ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
            action: { indentAction: vscode_1.IndentAction.None, appendText: '* ' }
        }, {
            // e.g.  */|
            beforeText: /^(\t|(\ ))*\ \*\/\s*$/,
            action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
        }
    ];
    Rules.endCommentEnterRules = [
        {
            // need to remove an extra space that is added after the end of a comment. 
            beforeText: /\*\//,
            action: {indentAction: vscode_1.IndentAction.Outdent}
        }
    ];
    return Rules;
}());
exports.Rules = Rules;