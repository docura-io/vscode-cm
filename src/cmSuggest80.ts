'use strict';

import { CancellationToken, CompletionItem, CompletionItemProvider, CompletionList, Position, Range, SnippetString, TextDocument, CompletionItemKind } from 'vscode';
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
                        
                        const allMatches = this.getAllMatches(data);
                        var items: CompletionItem[] = [];
                        
                        this.getFieldCalls( allMatches, items );
                        this.getClassTypes( allMatches, items );
                        this.getOverrides( allMatches, items );
                        
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

    private getOverrides( data: string[], items: CompletionItem[] ) {
        data.forEach( d => {
            let match = /\(cm-ac1\s"(.[^"]*)"\snil\s'\(\d+\s\.\s\"(.[^"]*)".*\)\)/g.exec(d);
            if ( !match ) return;

            var name = "";
            var index = match[1].indexOf("\"");
            while( true ) {
                index++;
                let next = match[1][index]
                if ( next == "(" ) break;
                name += next;
            }

            var item = new CompletionItem( name, CompletionItemKind.Function );
            item.insertText = match[2] + " " + match[1];

            items.push( item );
        });
    }

    private getClassTypes( data: string[], items: CompletionItem[] ) {
        data.forEach( d => {
            let match = /\(cm-ac1\s"(.[^"]*)"\snil\s'[^\(].*\)\)/g.exec(d);
            if ( !match ) return;
            var item = new CompletionItem( match[1], CompletionItemKind.Class );
            item.insertText = match[1];

            items.push( item );
        });
    }

    private getFieldCalls( data: string[], items: CompletionItem[] ) {
        data.forEach( d => {
            let match = /\(cm-ac1\s"(.[^"]*)"\s"(.[^"]*)"\s"(.[^"]*)"\s\(cons\s\(cm-ac-url\s(\d*)\)\s(\d*)\)\)/g.exec(d);
            if ( !match ) return;

            var type: CompletionItemKind;
            if ( match[2].startsWith( "(" )  ) type = CompletionItemKind.Method;
            else if ( match[2].startsWith( " -> " ) ) type = CompletionItemKind.Property;

            var item = new CompletionItem( `${match[1]}${match[2]}`, type );
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
                var snip = snipStr.substring( 0, snipStr.length - 1 );
                if ( snip.endsWith( "(" ) ) {
                    snip += ")";
                } else {
                    snip += " )";
                }
                
                item.insertText = new SnippetString( snip );
                item.detail = match[1];
                item.documentation = "returns " + ( rtnType ? rtnType[0] : "void" );
            }
            items.push(item);
        } );
    }

    private getAllMatches( data : string ): string[] {
        var items: string[] = [];
        let regex = /\(cm-ac1\s(?:(?!\)\))(?:.|\r|\n))*\)\)/g;
        var match = null;
        while( match = regex.exec(data) ) {
            items.push( match[0] );
        }

        return items;
    }
}