'use strict';

import { workspace, DecorationRenderOptions } from "vscode";
import { cmConfig } from "./cmConfig";

var vscode = require("vscode");

export class CmTextParser {
    private tags;
    private blockCommentStart:string;
    private blockCommentEnd:string;

    /**
     * Constructor
     * @cmConfig config 
     */
    constructor(config:cmConfig) {        
        this.tags = [];
        this.blockCommentStart = "\/\\\*\\*";
        this.blockCommentEnd = "\\*/";
        this.setTags();
    }

    
    /**
     * Set tags.
     * 
     * This is uese to add the different block comment regex styles. 
     */
    public setTags() {
        
        var contributions = workspace.getConfiguration('cm');
        const vscode = require('vscode');
        var items = contributions.tags;
        for (var _i = 0, itemsOne = items; _i < itemsOne.length; _i++) {
            var item = itemsOne[_i];
            var options : DecorationRenderOptions = { color: item.color, backgroundColor: item.backgroundColor };
            
            var escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, '\\$1');
            
            this.tags.push({
                tag: item.tag,
                escapedTag: escapedSequence.replace(/\//gi, "\\/"),
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(options)
            });                        
        }
    }


    /**
     * Check If In Comment.
     * 
     * Takes the current location of the cursor, and uses regex to determine if that location is within
     * a block comment. 
     */
    public checkIfInComment(activeEditor, changedIndex) {

        var text = activeEditor.document.getText();
        // Build up regex matcher for custom delimiter tags
        var characters = [];
        for (var _i = 0, _a = this.tags; _i < _a.length; _i++) {
            var commentTag = _a[_i];
            characters.push(commentTag.escapedTag);
        }
        // Combine custom delimiters and the rest of the comment block matcher
        var commentMatchString = "(^)+([ \\t]*[ \\t]*)(";
        commentMatchString += characters.join("|");
        commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";
        // Use start and end delimiters to find block comments
        var regexString = "(^|[ \\t])(";
        regexString += this.blockCommentStart;
        // adding this so that the title comments are accepted. /******.... 
        regexString += "\\*\*"
        regexString += "[\\s])+([\\s\\S]*?)(";
        regexString += this.blockCommentEnd;
        
        regexString += ")";
        var regEx = new RegExp(regexString, "gm");
        var commentRegEx = new RegExp(commentMatchString, "igm");

        var match;
        while (match = regEx.exec(text)) {

            var commentBlock = match[0];
            var line = void 0;
            var _loop_1 = function () {
                var startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
                if (startPos.line === changedIndex.line || changedIndex.line === startPos.line - 1) {
                    return true;
                }
            };
            var this_1 = this;
            while (line = commentRegEx.exec(commentBlock)) {
                if(_loop_1()) {
                    return true;
                }
            }
        }
        return false;
    };
}