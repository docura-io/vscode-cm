'use strict';

import * as vscode from 'vscode';

const path = require("path");

import {TextDocument, CancellationToken, ProviderResult} from 'vscode';

export class CMFileSymbolProvider implements vscode.DocumentSymbolProvider {
    public provideDocumentSymbols(document: vscode.TextDocument, token: CancellationToken): ProviderResult<vscode.SymbolInformation[]> {
        let symbols: vscode.SymbolInformation[] = [];

        searches.forEach( s => {
            const txt = document.getText();
            var match: RegExpExecArray;
            while( ( match = s.regex.exec(txt) ) !== null ) {
                if ( s.nested !== undefined ) {
                    var childMatch: RegExpExecArray;
                    while( ( childMatch = s.nested.regex.exec(match[2]) ) !== null ) {
                        var childPos = document.positionAt( match.index + childMatch.index );
                        let si = new vscode.SymbolInformation(
                            this.getNameFromKind( childMatch, s.nested.kind ),
                            s.nested.kind,
                            match[1],
                            new vscode.Location( document.uri, childPos )
                        );
                        symbols.push( si );
                    }
                } else {
                    var pos = document.positionAt( match.index );
                    let si = new vscode.SymbolInformation(
                                this.getNameFromKind( match, s.kind ),
                                s.kind,
                                this.getDetailFromKind( match, s.kind ),
                                new vscode.Location( document.uri, pos )
                            );
                    symbols.push( si );
                }

                // if ( true ) {
                    // si.tags = [vscode.SymbolTag.Deprecated];
                // }
            } 
        });

        return Promise.resolve(symbols);
    }

    private getDetailFromKind( match: RegExpExecArray, kind: vscode.SymbolKind ): string {
        if ( kind == vscode.SymbolKind.Method ) {
            return match[4] ?? "";
        } else if ( kind == vscode.SymbolKind.Class ) {
                return match[2] ?? "";
        } else if ( kind == vscode.SymbolKind.Field ) {
            return match[1] ?? "";
        } else if ( kind == vscode.SymbolKind.Constant ) {
            return match[3] ?? "";
        }
        return "";
    }

    private getNameFromKind( match: RegExpExecArray, kind: vscode.SymbolKind ): string {
        if ( kind == vscode.SymbolKind.Class ) {
            return match[1];
        } else if ( kind == vscode.SymbolKind.Method ) {
            return `${match[2]}(${match[3]}) : ${match[1]}`;
        } else if ( kind == vscode.SymbolKind.Property || kind == vscode.SymbolKind.Constant ) {
            return `${match[2]} : ${match[1]}`;
        } else if ( kind == vscode.SymbolKind.Constructor ) {
            if ( match[1].indexOf("auto()") > -1 ) {
                return `constructor auto()`;
            }
            return `constructor(${match[2]})`;
        } else if ( kind == vscode.SymbolKind.Enum ) {
            return match[1];
        } else if ( kind == vscode.SymbolKind.EnumMember ) {
            return match[1];
        } else if ( kind == vscode.SymbolKind.Operator ) {
            // return `operator ${match[1].replace("<<", "\u00AB")}`;
            return `operator ${match[1]}`;
        } else if ( kind == vscode.SymbolKind.Field ) {
            return match[2];
        }
        else {
            return match[1];
        }
    }
/*
    public resolveWorkspaceSymbol(symbol: SymbolInformation, token: CancellationToken): ProviderResult {

    }
    */
}

/*
    export enum SymbolKind {
        File = 0,
        Module = 1,
        Namespace = 2,       
        Package = 3,         package
        Class = 4,
        Method = 5,
        Property = 6,       maybe swap this to field?
        Field = 7,
        Constructor = 8,    public constructor() {} / public constructor auto();
        Enum = 9,           public enum NAME : field acccess { .. }
        Interface = 10,
        Function = 11,
        Variable = 12,
        Constant = 13,      public const type name
        String = 14,
        Number = 15,
        Boolean = 16,
        Array = 17,
        Object = 18,
        Key = 19,
        Null = 20,
        EnumMember = 21,   we can do this
        Struct = 22,       public value name : create box {...}
        Event = 23, 
        Operator = 24,     extend public RTN operator<<(Type t) {
        TypeParameter = 25
    }
*/

// deprecated stuff has : deprecated
// enums -> public enum NAME : field acccess { .. }

// :?\s*([a-zA-z=,\s]*)\s*

const searches = [
    {
        regex: /\bpackage\s+([a-zA-Z][_a-zA-Z0-9.]*)/g,
        kind: vscode.SymbolKind.Package
    },
    {
        regex: /\b(?:public|package|private)\s+(constructor\s*(?:auto)?\s*\((.*)\))\s*(?:{|;)/g,
        kind: vscode.SymbolKind.Constructor
    },
    {
        regex: /\b(?:public|package|private)\s+enum\s+([a-zA-Z<](?:[a-zA-Z0-9])*)\s*?(?::\s)(.*?)(?=\s*\{)/g,
        kind: vscode.SymbolKind.Enum
    },
    {
        regex: /\senum\s([^{\s]*)\s*\{([^}]*)\}/g,
        nested: {
            regex: /([a-zA-Z<](?:[a-zA-Z0-9])*)/g,
            kind: vscode.SymbolKind.EnumMember
        }
    },
    { 
        regex: /\b(?:public|package|private)\s+value\s+([a-zA-Z][_a-zA-Z0-9]*)/g, 
        kind: vscode.SymbolKind.Struct 
    },
    { 
        regex: /\b(?:public|package|private)\s+class\s+([a-zA-Z][_a-zA-Z0-9]*)\s*?(?:(?::\s)(.*?))?(?=\s*\{)/g, 
        kind: vscode.SymbolKind.Class 
    },
    { 
        regex: /(?:extend\s+)?(?:public|package|private)\s+([a-zA-Z<](?:[_\-\>,\sa-zA-Z0-9]|\{\}|\[\])*)\s+([a-zA-Z<][_>,\sa-zA-Z0-9]*)\s*\((.*)(?=\)\s*(?:(?::\s)(.*?))?\s*\{.*)/g, 
        kind: vscode.SymbolKind.Method 
    },
    {
        regex: /[a-zA-Z][_a-zA-Z0-9]*\soperator\s*([^\s(]*)/g,
        kind: vscode.SymbolKind.Operator
    },
    { 
        regex: /(?:public|package|private)\s+((?!const\s)[a-zA-Z<](?:[_\-\>,\sa-zA-Z0-9]|\{\}|\[\])*)\s+([a-zA-Z][_a-zA-Z0-9]*)\s*?(?:(?::\s)(.*?))?(?=\s*;)/g, 
        kind: vscode.SymbolKind.Field 
    },
    {
        regex: /(?:public|package|private)\s+const\s+([a-zA-Z<](?:[_\-\>,\sa-zA-Z0-9]|\{\}|\[\])*)\s+([a-zA-Z][_a-zA-Z0-9]*)\s*(?:=\s*(.*))?(?=\s*;)/g,
        kind: vscode.SymbolKind.Constant
    }
];