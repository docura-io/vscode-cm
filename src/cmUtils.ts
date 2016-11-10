'use strict';

import vscode = require('vscode');
var fs = require('fs'),
    path = require('path');

export interface CurrentSymbol {
    varName: string;
    memberName?: string;
}

export class cmUtils {

    static packageFileUsings(): string[] {
        let folder = vscode.window.activeTextEditor.document.uri.fsPath;
        folder = folder.substring( 0, folder.lastIndexOf('\\') );
        
        var contents = fs.readFileSync(path.join(folder, "package.cm"), 'utf8');
        var lines = contents.split('\r\n');
        var usings: string[] = [];

        lines.forEach((l) => {
            if (l == "") return;
            let match = /^\s*?use\s+(.*);$/.exec(l);

            if (match) {
                usings.push(match[1]);
            }
        });

        return usings;
    }
    
    /**
     * Gets the current CM Package based on the open folder
     */
    static getCurrentPackage(): string {
        var root = vscode.workspace.rootPath;
        var toMatch = "\\home\\";
        var matchIndex = root.indexOf("\\home\\");

        if (matchIndex > -1) {
            root = root.substring(matchIndex + toMatch.length).replace('\\', '.');
        }

        return root;
    }
    
    static getDirsUnder( symPath: string, parent: string ): string[] {
        let dirs = fs.readdirSync(symPath)
            .filter((file) => {
                return file != ".vscode" && file != ".git" && fs.statSync(path.join( symPath, file)).isDirectory();
            })
            .map( (file) => {
                return {
                    name: file, 
                    path: parent ? parent + "." + file : file
                }
            });
        
        let subDirs = [];
        
        dirs.forEach(dir => {
            subDirs = subDirs.concat( this.getDirsUnder( path.join( symPath, dir.name ), dir.path ) );
        });
        
        return dirs.map( (d) => { return d.path } ).concat(subDirs);
    }
    
    /**
     * Gets the current CM Package based on the open folder
     */
    static getPackagesInCurrentPackage(): string[] {
        var root = vscode.workspace.rootPath;

        var dirs = this.getDirsUnder( root, "" );

        var curPackage = cmUtils.getCurrentPackage();

        dirs = dirs.filter( (part) => {
            const packFile = path.join( root, part.replace(/\./g, '\\' ) ) + "\\package.cm";
            return fs.existsSync( packFile );
        } );

        dirs.forEach((part, index) => {
            dirs[index] = `${curPackage}.${part}`
        });

        dirs.unshift(curPackage);
        
        // this.packageFileUsings().forEach( (i) => {
        //     dirs.push( i );
        // });
        
        return dirs;
    }
    
    /**
     * Gets the dotted string of the current command being typed
     */
    static getObjectNameForMember(document: vscode.TextDocument, varName: string): CurrentSymbol {
        var items = varName.split('.');

        var obj: CurrentSymbol = {
            varName: items[0]
        };

        if (items.length > 1) {
            obj.memberName = items[items.length - 1];
        }

        return obj;
    }

    static getWordAtCursor(document: vscode.TextDocument, position: vscode.Position) {
        var wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return "";
        return document.getText(wordRange);
    }
    
    /**
     * Checks to see if the current word is a member of another object.
     */
    // static getObjectNameForMember( document: vscode.TextDocument, position: vscode.Position ): CurrentSymbol {
    //     var wordAtPosition = document.getWordRangeAtPosition( position );
    //     if ( !wordAtPosition ) {
    //         wordAtPosition = new vscode.Range( position, position );
    //     }
    //     var prevWordPosition = new vscode.Position( wordAtPosition.start.line, wordAtPosition.start.character - 2 );
    //     document.validatePosition( prevWordPosition );
    //     var wordAtPrevPosition = document.getWordRangeAtPosition( prevWordPosition );
        
    //     // make sure we found a word
    //     if ( wordAtPrevPosition ) {
    //         var fullRange = new vscode.Range( wordAtPrevPosition.start, wordAtPosition.end );
    //         var content = document.getText( fullRange );
    //         if ( content.indexOf( "." ) > -1 ) {
    //             // this is a method / member call
    //             return {
    //                 varName: document.getText(wordAtPrevPosition),
    //                 memberName: document.getText(wordAtPosition)
    //             };
    //         }    
    //     }
        
