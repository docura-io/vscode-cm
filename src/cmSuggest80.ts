'use strict';

import { CancellationToken, CompletionItem, CompletionItemProvider, CompletionList, Position, Range, SnippetString, TextDocument } from 'vscode';
import { getCompiler } from './extension';
import { CodeStatement } from './cmCompilerAdapter';
import { cmConfig } from './cmConfig';

import fs = require('fs');

export class CM80CompletionItemProvider implements CompletionItemProvider {

    private compiler = getCompiler();

    constructor() { 
        console.log(`Starting CM8.0 Suggestion Provider...`)
    }

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Thenable<CompletionList> {
        return new Promise( (resolve, reject) => {
            
            const prevChar = document.getText( new Range( position.translate(0, -1), position  ) );

            document.save()
            .then( () => {

                this.compiler.runStatement( {
                    start: false,
                    code: `cvm_ac(\"${document.fileName.replace( /\\/g, '/' )}\", ${this.getOffset(document, position)});`,
                    successEx: /\(load.[^\)]*\)/,
                    failureEx: /\(cm-ac-result-none\)/,
                    doNotClear: true
                } )
                .then( () => {
                    console.log('CM AC Success');
                    fs.readFile( cmConfig.cmRoot() + "/write/cm-ac-candidates.el", "utf-8", (err, data) => {
                        if ( err ) reject();
                        var items: CompletionItem[] = [];
                        let regex = new RegExp( `\\(cm-ac1\\s"(.[^"]*)"\\s"(.[^"]*)"\\s"(.[^"]*)"\\s\\(cons\\s\\(cm-ac-url\\s(\\d*)\\)\\s(\\d*)\\)\\)`, "g" );
                        var match = null;
                        while( match = regex.exec(data) ) {
                            var item = new CompletionItem( `${match[1]}${match[2]}` );
                            var params = match[2].match( /(\w+?\s\w+(?:=\w*)?)/g );
                            var rtnType = /(\w+$)/.exec(match[2]);

                            if ( match[2].match( /^\s->\s/ ) ) {
                                item.insertText = match[1];
                            } else {
                                var snipStr = match[1] + "(";
                                if ( params ) {
                                    var count = 1;
                                    params.forEach(element => {
                                        snipStr += " ${" + count++ + ":" + element + "},";
                                    });
                                } else {
                                    snipStr += ",";
                                }

                                // item.insertText = new SnippetString( match[1] + "( ${1:int a}, ${2:int b} )" );
                                /*
                                console.log("---START---");
                                console.log(snipStr);
                                console.log("---END---")
                                */
                                item.insertText = new SnippetString( snipStr.substring( 0, snipStr.length - 1 ) + " )" );
                            }
                            items.push(item);
                        }
                        
                        // resolve(new CompletionList( items, prevChar == "." ) );
                        resolve(new CompletionList( items, true ) );
                    } );
                }, () => {
                    console.log('CM AC Failure');
                    reject();
                });
            });
        })
    }

    private getOffset( document: TextDocument, position: Position ): number {
        var offset = document.offsetAt( position );
        offset += 1 - position.line; // emacs is 1 based, and it treats line end as 1 character not 2
        return offset;
    }
}