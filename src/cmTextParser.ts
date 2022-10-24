'use strict';

import { workspace, DecorationRenderOptions } from "vscode";
import { cmConfig } from "./cmConfig";

var vscode = require("vscode");

export class CmTextParser {
    private tags;
    private blockCommentStart:string;
    private blockCommentEnd:string;
    private highlightSingleLineComments:boolean;
    private isPlainText:boolean;
    private expression:string;
    private supportedLanguage:boolean;
    private ignoreFirstLine:boolean;
    private config:cmConfig;
    private delimiter:string;

    /**
     * Constructor
     * @cmConfig config 
     */
    constructor(config:cmConfig) {        
        this.tags = [];
        this.blockCommentStart = "\/\\\*\\*";
        this.blockCommentEnd = "\\*/";
        this.highlightSingleLineComments = true;
        this.isPlainText = false;
        this.expression="";
        this.config = config;
        this.delimiter = "";
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
            
            options.textDecoration = "";
            if (item.strikethrough) {                
                options.textDecoration += "line-through";
            }
            if (item.underline) {
                options.textDecoration += " underline";
            }
            if (item.bold) {
                options.fontWeight = "bold";
            }
            if (item.italic) {
                options.fontStyle = "italic";
            }

            var escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, '\\$1');
            
            this.tags.push({
                tag: item.tag,
                escapedTag: escapedSequence.replace(/\//gi, "\\/"),
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(options)
            });                        
        }
    }

    public ApplyDecorations(activeEditor) {
        for (var _i = 0, _a = this.tags; _i < _a.length; _i++) {
            var tag = _a[_i];
            activeEditor.setDecorations(tag.decoration, tag.ranges);
            // clear the ranges for the next pass
            tag.ranges.length = 0;
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
        regexString += "\\*\*";
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


    public setDelimiter(languageCode) {
        this.supportedLanguage = false;
        this.ignoreFirstLine = false;
        this.isPlainText = false;
        var config = this.config.GetCommentConfiguration(languageCode);
        if (config) {
            var blockCommentStart = config.blockComment ? config.blockComment[0] : null;
            var blockCommentEnd = config.blockComment ? config.blockComment[1] : null;
            this.setCommentFormat(config.lineComment || blockCommentStart, blockCommentStart, blockCommentEnd);
            this.supportedLanguage = true;
        }        
    };


    private setCommentFormat = function (singleLine, start, end) {
        var _this = this;
        if (start === void 0) { start = null; }
        if (end === void 0) { end = null; }
        this.delimiter = "";
        this.blockCommentStart = "";
        this.blockCommentEnd = "";
        // If no single line comment delimiter is passed, single line comments are not supported
        if (singleLine) {
            
            if (typeof singleLine === 'string') {                
                this.delimiter = this.escapeRegExp(singleLine).replace(/\//ig, "\\/");                
            }
            else if (singleLine.length > 0) {                
                // * if multiple delimiters are passed, the language has more than one single line comment format
                var delimiters = singleLine
                    .map(function (s) { return _this.escapeRegExp(s); })
                    .join("|");
                this.delimiter = delimiters;
            }
        }
        else {
            this.highlightSingleLineComments = false;
        }
        
        if (start && end) {
            this.blockCommentStart = this.escapeRegExp(start);
            this.blockCommentEnd = this.escapeRegExp(end);
        }
    };


    public escapeRegExp(input) {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }


    public SetRegex(languageCode) {        
        var contributions = workspace.getConfiguration('cm');      
        this.setDelimiter(languageCode);
        
        // if the language isn't supported, we don't need to go any further
        if (!this.supportedLanguage) {
            
            return;
        }
        var characters = [];
        for (var _i = 0, _a = this.tags; _i < _a.length; _i++) {
            var commentTag = _a[_i];
            characters.push(commentTag.escapedTag);
        }
        
        if (this.isPlainText && contributions.highlightPlainText) {
            // start by tying the regex to the first character in a line
            this.expression = "(^)+([ \\t]*[ \\t]*)";
        }
        else {
            // start by finding the delimiter (//, --, #, ') with optional spaces or tabs
            this.expression = "(" + this.delimiter + ")+( |\t)*";
        }
        // Apply all configurable comment start tags
        this.expression += "(";
        this.expression += characters.join("|");
        this.expression += ")+(.*)";        
    };


    public FindSingleLineComments(activeEditor) {
        
        if (!this.highlightSingleLineComments) {
            return;
        }

        var text = activeEditor.document.getText();
        // if it's plain text, we have to do mutliline regex to catch the start of the line with ^
        var regexFlags = (this.isPlainText) ? "igm" : "ig";
        var regEx = new RegExp(this.expression, regexFlags);
        var match;
        
        while (match = regEx.exec(text)) {
           
          
          var startPos = activeEditor.document.positionAt(match.index);
          var endPos = activeEditor.document.positionAt(match.index + match[0].length);
          var range = { range: new vscode.Range(startPos, endPos) };
          // Required to ignore the first line of .py files (#61)
          if (this.ignoreFirstLine && startPos.line === 0 && startPos.character === 0) {
              continue;
          }
        
          // Find which custom delimiter was used in order to add it to the collection
          var matchTag = this.tags.find(function (item) { 
            
            return item.tag.toLowerCase() === match[3].toLowerCase(); });
          
          if (matchTag) {
              matchTag.ranges.push(range);
          }   
          
        }
    };
}