    //     return {
    //         varName: document.getText(wordAtPosition)
    //     };
    // }
    
    static getUsingStatements(document: vscode.TextDocument): string[] {
        var packageRegex = /package\s+([\w\.]+)\s*;/i;
        var singleUseRegex = /use\s+([\w\.]+)\s*;/gmi;
        var multiUseRegexPrefix = /use\s+(\w+)\s*:\s*([^;]*)/gmi;

        var contents = document.getText();

        var match, matches = [];

        match = contents.match(packageRegex)

        if (match && match.length > 0) {
            matches.push(match[1]);
        }

        while (match = singleUseRegex.exec(contents)) {
            matches.push(match[1]);
        }

        while (match = multiUseRegexPrefix.exec(contents)) {
            var prefix = match[1];
            var list: string = match[2];
            var items = list.split(',');

            items.forEach((i) => {
                matches.push(`${prefix}.${i.trim()}`);
            });
        }

        var globalUsings = cmUtils.packageFileUsings();

        var results = [];

        globalUsings.forEach((u) => {
            results.push(u);
        });

        matches.forEach((u) => {
            if (results.indexOf(u) < 0) results.push(u);
        });

        return results;
    }

    static getDottedCallsForLine(document: vscode.TextDocument, position: vscode.Position): string {
        return cmUtils.getDottedCallsFromString(
            document.getText(new vscode.Range(document.positionAt(0), position)),
            document.offsetAt(position)
        );
    }

    static getDottedCallsFromString(inputFile: string, index: number): string {
        var lineExtracted = false;
        var statementStack = [];
        var lineOfCode = [];
        let lineTerminators = [ ";","{","}","=",",","(","?" ];

        while (!lineExtracted) {
            if (index < 0) {
                lineExtracted = statementStack.length == 0;
                break;   
            }
            var currentChar = inputFile.charAt(index);
            var shouldPush = false;

            var peek = statementStack[statementStack.length - 1];

            if ( lineTerminators.indexOf( currentChar ) > -1 ) {
                if (statementStack.length == 0) {
                    index++;
                    lineExtracted = true;
                    break;
                } else if (currentChar == "(" && peek == ")") {
                    statementStack.pop();
                }
            } else if (currentChar == '"') {
                // check to make sure this isn't an escaped "
                var nestedQuote = index > 0 && inputFile.charAt(index - 1) == '\\';
                if (!nestedQuote) {
                    shouldPush = statementStack.length == 0 || peek == ')';
                    if (peek == '"') {
                        statementStack.pop();
                    } else if (!shouldPush) {
                        // if it shouldn't be pushed, and wasn't in a string, we have a problem
                        console.log('Statement format error');
                        break;
                    }
                }
            } else if (currentChar == ')') {
                // if the stack is empty, or it's inside another statement, add this one
                shouldPush = statementStack.length == 0 || peek == ')';
            }

            if (shouldPush) statementStack.push(currentChar);
            if (statementStack.length == 0 && currentChar != '(') lineOfCode.push(currentChar);
            index--;
        }

        if (!lineExtracted) {
            console.log("Couldn't Parse");
            //console.log( inputFile.substr( index, position.character - index ).trim() )
        }
        if (lineExtracted) {
            var properLine = lineOfCode.reverse().join('').trim(); 
            //console.log( properLine );
            var match = properLine.match( /(?:public\s+)?class\s+\w+\s+extends\s+(.*)/ );
            if ( match )  {            
                return match[1];
            }
            return properLine.replace(/(\/\/.*(?:\n|\r\n|\n\r))/, '' ).trim();
        }
    }
    
    private static timeout: number;
    
    static debounce( func: () => void, wait: number, immediate: boolean ): void {
        let args = arguments;
        let timeOut = cmUtils.timeout;
        let context = this;
        
        let later = () => {
            timeOut = null;
            if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeOut;
        clearTimeout(timeOut);
        cmUtils.timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    }
    
    static addCopyright( uri: vscode.Uri ) {
        var copy = 
`/** Configura CET Source Copyright Notice (CETSC)

   This file contains Configura CM source code and is part of the
   Configura CET Development Platform (CETDEV). Configura CM
   is a programming language created by Configura Sverige AB.
   Configura, Configura CET and Configura CM are trademarks of
   Configura Sverige AB. Configura Sverige AB owns Configura CET,
   Configura CM, and CETDEV.

   Copyright (C) 2004 Configura Sverige AB, All rights reserved.

   You can modify this source file under the terms of the Configura CET
   Source Licence Agreement (CETSL) as published by Configura Sverige AB.

   Configura Sverige AB has exclusive rights to all changes, modifications,
   and corrections of this source file. Configura Sverige AB has exclusive
   rights to any new source file containing material from this source file.
   A new source file based on this source file or containing material from
   this source file has to include this Configura CET Source Copyright Notice
   in its full content. All changes, modifications, and corrections mentioned
   above shall be reported to Configura Sverige AB within One Month from
   the date that the modification occurred.

   Configura CM is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
   See the CETSL for more details.

   You should have received a copy of the CETSL along with the CETDEV.
   If not, write to Configura Sverige AB, Box 306, SE-581 02 Linköping, Sweden.
   Tel +46 13377800, Fax +46 13377855,
   Email: info@configura.com, www.configura.com

   END OF CETSC
*/

package {Package};

public class {Class} {
    public constructor() {
    }   
}`;
        var pkg = vscode.workspace.asRelativePath( uri );
        
        pkg = pkg.substring( 0, pkg.lastIndexOf( '/' ) ).replace( /\//g, '.' );
        pkg = pkg == "" ? "" : '.' + pkg;

        let nameSpace = cmUtils.getCurrentPackage() + pkg;
        
        // add comment to top of file
        vscode.workspace.openTextDocument( uri )
        .then( (doc) => {
            if ( doc.lineCount > 1 ) return;
            if ( doc.lineAt( 0 ).text.match( /Configura CET Source Copyright Notice/ ) ) { // it's already got the copyright, so don't add it again
                return;
            }
            vscode.window.showTextDocument( doc )
                .then( (editor) => {
                    editor.edit( (edit) => {
                        edit.insert( new vscode.Position( 0, 0 ), copy.replace( "{Package}", nameSpace ).replace( "{Class}", uri.path.substring( uri.path.lastIndexOf( '/' ) + 1, uri.path.lastIndexOf( '.' ) ) ) );
                    } )
                    .then( (res) => {
                        const fileStart = new vscode.Position( 0, 0 );
                        editor.selection = new vscode.Selection(fileStart, fileStart);
                    })
                        // return vscode.commands.executeCommand( "editor.fold" )
                    .then( (res) => {
                        const newPosition = new vscode.Position( 39, 4 );
                        const newSelection = new vscode.Selection(newPosition, newPosition);
                        editor.selection = newSelection;
                        
                        editor.revealRange( editor.selection, vscode.TextEditorRevealType.InCenter );
                        
                        doc.save();  
                                
                            // });
                    })                    
                } )
        });
    }

    static createResourceTemplate(uri: vscode.Uri) {
        var template =
`package {Package};

$ {
    english "";
}`;

        var pkg = vscode.workspace.asRelativePath( uri );
        
        pkg = pkg.substring( 0, pkg.lastIndexOf( '/' ) ).replace( /\//g, '.' );
        pkg = cmUtils.getCurrentPackage() + '.' + pkg;
        
        // add comment to top of file
        vscode.workspace.openTextDocument( uri )
        .then( (doc) => {
            if ( doc.lineCount > 1 ) return;
            if ( doc.lineAt( 0 ).text.match( /package / ) ) return;

            vscode.window.showTextDocument( doc )
                .then( (editor) => {
                    editor.edit( (edit) => {
                        edit.insert( new vscode.Position( 0, 0 ), template.replace( "{Package}", pkg ));
                    } )
                    .then( (res) => {
                        const fileStart = new vscode.Position( 0, 0 );
                        editor.selection = new vscode.Selection(fileStart, fileStart);
                    })
                    .then( (res) => {
                        const newPosition = new vscode.Position( 2, 1 );
                        const newSelection = new vscode.Selection(newPosition, newPosition);
                        editor.selection = newSelection;
                        
                        editor.revealRange( editor.selection, vscode.TextEditorRevealType.InCenter );
                        
                        doc.save();
                    })                    
                } )
        });
    }
}